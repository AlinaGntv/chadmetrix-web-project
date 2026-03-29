# backend/payments.py
import uuid
import base64
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from database import get_db
from models.models import Payment, User, Tariff
from auth import get_current_user
from datetime import datetime, timedelta
import os

router = APIRouter(prefix="/api/payments", tags=["payments"])

YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID")
YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY")
YOOKASSA_API_URL = os.getenv("YOOKASSA_API_URL", "https://api.yookassa.ru/v3/")

def get_auth_headers():
    credentials = base64.b64encode(f"{YOOKASSA_SHOP_ID}:{YOOKASSA_SECRET_KEY}".encode()).decode()
    return {
        "Authorization": f"Basic {credentials}",
        "Content-Type": "application/json",
        "Idempotence-Key": str(uuid.uuid4())
    }

# ========== ПРИВЯЗКА КАРТЫ (Нулевая сумма) ==========

# backend/payments.py — ключевые изменения

# ========== ПРИВЯЗКА КАРТЫ ==========
@router.post("/bind-card")
async def bind_card_init(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Привязка карты. В тестовом магазине ЮKassa не принимает 0.00, 
    используем минимальную сумму 1.00 руб (потом можно вернуть)
    """
    idempotence_key = str(uuid.uuid4())
    headers = get_auth_headers()
    headers["Idempotence-Key"] = idempotence_key
    
    # Для тестового магазина: минимум 1.00, для продакшена можно 0.00
    is_test_shop = "test" in YOOKASSA_SHOP_ID or len(YOOKASSA_SHOP_ID) < 6
    bind_amount = "1.00" if is_test_shop else "0.00"
    
    payload = {
        "amount": {
            "value": bind_amount,
            "currency": "RUB"
        },
        "capture": True,  # Сразу списываем (возврат потом если нужно)
        "confirmation": {
            "type": "redirect",
            "return_url": f"https://chadmetrix.ru/dashboard/subscription?bind=success"
        },
        "description": f"Привязка карты (User: {current_user.id[:8]}...)",
        "save_payment_method": True,
        "metadata": {
            "user_id": current_user.id,
            "action": "bind_card",
            "is_test": is_test_shop
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{YOOKASSA_API_URL}payments",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            raise HTTPException(400, f"YooKassa error: {response.text}")
        
        data = response.json()
        
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=1.00 if is_test_shop else 0,  # Сохраняем реальную сумму
            status="pending",
            yookassa_payment_id=data["id"],
            payment_type="bind_card",
            meta=json.dumps({"action": "bind_card", "amount": bind_amount})
        )
        db.add(payment)
        db.commit()
        
        return {
            "confirmation_url": data["confirmation"]["confirmation_url"],
            "payment_id": data["id"],
            "test_mode": is_test_shop,
            "amount": bind_amount
        }

# ========== РАЗОВАЯ ОПЛАТА (БЕЗ СОХРАНЕНИЯ КАРТЫ) ==========

@router.post("/create-onetime")
async def create_onetime_payment(
    tariff_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tariff = db.query(Tariff).filter(Tariff.id == tariff_id).first()
    if not tariff:
        raise HTTPException(404, "Tariff not found")
    
    idempotence_key = str(uuid.uuid4())
    headers = get_auth_headers()
    headers["Idempotence-Key"] = idempotence_key
    
    payload = {
        "amount": {
            "value": str(tariff.price),
            "currency": "RUB"
        },
        "capture": True,
        "confirmation": {
            "type": "redirect",
            "return_url": f"https://chadmetrix.ru/dashboard?payment=success"
        },
        "description": f"Разовый анализ внешности — {tariff.name}",
        "metadata": {
            "user_id": current_user.id,
            "tariff_id": tariff_id,
            "action": "onetime_payment"
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{YOOKASSA_API_URL}payments",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            raise HTTPException(400, f"YooKassa error: {response.text}")
        
        data = response.json()
        
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=tariff.price,
            status="pending",
            yookassa_payment_id=data["id"],
            tariff_id=tariff_id,
            payment_type="onetime",
            meta=json.dumps({"onetime": True})
        )
        db.add(payment)
        db.commit()
        
        return {
            "confirmation_url": data["confirmation"]["confirmation_url"],
            "payment_id": data["id"]
        }

# ========== ОПЛАТА С СОХРАНЕНИЕМ КАРТЫ (Подписки) ==========

@router.post("/create-with-binding")
async def create_payment_with_binding(
    tariff_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tariff = db.query(Tariff).filter(Tariff.id == tariff_id).first()
    if not tariff:
        raise HTTPException(404, "Tariff not found")
    
    idempotence_key = str(uuid.uuid4())
    headers = get_auth_headers()
    headers["Idempotence-Key"] = idempotence_key
    
    payload = {
        "amount": {
            "value": str(tariff.price),
            "currency": "RUB"
        },
        "capture": True,
        "confirmation": {
            "type": "redirect",
            "return_url": f"https://chadmetrix.ru/dashboard?payment=success"
        },
        "description": f"Оплата подписки {tariff.name}",
        "save_payment_method": True,
        "metadata": {
            "user_id": current_user.id,
            "tariff_id": tariff_id,
            "action": "payment_with_binding"
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{YOOKASSA_API_URL}payments",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            raise HTTPException(400, f"YooKassa error: {response.text}")
        
        data = response.json()
        
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=tariff.price,
            status="pending",
            yookassa_payment_id=data["id"],
            tariff_id=tariff_id,
            payment_type="subscription",
            meta=json.dumps({"save_payment_method": True})
        )
        db.add(payment)
        db.commit()
        
        return {
            "confirmation_url": data["confirmation"]["confirmation_url"],
            "payment_id": data["id"]
        }

# ========== АВТОПЛАТЕЖ ==========

@router.post("/auto-payment")
async def create_auto_payment(
    tariff_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.payment_method_id:
        raise HTTPException(400, "No saved payment method")
    
    if not current_user.auto_payment_enabled:
        raise HTTPException(400, "Auto payments disabled")
    
    tariff = db.query(Tariff).filter(Tariff.id == tariff_id).first()
    if not tariff:
        raise HTTPException(404, "Tariff not found")
    
    idempotence_key = str(uuid.uuid4())
    headers = get_auth_headers()
    headers["Idempotence-Key"] = idempotence_key
    
    payload = {
        "amount": {
            "value": str(tariff.price),
            "currency": "RUB"
        },
        "capture": True,
        "payment_method_id": current_user.payment_method_id,
        "description": f"Автопродление подписки {tariff.name}",
        "metadata": {
            "user_id": current_user.id,
            "tariff_id": tariff_id,
            "action": "auto_payment"
        }
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{YOOKASSA_API_URL}payments",
            headers=headers,
            json=payload
        )
        
        if response.status_code != 200:
            raise HTTPException(400, f"Auto payment failed: {response.text}")
        
        data = response.json()
        
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=tariff.price,
            status=data["status"],
            yookassa_payment_id=data["id"],
            tariff_id=tariff_id,
            payment_method_id=current_user.payment_method_id,
            payment_type="auto_payment",
            meta=json.dumps({"auto": True})
        )
        db.add(payment)
        
        if data["status"] == "succeeded":
            current_user.tariff_expire = datetime.utcnow() + timedelta(days=30)
            current_user.photo_uses_remaining += tariff.reports_count
        
        db.commit()
        
        return {
            "status": data["status"],
            "payment_id": data["id"]
        }

# ========== УПРАВЛЕНИЕ КАРТОЙ ==========

@router.delete("/payment-method")
async def remove_payment_method(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.payment_method_id:
        raise HTTPException(404, "No saved payment method")
    
    current_user.payment_method_id = None
    current_user.auto_payment_enabled = False
    db.commit()
    
    return {"message": "Payment method removed"}

@router.get("/payment-method")
async def get_payment_method(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not current_user.payment_method_id:
        return {
            "has_payment_method": False,
            "auto_payment_enabled": False
        }
    
    return {
        "has_payment_method": True,
        "payment_method_id": current_user.payment_method_id,
        "auto_payment_enabled": current_user.auto_payment_enabled,
        "last4": "4242",
        "card_type": "Visa"
    }

# ========== WEBHOOK ==========

@router.post("/webhook")
async def yookassa_webhook(
    request: Request,
    db: Session = Depends(get_db)
):
    data = await request.json()
    event = data.get("event")
    payment_data = data.get("object", {})
    payment_id = payment_data.get("id")
    
    payment = db.query(Payment).filter(Payment.yookassa_payment_id == payment_id).first()
    
    if event == "payment.succeeded":
        if payment:
            payment.status = "succeeded"
            
            if "payment_method" in payment_data and payment_data["payment_method"]:
                method_id = payment_data["payment_method"].get("id")
                payment.payment_method_id = method_id
                
                meta = json.loads(payment.meta) if payment.meta else {}
                
                # Сохраняем карту только для подписок, не для разовых
                if meta.get("action") in ["bind_card", "payment_with_binding"]:
                    user = db.query(User).filter(User.id == payment.user_id).first()
                    if user:
                        user.payment_method_id = method_id
                        user.auto_payment_enabled = True
            
            # Активируем подписку
            if payment.tariff_id:
                user = db.query(User).filter(User.id == payment.user_id).first()
                tariff = db.query(Tariff).filter(Tariff.id == payment.tariff_id).first()
                if user and tariff:
                    user.tariff_type = tariff.name.lower().replace("подписка ", "").replace(" ", "_")
                    user.tariff_expire = datetime.utcnow() + timedelta(days=30)
                    user.photo_uses_remaining += tariff.reports_count
            
            db.commit()
        return {"status": "ok"}
    
    elif event == "payment.canceled":
        if payment:
            payment.status = "canceled"
            db.commit()
        return {"status": "ok"}
    
    return {"status": "ignored"}