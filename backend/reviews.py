# backend/reviews.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.models import User, Review, Promocode, PromocodeUsage, Payment
from auth import get_current_user
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
import uuid
import logging

router = APIRouter(prefix="/api/reviews", tags=["reviews"])
logger = logging.getLogger(__name__)

class ReviewCreate(BaseModel):
    rating: int
    comment: Optional[str] = None

class ReviewResponse(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str]
    user_avatar: Optional[str]
    rating: int
    comment: Optional[str]
    created_at: datetime
    is_long: Optional[bool] = None  # Флаг, что комментарий длинный

class ReviewStats(BaseModel):
    average_rating: float
    total_reviews: int
    rating_distribution: dict

@router.post("/create")
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать отзыв (только для пользователей, которые совершали покупки)"""
    
    # Проверяем, не оставлял ли пользователь уже отзыв
    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.is_deleted == False
    ).first()
    
    if existing_review:
        raise HTTPException(400, "You have already left a review")
    
    # Проверяем, совершал ли пользователь хотя бы одну успешную покупку
    # Ищем платежи со статусом succeeded ИЛИ у пользователя есть использованные анализы
    has_purchased = db.query(Payment).filter(
        Payment.user_id == current_user.id,
        Payment.status == "succeeded"
    ).first()
    
    # Также проверяем, были ли у пользователя когда-либо анализы (photo_uses_remaining или bonus_uses_remaining когда-то были >0)
    # Для этого проверяем, есть ли у пользователя записи в analyses
    from models.models import Analysis
    has_analysis = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.is_deleted == False
    ).first()
    
    if not has_purchased and not has_analysis:
        raise HTTPException(403, "Только пользователи, совершившие покупку, могут оставлять отзывы")
    
    # Проверяем валидность рейтинга
    if review_data.rating < 1 or review_data.rating > 5:
        raise HTTPException(400, "Rating must be between 1 and 5")
    
    # Ограничение длины комментария (максимум 1000 символов)
    MAX_COMMENT_LENGTH = 1000
    if review_data.comment and len(review_data.comment) > MAX_COMMENT_LENGTH:
        raise HTTPException(400, f"Comment must not exceed {MAX_COMMENT_LENGTH} characters")
    
    # Создаем отзыв
    review = Review(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
        created_at=datetime.utcnow()
    )
    db.add(review)
    
    # Отмечаем, что пользователь оставил отзыв
    current_user.review_given_at = datetime.utcnow()
    
    # Инициализируем переменную promocode_code
    promocode_code = None
    
    # Если у пользователя еще нет скидки - даем промокод на 20%
    if not current_user.can_use_discount and not current_user.has_used_discount:
        # Генерируем уникальный промокод для пользователя
        promocode_code = f"REVIEW20_{current_user.id[:8]}_{uuid.uuid4().hex[:4]}".upper()
        
        # Проверяем, не существует ли уже такой промокод
        existing_promocode = db.query(Promocode).filter(
            Promocode.code == promocode_code
        ).first()
        
        if not existing_promocode:
            promocode = Promocode(
                id=str(uuid.uuid4()),
                code=promocode_code,
                discount_percent=20,
                description=f"Скидка 20% за отзыв для пользователя {current_user.id}",
                active=True,
                max_uses=1,
                expires_at=datetime.utcnow() + timedelta(days=365)
            )
            db.add(promocode)
            current_user.can_use_discount = True
            logger.info(f"Created discount promocode {promocode_code} for user {current_user.id}")
    
    db.commit()
    
    return {
        "message": "Review created successfully",
        "has_discount": current_user.can_use_discount,
        "discount_code": promocode_code if current_user.can_use_discount else None
    }

@router.get("/list")
async def get_reviews(
    limit: int = Query(10, ge=1, le=50),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Получить список отзывов (публичный эндпоинт)"""
    
    reviews = db.query(Review).filter(
        Review.is_deleted == False
    ).order_by(desc(Review.created_at)).offset(offset).limit(limit).all()
    
    # Добавляем информацию о пользователе
    result = []
    for review in reviews:
        user = db.query(User).filter(User.id == review.user_id).first()
        result.append({
            "id": review.id,
            "user_id": review.user_id,
            "user_name": user.full_name if user else "Аноним",
            "user_avatar": user.avatar_url if user else None,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at
        })
    
    return result

