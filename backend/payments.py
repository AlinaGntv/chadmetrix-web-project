# backend/payments.py
import uuid
import base64
import json
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Query
from sqlalchemy.orm import Session
from database import get_db
from models.models import Payment, User, Tariff, Referral, Promocode, PromocodeUsage
from auth import get_current_user
from datetime import datetime, timedelta
import os
import logging

router = APIRouter(prefix="/api/payments", tags=["payments"])
logger = logging.getLogger(__name__)

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

def apply_promocode(promocode_code: str, amount: float, user_id: str, db: Session):
    """Применить промокод и вернуть сумму со скидкой"""
    promocode = db.query(Promocode).filter(
        Promocode.code == promocode_code,
        Promocode.active == True,
        Promocode.expires_at > datetime.utcnow()
    ).first()
    
    if not promocode:
        raise HTTPException(404, "Promocode not found or expired")
    
    # Проверяем лимит использований
    if promocode.max_uses and promocode.uses_count >= promocode.max_uses:
        raise HTTPException(400, "Promocode usage limit exceeded")
    
    # Проверяем, не использовал ли пользователь уже этот промокод
    existing_usage = db.query(PromocodeUsage).filter(
        PromocodeUsage.promocode_id == promocode.id,
        PromocodeUsage.user_id == user_id
    ).first()
    
    if existing_usage:
        raise HTTPException(400, "You have already used this promocode")
    
    discount_amount = amount * promocode.discount_percent / 100
    final_amount = amount - discount_amount
    
    return {
        "promocode": promocode,
        "original_amount": amount,
        "discount_amount": discount_amount,
        "final_amount": final_amount,
        "discount_percent": promocode.discount_percent
    }

# ========== РАЗОВАЯ ОПЛАТА (БЕЗ СОХРАНЕНИЯ КАРТЫ) ==========

