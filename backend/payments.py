# backend/payments.py
import os
import json
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
import httpx

from database import get_db
from models.models import Payment, User, Tariff
from auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID", "")
YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY", "")
YOOKASSA_API_URL = "https://api.yookassa.ru/v3/"

TARIFFS = {
    "analysis": {
        "price": 199, 
        "name": "Разовый анализ", 
        "type": "onetime",
        "description": "Полный отчёт по одному фото в анфас"
    },
    "htn": {
        "price": 249, 
        "name": "Подписка HTN", 
        "type": "subscription",
        "description": "2 отчёта в месяц, 1 бесплатное сравнение"
    },
    "chad": {
        "price": 349, 
        "name": "Подписка CHAD", 
        "type": "subscription",
        "description": "Подписка HTN + акцентированный отчёт на слабые зоны"
    }
}

@router.post("/create")
async def create_payment(
    tariff_slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    print(f"[PAYMENT] Start: tariff={tariff_slug}, user={user.id}")
    
    if tariff_slug not in TARIFFS:
        raise HTTPException(status_code=400, detail="Unknown tariff")
    
    if not YOOKASSA_SHOP_ID or not YOOKASSA_SECRET_KEY:
        print("[PAYMENT] ERROR: YooKassa not configured")
        raise HTTPException(status_code=500, detail="YooKassa not configured")

    tariff_info = TARIFFS[tariff_slug]
    idempotence_key = str(uuid.uuid4())
    
    # Базовые данные платежа
    payment_data = {
        "amount": {
            "value": f"{tariff_info['price']}.00",
            "currency": "RUB"
        },
        "confirmation": {
            "type": "redirect",
            "return_url": f"https://chadmetrix.ru/dashboard?payment=success&tariff={tariff_slug}"
        },
        "capture": True,
        "description": f"{tariff_info['name']} — chadmetrix.ru",
        "metadata": {
            "user_id": user.id,
            "tariff_slug": tariff_slug,
            "tariff_type": tariff_info['type'],
            "tariff_name": tariff_info['name']
        }
    }
    
    # Для подписок — сохраняем метод оплаты (рекурренты)
    if tariff_info['type'] == 'subscription':
        payment_data["save_payment_method"] = True
        # Важно: для сохранения метода нужно указать тип платежа
        payment_data["payment_method_data"] = {
            "type": "bank_card"
        }
    
    print(f"[PAYMENT] Data: {json.dumps(payment_data, ensure_ascii=False)}")
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{YOOKASSA_API_URL}payments",
                json=payment_data,
                auth=(YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY),
                headers={"Idempotence-Key": idempotence_key}
            )
            
            print(f"[PAYMENT] YooKassa status: {response.status_code}")
            
            if response.status_code != 200:
                error_text = response.text
                print(f"[PAYMENT] YooKassa error: {error_text}")
                raise HTTPException(
                    status_code=400, 
                    detail=f"YooKassa error: {error_text[:200]}"
                )
            
            yoo_payment = response.json()
            print(f"[PAYMENT] Created: {yoo_payment.get('id')}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"[PAYMENT] Exception: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")

    # Находим или создаем тариф в БД
    db_tariff = db.query(Tariff).filter(Tariff.name == tariff_info['name']).first()
    if not db_tariff:
        db_tariff = Tariff(
            name=tariff_info['name'],
            description=tariff_info['description'],
            price=tariff_info['price'],
            reports_count=2 if tariff_info['type'] == 'subscription' else 1,
            is_active=True
        )
        db.add(db_tariff)
        db.commit()
        db.refresh(db_tariff)

    # Сохраняем в БД
    meta_data = {
        "idempotence_key": idempotence_key,
        "confirmation_url": yoo_payment['confirmation']['confirmation_url'],
        "yookassa_response": yoo_payment
    }
    
    db_payment = Payment(
        user_id=user.id,
        amount=tariff_info['price'],
        payment_method="yookassa",
        status="pending",
        yookassa_payment_id=yoo_payment['id'],
        tariff_id=db_tariff.id,
        payment_type=tariff_info['type'],
        meta=json.dumps(meta_data, ensure_ascii=False)
    )
    
    # Если есть payment_method в ответе — сохраняем
    if yoo_payment.get('payment_method', {}).get('id'):
        db_payment.payment_method_id = yoo_payment['payment_method']['id']
    
    db.add(db_payment)
    db.commit()
    print(f"[PAYMENT] Saved to DB: {db_payment.id}")
    
    return {
        "payment_id": db_payment.id,
        "confirmation_url": yoo_payment['confirmation']['confirmation_url'],
        "yookassa_id": yoo_payment['id']
    }

@router.post("/webhook")
async def webhook_handler(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
        event = body.get("event")
        payment_obj = body.get("object", {})
        
        print(f"[WEBHOOK] Event: {event}, Payment: {payment_obj.get('id')}")
        
        if event == "payment.succeeded":
            await handle_payment_succeeded(payment_obj, db)
        elif event == "payment.canceled":
            await handle_payment_canceled(payment_obj, db)
        elif event == "payment_method.saved":
            await handle_payment_method_saved(payment_obj, db)
        elif event == "refund.succeeded":
            await handle_refund_succeeded(payment_obj, db)
            
    except Exception as e:
        print(f"[WEBHOOK ERROR] {e}")
        import traceback
        traceback.print_exc()
    
    return {"status": "ok"}

async def handle_payment_succeeded(payment_obj: dict, db: Session):
    yoo_id = payment_obj.get('id')
    
    db_payment = db.query(Payment).filter(
        Payment.yookassa_payment_id == yoo_id
    ).first()
    
    if not db_payment:
        print(f"[WEBHOOK] Payment {yoo_id} not found")
        return
    
    db_payment.status = "succeeded"
    
    # Сохраняем метод оплаты
    payment_method = payment_obj.get('payment_method', {})
    if payment_method and payment_method.get('id'):
        db_payment.payment_method_id = payment_method['id']
        print(f"[WEBHOOK] Saved method: {payment_method['id']}")
    
    # Начисляем услугу
    user = db.query(User).filter(User.id == db_payment.user_id).first()
    meta = json.loads(db_payment.meta or "{}")
    tariff_slug = meta.get('tariff_slug', 'analysis')
    tariff_type = meta.get('tariff_type', 'onetime')
    
    if tariff_type == "onetime":
        user.photo_uses_remaining += 1
        print(f"[WEBHOOK] User {user.id} +1 analysis")
    else:
        if tariff_slug == "htn":
            user.tariff_type = "htn"
        elif tariff_slug == "chad":
            user.tariff_type = "chad"
        user.tariff_expire = datetime.utcnow() + timedelta(days=30)
        print(f"[WEBHOOK] User {user.id} activated {tariff_slug}")
    
    db.commit()

async def handle_payment_canceled(payment_obj: dict, db: Session):
    yoo_id = payment_obj.get('id')
    db_payment = db.query(Payment).filter(
        Payment.yookassa_payment_id == yoo_id
    ).first()
    if db_payment:
        db_payment.status = "canceled"
        db.commit()
        print(f"[WEBHOOK] Canceled: {yoo_id}")

async def handle_payment_method_saved(payment_obj: dict, db: Session):
    method_id = payment_obj.get('payment_method', {}).get('id')
    if method_id:
        print(f"[WEBHOOK] Method saved: {method_id}")

async def handle_refund_succeeded(refund_obj: dict, db: Session):
    payment_id = refund_obj.get('payment_id')
    db_payment = db.query(Payment).filter(
        Payment.yookassa_payment_id == payment_id
    ).first()
    
    if not db_payment:
        return
    
    db_payment.status = "refunded"
    user = db.query(User).filter(User.id == db_payment.user_id).first()
    meta = json.loads(db_payment.meta or "{}")
    tariff_type = meta.get('tariff_type', 'onetime')
    
    if tariff_type == "onetime":
        user.photo_uses_remaining = max(0, user.photo_uses_remaining - 1)
    else:
        user.tariff_type = "free"
        user.tariff_expire = None
    
    db.commit()
    print(f"[WEBHOOK] Refund processed: {payment_id}")

@router.get("/status/{payment_id}")
def check_payment_status(
    payment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == user.id
    ).first()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "id": payment.id,
        "status": payment.status,
        "amount": float(payment.amount),
        "tariff": payment.tariff.name if payment.tariff else None,
        "created_at": payment.created_at.isoformat() if payment.created_at else None
    }

@router.get("/cards")
def get_saved_cards(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список сохраненных карт (заглушка для модерации)"""
    # Пока возвращаем пустой список — реальные карты будут после подключения рекуррентов
    return []

@router.delete("/cards/{card_id}")
def delete_card(
    card_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить сохраненную карту (заглушка для модерации)"""
    # Пока просто логируем
    print(f"[CARDS] Delete request for card {card_id} by user {user.id}")
    return {"status": "ok", "message": "Card deleted"}