@router.get("/stats")
async def get_review_stats(db: Session = Depends(get_db)):
    """Получить статистику отзывов"""
    
    reviews = db.query(Review).filter(Review.is_deleted == False).all()
    
    total_reviews = len(reviews)
    if total_reviews == 0:
        return {
            "average_rating": 0,
            "total_reviews": 0,
            "rating_distribution": {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
        }
    
    average_rating = sum(r.rating for r in reviews) / total_reviews
    
    # Распределение по рейтингам
    distribution = {1: 0, 2: 0, 3: 0, 4: 0, 5: 0}
    for review in reviews:
        distribution[review.rating] += 1
    
    return {
        "average_rating": round(average_rating, 1),
        "total_reviews": total_reviews,
        "rating_distribution": distribution
    }

@router.get("/can-review")
async def can_user_review(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Проверить, может ли пользователь оставить отзыв"""
    
    # Проверяем, оставлял ли уже отзыв
    existing_review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.is_deleted == False
    ).first()
    
    if existing_review:
        return {"can_review": False, "reason": "Вы уже оставили отзыв"}
    
    # Проверяем, совершал ли покупки ИЛИ делал ли анализы
    from models.models import Analysis
    
    has_purchased = db.query(Payment).filter(
        Payment.user_id == current_user.id,
        Payment.status == "succeeded"
    ).first()
    
    has_analysis = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.is_deleted == False
    ).first()
    
    if not has_purchased and not has_analysis:
        return {"can_review": False, "reason": "Только пользователи, совершившие покупку или анализ, могут оставлять отзывы"}
    
    return {"can_review": True}

@router.get("/my-review")
async def get_my_review(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить отзыв текущего пользователя"""
    
    review = db.query(Review).filter(
        Review.user_id == current_user.id,
        Review.is_deleted == False
    ).first()
    
    if not review:
        return {"has_review": False}
    
    # Также ищем промокод пользователя
    promocode = db.query(Promocode).filter(
        Promocode.code.like(f"REVIEW20_{current_user.id[:8]}%"),
        Promocode.active == True,
        Promocode.expires_at > datetime.utcnow()
    ).first()
    
    return {
        "has_review": True,
        "id": review.id,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at,
        "has_discount": current_user.can_use_discount,
        "used_discount": current_user.has_used_discount,
        "discount_code": promocode.code if promocode else None
    }

@router.post("/apply-discount")
async def apply_discount(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Применить скидку за отзыв к следующей покупке"""
    
    if not current_user.can_use_discount:
        raise HTTPException(400, "No discount available")
    
    if current_user.has_used_discount:
        raise HTTPException(400, "Discount already used")
    
    # Находим промокод пользователя
    promocode = db.query(Promocode).filter(
        Promocode.code.like(f"REVIEW20_{current_user.id[:8]}%"),
        Promocode.active == True,
        Promocode.expires_at > datetime.utcnow()
    ).first()
    
    if not promocode:
        raise HTTPException(404, "Promocode not found or expired")
    
    return {
        "discount_code": promocode.code,
        "discount_percent": promocode.discount_percent,
        "expires_at": promocode.expires_at
    }

@router.delete("/{review_id}")
async def delete_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить отзыв (только для админов)"""
    
    # Список email админов - ЗАМЕНИТЕ НА СВОИ
    ADMIN_EMAILS = [
        "gntv.surname@gmail.com"
    ]
    
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Только администраторы могут удалять отзывы")
    
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(404, "Отзыв не найден")
    
    # Мягкое удаление
    review.is_deleted = True
    db.commit()
    
    logger.info(f"Review {review_id} deleted by admin {current_user.email}")
    
    return {"message": "Отзыв удалён"}