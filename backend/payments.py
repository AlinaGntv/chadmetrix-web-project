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

@router.post("/bind-card")
async def bind_card_init(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Привязка карты на нулевую сумму (без списания).
    Пользователь перенаправляется на форму ЮKassa для ввода данных карты.
    """
    idempotence_key = str(uuid.uuid4())
    headers = get_auth_headers()
    headers["Idempotence-Key"] = idempotence_key
    
    payload = {
        "amount": {
            "value": "0.00",
            "currency": "RUB"
        },
        "capture": True,
        "confirmation": {
            "type": "redirect",
            "return_url": f"https://chadmetrix.ru/dashboard/subscription?bind=success"
        },
        "description": f"Привязка карты для автоплатежей (User: {current_user.id})",
        "save_payment_method": True,  # Главный параметр для сохранения карты
        "metadata": {
            "user_id": current_user.id,
            "action": "bind_card"
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
        
        # Создаем платеж в БД со статусом pending
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=0,
            status="pending",
            yookassa_payment_id=data["id"],
            payment_type="bind_card",  # тип - привязка карты
            meta=json.dumps({"action": "bind_card"})
        )
        db.add(payment)
        db.commit()
        
        return {
            "confirmation_url": data["confirmation"]["confirmation_url"],
            "payment_id": data["id"]
        }

# ========== ОПЛАТА С СОХРАНЕНИЕМ КАРТЫ ==========

@router.post("/create-with-binding")
async def create_payment_with_binding(
    tariff_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Оплата тарифа с сохранением карты для будущих автоплатежей.
    """
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
        "description": f"Оплата тарифа {tariff.name}",
        "save_payment_method": True,  # Сохраняем карту!
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
            payment_type="subscription",  # подписка с сохранением карты
            meta=json.dumps({"save_payment_method": True})
        )
        db.add(payment)
        db.commit()
        
        return {
            "confirmation_url": data["confirmation"]["confirmation_url"],
            "payment_id": data["id"]
        }

# ========== АВТОПЛАТЕЖ (Рекуррентный) ==========

@router.post("/auto-payment")
async def create_auto_payment(
    tariff_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Проведение автоплатежа с сохраненной картой.
    Используется для продления подписки.
    """
    if not current_user.payment_method_id:
        raise HTTPException(400, "No saved payment method. Please bind card first.")
    
    if not current_user.auto_payment_enabled:
        raise HTTPException(400, "Auto payments disabled for this user.")
    
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
        "payment_method_id": current_user.payment_method_id,  # Используем сохраненную карту!
        "description": f"Автопродление подписки {tariff.name}",
        "metadata": {
            "user_id": current_user.id,
            "tariff_id": tariff_id,
            "action": "auto_payment",
            "is_recurring": True
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
        
        # Создаем запись платежа
        payment = Payment(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            amount=tariff.price,
            status=data["status"],  # usually "succeeded" for auto payments
            yookassa_payment_id=data["id"],
            tariff_id=tariff_id,
            payment_method_id=current_user.payment_method_id,
            payment_type="auto_payment",  # автоплатеж
            meta=json.dumps({"auto": True})
        )
        db.add(payment)
        
        # Если платеж успешен - продлеваем подписку
        if data["status"] == "succeeded":
            current_user.tariff_type = tariff.name.lower().replace("подписка ", "").replace(" ", "_")
            current_user.tariff_expire = datetime.utcnow() + timedelta(days=30)
            current_user.photo_uses_remaining += tariff.reports_count
        
        db.commit()
        
        return {
            "status": data["status"],
            "payment_id": data["id"],
            "message": "Auto payment processed successfully" if data["status"] == "succeeded" else "Payment pending"
        }

# ========== ОТВЯЗКА КАРТЫ ==========

@router.delete("/payment-method")
async def remove_payment_method(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Отключение автоплатежей (удаление сохраненной карты на нашей стороне).
    Согласно документации ЮKassa - удаляем только у себя в БД.
    """
    if not current_user.payment_method_id:
        raise HTTPException(404, "No saved payment method found")
    
    # Отключаем автоплатежи
    current_user.payment_method_id = None
    current_user.auto_payment_enabled = False
    
    # Также можно пометить все future payments как отмененные (опционально)
    
    db.commit()
    
    return {
        "message": "Payment method removed successfully. Auto payments disabled."
    }

# ========== ПОЛУЧЕНИЕ ИНФОРМАЦИИ О КАРТЕ ==========

@router.get("/payment-method")
async def get_payment_method(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Получить информацию о привязанной карте (если есть).
    """
    if not current_user.payment_method_id:
        return {
            "has_payment_method": False,
            "auto_payment_enabled": False
        }
    
    # Можно получить детали от ЮKassa если нужно
    return {
        "has_payment_method": True,
        "payment_method_id": current_user.payment_method_id,
        "auto_payment_enabled": current_user.auto_payment_enabled,
        "last4": "4242",  # Можно хранить в БД при получении webhook
        "card_type": "Visa"  # Можно хранить в БД
    }

# ========== ОБНОВЛЕННЫЙ WEBHOOK ==========

@router.post("/webhook")
async def yookassa_webhook(
    request: Request,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Обработка webhook от ЮKassa.
    Важно: здесь ловим payment_method_id при успешной привязке!
    """
    data = await request.json()
    event = data.get("event")
    payment_data = data.get("object", {})
    
    payment_id = payment_data.get("id")
    
    # Находим платеж в БД
    payment = db.query(Payment).filter(Payment.yookassa_payment_id == payment_id).first()
    
    if event == "payment.succeeded":
        if payment:
            payment.status = "succeeded"
            
            # !!! ВАЖНО: Сохраняем payment_method_id если он есть !!!
            if "payment_method" in payment_data and payment_data["payment_method"]:
                method_id = payment_data["payment_method"].get("id")
                method_type = payment_data["payment_method"].get("type")
                card_last4 = payment_data["payment_method"].get("card", {}).get("last4")
                card_type = payment_data["payment_method"].get("card", {}).get("card_type")
                
                # Сохраняем в платеж
                payment.payment_method_id = method_id
                
                # Если это привязка карты или оплата с сохранением - сохраняем для пользователя
                meta = json.loads(payment.meta) if payment.meta else {}
                if meta.get("action") in ["bind_card", "payment_with_binding"]:
                    user = db.query(User).filter(User.id == payment.user_id).first()
                    if user:
                        user.payment_method_id = method_id
                        user.auto_payment_enabled = True
                
                db.commit()
            
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