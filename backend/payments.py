# backend/payments.py
from typing import Optional
import uuid
import base64
import json

from pydantic import BaseModel
import httpx
from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
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
    
    # Дополнительная проверка для REVIEW20_ промокодов
    if promocode.code.startswith("REVIEW20_"):
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.has_used_discount:
            raise HTTPException(400, "You have already used your review discount")
        if user and not user.can_use_discount:
            raise HTTPException(400, "Discount not available")
    
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

# ========== АВТОПЛАТЕЖ (БЕЗ ПРОМОКОДА) ==========

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
    
    # Автоплатеж всегда по полной цене, без промокода
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
            
            # Активируем подписку/анализы
            if payment.tariff_id:
                user = db.query(User).filter(User.id == payment.user_id).first()
                tariff = db.query(Tariff).filter(Tariff.id == payment.tariff_id).first()
                if user and tariff:
                    # Для подписок
                    if payment.payment_type == "subscription":
                        user.tariff_type = tariff.name.lower().replace("подписка ", "").replace(" ", "_")
                        user.tariff_expire = datetime.utcnow() + timedelta(days=30)
                        user.photo_uses_remaining += tariff.reports_count
                    # Для разовых платежей
                    elif payment.payment_type == "onetime":
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

# ========== ВАЛИДАЦИЯ ПРОМОКОДА ==========

@router.get("/validate-promocode")
async def validate_promocode(
    code: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Проверить промокод без применения"""
    promocode = db.query(Promocode).filter(
        Promocode.code == code,
        Promocode.active == True,
        Promocode.expires_at > datetime.utcnow()
    ).first()
    
    if not promocode:
        return {
            "valid": False,
            "message": "Промокод не найден или истёк"
        }
    
    # Проверяем лимит использований
    if promocode.max_uses and promocode.uses_count >= promocode.max_uses:
        return {
            "valid": False,
            "message": "Промокод уже использован"
        }
    
    # Проверяем, не использовал ли пользователь уже этот промокод
    existing_usage = db.query(PromocodeUsage).filter(
        PromocodeUsage.promocode_id == promocode.id,
        PromocodeUsage.user_id == current_user.id
    ).first()
    
    if existing_usage:
        return {
            "valid": False,
            "message": "Вы уже использовали этот промокод"
        }
    
    # Дополнительная проверка для REVIEW20_ промокодов
    if promocode.code.startswith("REVIEW20_"):
        if current_user.has_used_discount:
            return {
                "valid": False,
                "message": "Вы уже использовали скидку за отзыв"
            }
        if not current_user.can_use_discount:
            return {
                "valid": False,
                "message": "Скидка за отзыв недоступна"
            }
    
    return {
        "valid": True,
        "discount_percent": promocode.discount_percent,
        "expires_at": promocode.expires_at.isoformat()
    }

# ========== АДМИН-ПАНЕЛЬ (УПРАВЛЕНИЕ ПРОМОКОДАМИ) ==========

class PromocodeCreate(BaseModel):
    code: str
    discount_percent: int
    description: Optional[str] = None
    max_uses: Optional[int] = None
    expires_days: Optional[int] = 30  # дней до истечения

class PromocodeUpdate(BaseModel):
    active: Optional[bool] = None
    max_uses: Optional[int] = None
    description: Optional[str] = None

@router.post("/admin/promocodes")
async def create_promocode_admin(
    promocode_data: PromocodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать промокод (только для админов)"""
    
    # Проверка прав администратора
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]  # Замените на свой email
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Доступ только для администраторов")
    
    # Проверяем, не существует ли уже такой промокод
    existing = db.query(Promocode).filter(Promocode.code == promocode_data.code.upper()).first()
    if existing:
        raise HTTPException(400, "Промокод с таким названием уже существует")
    
    # Проверяем процент скидки
    if promocode_data.discount_percent < 1 or promocode_data.discount_percent > 100:
        raise HTTPException(400, "Скидка должна быть от 1 до 100 процентов")
    
    # Создаем промокод
    promocode = Promocode(
        id=str(uuid.uuid4()),
        code=promocode_data.code.upper(),
        discount_percent=promocode_data.discount_percent,
        description=promocode_data.description,
        active=True,
        max_uses=promocode_data.max_uses,
        expires_at=datetime.utcnow() + timedelta(days=promocode_data.expires_days),
        uses_count=0
    )
    db.add(promocode)
    db.commit()
    db.refresh(promocode)
    
    logger.info(f"Admin {current_user.email} created promocode {promocode.code}")
    
    return {
        "message": "Промокод создан",
        "promocode": {
            "id": promocode.id,
            "code": promocode.code,
            "discount_percent": promocode.discount_percent,
            "description": promocode.description,
            "active": promocode.active,
            "max_uses": promocode.max_uses,
            "uses_count": promocode.uses_count,
            "expires_at": promocode.expires_at.isoformat() if promocode.expires_at else None
        }
    }

