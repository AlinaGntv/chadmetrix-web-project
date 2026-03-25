import os
import json
import uuid
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Request, Header
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

# Используем HTTP API вместо SDK (проще для твоего случая)
import httpx

from database import get_db
from models.models import Payment, User, Tariff
from auth import get_current_user

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Конфигурация из env
YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID", "")
YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY", "")
YOOKASSA_API_URL = "https://api.yookassa.ru/v3/"

# Тарифы
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

def get_auth_headers():
    """Basic auth для ЮKassa"""
    import base64
    credentials = f"{YOOKASSA_SHOP_ID}:{YOOKASSA_SECRET_KEY}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {
        "Authorization": f"Basic {encoded}",
        "Content-Type": "application/json",
        "Idempotence-Key": str(uuid.uuid4())
    }

@router.post("/create")
async def create_payment(
    tariff_slug: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Создание платежа в ЮKassa
    tariff_slug: 'analysis', 'htn', 'chad'
    """
    if tariff_slug not in TARIFFS:
        raise HTTPException(status_code=400, detail="Unknown tariff")
    
    if not YOOKASSA_SHOP_ID or not YOOKASSA_SECRET_KEY:
        raise HTTPException(status_code=500, detail="YooKassa not configured")
    
    tariff_info = TARIFFS[tariff_slug]
    
    # Idempotency Key (важно!)
    idempotence_key = str(uuid.uuid4())
    
    # Формируем данные платежа
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
        },
        "save_payment_method": tariff_info['type'] == 'subscription'
    }
    
    # Создаем платеж в ЮKassa
    headers = get_auth_headers()
    headers["Idempotence-Key"] = idempotence_key
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{YOOKASSA_API_URL}payments",
            json=payment_data,
            headers=headers,
            auth=(YOOKASSA_SHOP_ID, YOOKASSA_SECRET_KEY)  # Basic auth
        )
        
        if response.status_code != 200:
            raise HTTPException(
                status_code=400, 
                detail=f"YooKassa error: {response.text}"
            )
        
        yoo_payment = response.json()
    
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
    db_payment = Payment(
        user_id=user.id,
        amount=tariff_info['price'],
        payment_method="yookassa",
        status="pending",
        yookassa_payment_id=yoo_payment['id'],
        tariff_id=db_tariff.id,
        meta=json.dumps({
            "idempotence_key": idempotence_key,
            "confirmation_url": yoo_payment['confirmation']['confirmation_url'],
            "yookassa_response": yoo_payment
        })
    )
    db.add(db_payment)
    db.commit()
    
    return {
        "payment_id": db_payment.id,
        "confirmation_url": yoo_payment['confirmation']['confirmation_url'],
        "yookassa_id": yoo_payment['id']
    }

@router.post("/webhook")
async def webhook_handler(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Обработка уведомлений от ЮKassa
    """
    try:
        body = await request.json()
        
        event = body.get("event")
        payment_obj = body.get("object", {})
        
        print(f"[YOOKASSA WEBHOOK] Event: {event}, Payment: {payment_obj.get('id')}")
        
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
    
    # Всегда 200 OK
    return {"status": "ok"}

async def handle_payment_succeeded(payment_obj: dict, db: Session):
    """Успешный платеж — начисляем услугу"""
    yoo_id = payment_obj.get('id')
    
    db_payment = db.query(Payment).filter(
        Payment.yookassa_payment_id == yoo_id
    ).first()
    
    if not db_payment:
        print(f"[WARN] Payment {yoo_id} not found")
        return
    
    # Обновляем статус
    db_payment.status = "succeeded"
    
    # Сохраняем метод оплаты для рекуррентов
    payment_method = payment_obj.get('payment_method', {})
    if payment_method and payment_method.get('id'):
        db_payment.payment_method_id = payment_method['id']
    
    # Получаем метаданные
    meta = json.loads(db_payment.meta or "{}")
    tariff_slug = meta.get('tariff_slug', 'analysis')
    tariff_type = meta.get('tariff_type', 'onetime')
    
    # Начисляем услугу пользователю
    user = db.query(User).filter(User.id == db_payment.user_id).first()
    
    if tariff_type == "onetime":
        # Разовый анализ: +1 к счетчику
        user.photo_uses_remaining += 1
        print(f"[SUCCESS] User {user.id} got +1 analysis")
        
    elif tariff_type == "subscription":
        # Подписка: активируем тариф на 30 дней
        if tariff_slug == "htn":
            user.tariff_type = "htn"
        elif tariff_slug == "chad":
            user.tariff_type = "chad"
            
        user.tariff_expire = datetime.utcnow() + timedelta(days=30)
        print(f"[SUCCESS] User {user.id} activated {tariff_slug} until {user.tariff_expire}")
    
    db.commit()

async def handle_payment_canceled(payment_obj: dict, db: Session):
    """Платеж отменен"""
    yoo_id = payment_obj.get('id')
    
    db_payment = db.query(Payment).filter(
        Payment.yookassa_payment_id == yoo_id
    ).first()
    
    if db_payment:
        db_payment.status = "canceled"
        db.commit()
        print(f"[CANCELED] Payment {yoo_id}")

async def handle_payment_method_saved(payment_obj: dict, db: Session):
    """Метод оплаты сохранен (для рекуррентов)"""
    payment_method = payment_obj.get('payment_method', {})
    method_id = payment_method.get('id')
    
    if method_id:
        print(f"[METHOD SAVED] Payment method {method_id}")

async def handle_refund_succeeded(refund_obj: dict, db: Session):
    """Возврат выполнен — откатываем услугу"""
    # Находим исходный платеж
    payment_id = refund_obj.get('payment_id')
    
    db_payment = db.query(Payment).filter(
        Payment.yookassa_payment_id == payment_id
    ).first()
    
    if not db_payment:
        return
    
    db_payment.status = "refunded"
    
    # Откатываем услугу
    user = db.query(User).filter(User.id == db_payment.user_id).first()
    meta = json.loads(db_payment.meta or "{}")
    tariff_type = meta.get('tariff_type', 'onetime')
    
    if tariff_type == "onetime":
        user.photo_uses_remaining = max(0, user.photo_uses_remaining - 1)
        print(f"[REFUND] User {user.id} lost 1 analysis")
        
    elif tariff_type == "subscription":
        user.tariff_type = "free"
        user.tariff_expire = None
        print(f"[REFUND] User {user.id} subscription deactivated")
    
    db.commit()

@router.get("/status/{payment_id}")
def check_payment_status(
    payment_id: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Проверить статус платежа"""
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