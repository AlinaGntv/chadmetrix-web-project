# backend/referrals.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.models import User, Referral, Payment
from auth import get_current_user

router = APIRouter(prefix="/api/referrals", tags=["referrals"])


@router.get("/stats")
def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить статистику рефералов"""
    referrals = db.query(Referral).filter(
        Referral.referrer_id == current_user.id
    ).all()
    
    invited_count = len(referrals)
    paid_count = 0
    
    for ref in referrals:
        # Проверяем, есть ли успешные платежи у приглашенного
        payments = db.query(Payment).filter(
            Payment.user_id == ref.invited_user_id,
            Payment.status == "succeeded"
        ).count()
        if payments > 0:
            paid_count += 1
    
    return {
        "invited_count": invited_count,
        "paid_count": paid_count,
        "bonuses_earned": paid_count,  # 1 бонус за каждую оплату
        "bonus_uses_remaining": current_user.bonus_uses_remaining,
        "referral_link": f"https://chadmetrix.ru/?ref={current_user.id}"
    }