@router.post("/create-onetime")
async def create_onetime_payment(
    tariff_id: int,
    promocode: str = Query(None, description="Промокод на скидку"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tariff = db.query(Tariff).filter(Tariff.id == tariff_id).first()
    if not tariff:
        raise HTTPException(404, "Tariff not found")
    
    original_amount = float(tariff.price)
    final_amount = original_amount
    discount_info = None
    
    # Применяем промокод если он есть
    if promocode:
        try:
            discount_info = apply_promocode(promocode, original_amount, current_user.id, db)
            final_amount = discount_info["final_amount"]
            logger.info(f"Applied promocode {promocode} for user {current_user.id}, discount: {discount_info['discount_amount']}")
        except HTTPException as e:
            raise e
    
    idempotence_key = str(uuid.uuid4())
    headers = get_auth_headers()
    headers["Idempotence-Key"] = idempotence_key
    
    payload = {
        "amount": {
            "value": f"{final_amount:.2f}",
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
            "action": "onetime_payment",
            "original_amount": str(original_amount),
            "discount_percent": str(discount_info["discount_percent"]) if discount_info else "0",
            "promocode": promocode or ""
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
            amount=final_amount,
            status="pending",
            yookassa_payment_id=data["id"],
            tariff_id=tariff_id,
            payment_type="onetime",
            meta=json.dumps({
                "action": "onetime_payment",
                "original_amount": str(original_amount),
                "promocode": promocode or None
            })
        )
        db.add(payment)
        
        # Если использован промокод, создаем запись об использовании
        if discount_info:
            promocode_usage = PromocodeUsage(
                id=str(uuid.uuid4()),
                promocode_id=discount_info["promocode"].id,
                user_id=current_user.id,
                payment_id=payment.id,
                original_amount=original_amount,
                discount_amount=discount_info["discount_amount"],
                final_amount=final_amount
            )
            db.add(promocode_usage)
            
            # Обновляем счетчик использований промокода
            discount_info["promocode"].uses_count += 1
            
            # Если это промокод за отзыв - отмечаем, что пользователь использовал скидку
            if discount_info["promocode"].code.startswith("REVIEW20_"):
                current_user.has_used_discount = True
                current_user.can_use_discount = False
        
        db.commit()
        
        return {
            "confirmation_url": data["confirmation"]["confirmation_url"],
            "payment_id": data["id"],
            "discount_applied": discount_info is not None,
            "discount_percent": discount_info["discount_percent"] if discount_info else 0,
            "original_amount": original_amount,
            "final_amount": final_amount
        }

# ========== ОПЛАТА С СОХРАНЕНИЕМ КАРТЫ (Подписки) ==========

@router.post("/create-with-binding")
async def create_payment_with_binding(
    tariff_id: int,
    promocode: str = Query(None, description="Промокод на скидку"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tariff = db.query(Tariff).filter(Tariff.id == tariff_id).first()
    if not tariff:
        raise HTTPException(404, "Tariff not found")
    
    original_amount = float(tariff.price)
    final_amount = original_amount
    discount_info = None
    
    # Применяем промокод если он есть
    if promocode:
        try:
            discount_info = apply_promocode(promocode, original_amount, current_user.id, db)
            final_amount = discount_info["final_amount"]
            logger.info(f"Applied promocode {promocode} for user {current_user.id}, discount: {discount_info['discount_amount']}")
        except HTTPException as e:
            raise e
    
    idempotence_key = str(uuid.uuid4())
    headers = get_auth_headers()
    headers["Idempotence-Key"] = idempotence_key
    
    payload = {
        "amount": {
            "value": f"{final_amount:.2f}",
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
            "action": "payment_with_binding",
            "original_amount": str(original_amount),
            "discount_percent": str(discount_info["discount_percent"]) if discount_info else "0",
            "promocode": promocode or ""
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
            amount=final_amount,
            status="pending",
            yookassa_payment_id=data["id"],
            tariff_id=tariff_id,
            payment_type="subscription",
            meta=json.dumps({
                "save_payment_method": True,
                "original_amount": str(original_amount),
                "promocode": promocode or None
            })
        )
        db.add(payment)
        
        # Если использован промокод, создаем запись об использовании
        if discount_info:
            promocode_usage = PromocodeUsage(
                id=str(uuid.uuid4()),
                promocode_id=discount_info["promocode"].id,
                user_id=current_user.id,
                payment_id=payment.id,
                original_amount=original_amount,
                discount_amount=discount_info["discount_amount"],
                final_amount=final_amount
            )
            db.add(promocode_usage)
            
            # Обновляем счетчик использований промокода
            discount_info["promocode"].uses_count += 1
            
            # Если это промокод за отзыв - отмечаем, что пользователь использовал скидку
            if discount_info["promocode"].code.startswith("REVIEW20_"):
                current_user.has_used_discount = True
                current_user.can_use_discount = False
        
        db.commit()
        
        return {
            "confirmation_url": data["confirmation"]["confirmation_url"],
            "payment_id": data["id"],
            "discount_applied": discount_info is not None,
            "discount_percent": discount_info["discount_percent"] if discount_info else 0,
            "original_amount": original_amount,
            "final_amount": final_amount
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
            "value": f"{float(tariff.price):.2f}",
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
            
            # Сохраняем payment_method_id если есть
            if "payment_method" in payment_data and payment_data["payment_method"]:
                method_id = payment_data["payment_method"].get("id")
                payment.payment_method_id = method_id
                
                # Сохраняем карту только для подписок (payment_type == "subscription")
                if payment.payment_type == "subscription":
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
                    
                    # === НАЧИСЛЕНИЕ БОНУСА РЕФЕРЕРУ ===
                    # Ищем, кто пригласил этого пользователя
                    referral = db.query(Referral).filter(
                        Referral.invited_user_id == payment.user_id
                    ).first()
                    
                    if referral:
                        referrer = db.query(User).filter(
                            User.id == referral.referrer_id
                        ).first()
                        if referrer:
                            referrer.bonus_uses_remaining += 1
                            logger.info(f"[REFERRAL] Bonus awarded to {referrer.id} for payment by {payment.user_id}")
            
            db.commit()
        return {"status": "ok"}
    
    elif event == "payment.canceled":
        if payment:
            payment.status = "canceled"
            db.commit()
        return {"status": "ok"}
    
    return {"status": "ignored"}