@router.get("/admin/promocodes")
async def get_all_promocodes_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    active_only: bool = False,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Получить все промокоды (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Доступ только для администраторов")
    
    query = db.query(Promocode)
    if active_only:
        query = query.filter(Promocode.active == True)
    
    promocodes = query.order_by(Promocode.created_at.desc()).offset(offset).limit(limit).all()
    
    return {
        "promocodes": [
            {
                "id": p.id,
                "code": p.code,
                "discount_percent": p.discount_percent,
                "description": p.description,
                "active": p.active,
                "max_uses": p.max_uses,
                "uses_count": p.uses_count,
                "expires_at": p.expires_at.isoformat() if p.expires_at else None,
                "created_at": p.created_at.isoformat() if p.created_at else None
            }
            for p in promocodes
        ]
    }

@router.put("/admin/promocodes/{promocode_id}")
async def update_promocode_admin(
    promocode_id: str,
    update_data: PromocodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить промокод (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Доступ только для администраторов")
    
    promocode = db.query(Promocode).filter(Promocode.id == promocode_id).first()
    if not promocode:
        raise HTTPException(404, "Промокод не найден")
    
    if update_data.active is not None:
        promocode.active = update_data.active
    if update_data.max_uses is not None:
        promocode.max_uses = update_data.max_uses
    if update_data.description is not None:
        promocode.description = update_data.description
    
    db.commit()
    
    logger.info(f"Admin {current_user.email} updated promocode {promocode.code}")
    
    return {"message": "Промокод обновлён"}

@router.delete("/admin/promocodes/{promocode_id}")
async def delete_promocode_admin(
    promocode_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить промокод (только для админов) - мягкое удаление"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Доступ только для администраторов")
    
    promocode = db.query(Promocode).filter(Promocode.id == promocode_id).first()
    if not promocode:
        raise HTTPException(404, "Промокод не найден")
    
    # Мягкое удаление - деактивируем
    promocode.active = False
    db.commit()
    
    logger.info(f"Admin {current_user.email} deleted promocode {promocode.code}")
    
    return {"message": "Промокод деактивирован"}

@router.get("/admin/stats")
async def get_admin_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику для админ-панели"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Доступ только для администраторов")
    
    from models.models import Review, User, Payment, Analysis
    
    total_users = db.query(User).filter(User.is_deleted == False).count()
    total_reviews = db.query(Review).filter(Review.is_deleted == False).count()
    total_payments = db.query(Payment).filter(Payment.status == "succeeded").count()
    total_analyses = db.query(Analysis).filter(Analysis.is_deleted == False).count()
    
    # Сумма всех успешных платежей
    total_revenue = db.query(Payment).filter(Payment.status == "succeeded").with_entities(
        func.sum(Payment.amount)
    ).scalar() or 0
    
    # Активные промокоды
    active_promocodes = db.query(Promocode).filter(
        Promocode.active == True,
        Promocode.expires_at > datetime.utcnow()
    ).count()
    
    return {
        "total_users": total_users,
        "total_reviews": total_reviews,
        "total_payments": total_payments,
        "total_analyses": total_analyses,
        "total_revenue": float(total_revenue),
        "active_promocodes": active_promocodes
    }