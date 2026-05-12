# backend/reviews.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.models import User, Review, Promocode, PromocodeUsage, Payment
from auth import get_current_user
from pydantic import BaseModel, Field
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
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    """Получить список отзывов (публичный эндпоинт)"""
    
    reviews = db.query(Review).filter(
        Review.is_deleted == False
    ).order_by(desc(Review.created_at)).offset(offset).limit(limit).all()
    
    result = []
    for review in reviews:
        # Сначала ищем в обычных пользователях
        user = db.query(User).filter(User.id == review.user_id).first()
        user_name = None
        user_avatar = None
        
        if user:
            user_name = user.full_name
            user_avatar = user.avatar_url
        else:
            # Если не нашли в users, ищем в fake_users
            fake_user = db.query(FakeUser).filter(FakeUser.id == review.user_id).first()
            if fake_user:
                user_name = fake_user.name
                user_avatar = fake_user.avatar_url
            else:
                user_name = "Аноним"
        
        # Получаем информацию об админе, который ответил
        admin_info = None
        if review.admin_replied_by:
            admin = db.query(User).filter(User.id == review.admin_replied_by).first()
            if admin:
                admin_info = {
                    "name": admin.full_name or admin.email,
                    "avatar": admin.avatar_url
                }
        
        result.append({
            "id": review.id,
            "user_id": review.user_id,
            "user_name": user_name,
            "user_avatar": user_avatar,
            "rating": review.rating,
            "comment": review.comment,
            "created_at": review.created_at,
            "admin_reply": review.admin_reply,
            "admin_reply_at": review.admin_replied_at,
            "admin_replied_by": admin_info
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
    
    # Ищем промокод пользователя
    promocode = db.query(Promocode).filter(
        Promocode.code.like(f"REVIEW20_{current_user.id[:8]}%"),
        Promocode.active == True
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

# =============================================================================
# АДМИН ЭНДПОИНТЫ ДЛЯ ОТВЕТОВ НА ОТЗЫВЫ
# =============================================================================

class AdminReplyRequest(BaseModel):
    reply: str

@router.post("/{review_id}/reply")
async def add_admin_reply(
    review_id: str,
    reply_data: AdminReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Добавить ответ на отзыв (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Только администраторы могут отвечать на отзывы")
    
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.is_deleted == False
    ).first()
    
    if not review:
        raise HTTPException(404, "Отзыв не найден")
    
    # Добавляем ответ
    review.admin_reply = reply_data.reply.strip()
    review.admin_replied_at = datetime.utcnow()  # Исправлено!
    review.admin_replied_by = current_user.id
    
    db.commit()
    
    logger.info(f"Admin {current_user.email} replied to review {review_id}")
    
    return {
        "message": "Ответ добавлен",
        "reply": review.admin_reply,
        "replied_at": review.admin_replied_at  # Исправлено!
    }


@router.delete("/{review_id}/reply")
async def delete_admin_reply(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить ответ на отзыв (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Только администраторы могут удалять ответы")
    
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.is_deleted == False
    ).first()
    
    if not review:
        raise HTTPException(404, "Отзыв не найден")
    
    review.admin_reply = None
    review.admin_replied_at = None  # ← ИСПРАВЛЕНО
    review.admin_replied_by = None
    
    db.commit()
    
    logger.info(f"Admin {current_user.email} deleted reply from review {review_id}")
    
    return {"message": "Ответ удалён"}


@router.put("/{review_id}/reply")
async def edit_admin_reply(
    review_id: str,
    reply_data: AdminReplyRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Редактировать ответ на отзыв (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Только администраторы могут редактировать ответы")
    
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.is_deleted == False
    ).first()
    
    if not review:
        raise HTTPException(404, "Отзыв не найден")
    
    if not review.admin_reply:
        raise HTTPException(400, "Ответ ещё не добавлен")
    
    review.admin_reply = reply_data.reply.strip()
    review.admin_replied_at = datetime.utcnow()  # ← ИСПРАВЛЕНО
    
    db.commit()
    
    return {
        "message": "Ответ обновлён",
        "reply": review.admin_reply,
        "replied_at": review.admin_reply_at
    }

# =============================================================================
# АДМИН ЭНДПОИНТ ДЛЯ СОЗДАНИЯ ФЕЙК-ОТЗЫВОВ
# =============================================================================

class AdminFakeReviewRequest(BaseModel):
    user_id: Optional[str] = None
    user_email: Optional[str] = None
    user_name: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1, max_length=1000)
    created_at: Optional[datetime] = None  # Можно указать дату для имитации старых отзывов

@router.post("/admin/fake")
async def create_fake_review(
    review_data: AdminFakeReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать отзыв от имени любого пользователя (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Только администраторы могут создавать отзывы")
    
    # Определяем пользователя
    target_user = None
    
    if review_data.user_id:
        target_user = db.query(User).filter(User.id == review_data.user_id).first()
    elif review_data.user_email:
        target_user = db.query(User).filter(User.email == review_data.user_email).first()
    
    # Если пользователь не найден по ID/email, но указано имя — создаём "анонимного" пользователя?
    if not target_user:
        if review_data.user_name:
            # Создаём временного пользователя? Нет, лучше не создавать фейковых юзеров
            raise HTTPException(404, f"Пользователь не найден. Используйте существующего пользователя")
        else:
            raise HTTPException(404, "Пользователь не найден. Укажите user_id или user_email")
    
    # Проверяем, не оставлял ли пользователь уже отзыв
    existing_review = db.query(Review).filter(
        Review.user_id == target_user.id,
        Review.is_deleted == False
    ).first()
    
    if existing_review:
        raise HTTPException(400, f"Пользователь {target_user.email} уже оставил отзыв")
    
    # Создаём отзыв
    review = Review(
        id=str(uuid.uuid4()),
        user_id=target_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
        created_at=review_data.created_at or datetime.utcnow()
    )
    db.add(review)
    db.commit()
    
    logger.info(f"Admin {current_user.email} created fake review for user {target_user.email}")
    
    return {
        "message": "Отзыв успешно создан",
        "review_id": review.id,
        "user": {
            "id": target_user.id,
            "email": target_user.email,
            "name": target_user.full_name
        }
    }


@router.get("/admin/users")
async def get_users_for_admin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    limit: int = 50
):
    """Получить список пользователей для админ-панели (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Доступ запрещён")
    
    query = db.query(User).filter(User.is_deleted == False)
    
    if search:
        query = query.filter(
            (User.email.ilike(f"%{search}%")) |
            (User.full_name.ilike(f"%{search}%"))
        )
    
    users = query.order_by(User.created_at.desc()).limit(limit).all()
    
    # Проверяем, оставлял ли пользователь отзыв
    result = []
    for user in users:
        has_review = db.query(Review).filter(
            Review.user_id == user.id,
            Review.is_deleted == False
        ).first() is not None
        
        result.append({
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "has_review": has_review,
            "created_at": user.created_at
        })
    
    return result

# =============================================================================
# АДМИН ЭНДПОИНТЫ ДЛЯ ФЕЙКОВЫХ ОТЗЫВОВ (НЕСУЩЕСТВУЮЩИЕ ПОЛЬЗОВАТЕЛИ)
# =============================================================================

class FakeUserCreate(BaseModel):
    name: str
    avatar_url: Optional[str] = None

class FakeReviewRequest(BaseModel):
    fake_user_id: Optional[str] = None
    fake_user_name: Optional[str] = None
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(..., min_length=1, max_length=1000)
    created_at: Optional[datetime] = None

@router.post("/admin/fake-users")
async def create_fake_user(
    user_data: FakeUserCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать фейкового пользователя для отзывов (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Только администраторы могут создавать фейковых пользователей")
    
    fake_user = FakeUser(
        id=str(uuid.uuid4()),
        name=user_data.name,
        avatar_url=user_data.avatar_url
    )
    db.add(fake_user)
    db.commit()
    
    logger.info(f"Admin {current_user.email} created fake user: {fake_user.name}")
    
    return {
        "message": "Фейковый пользователь создан",
        "fake_user": {
            "id": fake_user.id,
            "name": fake_user.name,
            "avatar_url": fake_user.avatar_url
        }
    }


@router.get("/admin/fake-users")
async def get_fake_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить список фейковых пользователей (только для админов)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Доступ запрещён")
    
    fake_users = db.query(FakeUser).filter(FakeUser.is_active == True).all()
    
    # Проверяем, сколько отзывов у каждого фейкового пользователя
    result = []
    for fu in fake_users:
        review_count = db.query(Review).filter(
            Review.user_id == fu.id,
            Review.is_deleted == False
        ).count()
        
        result.append({
            "id": fu.id,
            "name": fu.name,
            "avatar_url": fu.avatar_url,
            "review_count": review_count,
            "created_at": fu.created_at
        })
    
    return result


@router.post("/admin/fake-review")
async def create_fake_review_standalone(
    review_data: FakeReviewRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Создать отзыв от имени фейкового пользователя (не существующего в users)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Только администраторы могут создавать фейковые отзывы")
    
    # Определяем фейкового пользователя
    fake_user = None
    
    if review_data.fake_user_id:
        fake_user = db.query(FakeUser).filter(
            FakeUser.id == review_data.fake_user_id,
            FakeUser.is_active == True
        ).first()
    elif review_data.fake_user_name:
        fake_user = db.query(FakeUser).filter(
            FakeUser.name == review_data.fake_user_name,
            FakeUser.is_active == True
        ).first()
    
    if not fake_user:
        raise HTTPException(404, "Фейковый пользователь не найден. Сначала создайте его через /admin/fake-users")
    
    # Создаём отзыв (user_id = id фейкового пользователя)
    review = Review(
        id=str(uuid.uuid4()),
        user_id=fake_user.id,  # Важно: это ID из fake_users, НЕ из users!
        rating=review_data.rating,
        comment=review_data.comment,
        created_at=review_data.created_at or datetime.utcnow()
    )
    db.add(review)
    db.commit()
    
    logger.info(f"Admin {current_user.email} created fake review for {fake_user.name}")
    
    return {
        "message": "Фейковый отзыв успешно создан",
        "review_id": review.id,
        "fake_user": {
            "id": fake_user.id,
            "name": fake_user.name
        }
    }


@router.delete("/admin/fake-users/{fake_user_id}")
async def delete_fake_user(
    fake_user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Удалить фейкового пользователя (мягкое удаление)"""
    
    ADMIN_EMAILS = ["gntv.surname@gmail.com"]
    if current_user.email not in ADMIN_EMAILS:
        raise HTTPException(403, "Только администраторы могут удалять фейковых пользователей")
    
    fake_user = db.query(FakeUser).filter(FakeUser.id == fake_user_id).first()
    if not fake_user:
        raise HTTPException(404, "Фейковый пользователь не найден")
    
    fake_user.is_active = False
    db.commit()
    
    return {"message": f"Фейковый пользователь {fake_user.name} удалён"}