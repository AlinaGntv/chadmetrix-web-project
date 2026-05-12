from xmlrpc.client import DateTime

from sqlalchemy import (
    Column, String, Numeric, Text, TIMESTAMP, ForeignKey, Boolean, Index, func, Integer
)
from sqlalchemy.orm import relationship, backref
from sqlalchemy.ext.declarative import declarative_base
import sqlalchemy as sa
import uuid

Base = declarative_base()

def generate_uuid():
    return str(uuid.uuid4())

class Payment(Base):
    __tablename__ = "payments"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    amount = Column(Numeric, nullable=False)
    payment_method = Column(Text, nullable=False, server_default="yookassa")
    stars_amount = Column(Integer, nullable=True)
    telegram_stars_payment_id = Column(Text, nullable=True, index=True)
    status = Column(Text, nullable=False, server_default="pending")  # pending, succeeded, canceled, refunded
    yookassa_payment_id = Column(Text, nullable=True, index=True, unique=True)
    tariff_id = Column(Integer, ForeignKey("tariffs.id"), nullable=True)
    meta = Column(Text, nullable=True)  # JSON с metadata
    
    # === НОВЫЕ ПОЛЯ ДЛЯ ЮKASSA ===
    payment_method_id = Column(Text, nullable=True)  # ID сохраненной карты (для рекуррентов)
    payment_type = Column(Text, nullable=True)  # 'onetime' или 'subscription'
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="payments")
    tariff = relationship("Tariff")

class Tariff(Base):
    __tablename__ = "tariffs"
    
    id = Column(Integer, primary_key=True)
    name = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    price = Column(Numeric, nullable=False)
    reports_count = Column(Integer, nullable=False, default=1)
    discount_percent = Column(Integer, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class Photo(Base):
    __tablename__ = "photos"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_url = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    metric_name = Column(Text, nullable=False, index=True)
    metric_value = Column(Numeric, nullable=True)
    raw_json = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

class Report(Base):
    __tablename__ = "reports"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    tariff = Column(Text, nullable=False)
    pdf_url = Column(Text, nullable=True)
    overall_score = Column(Numeric, nullable=True)
    potential_score = Column(Numeric, nullable=True)
    metrics_data = Column(Text, nullable=True)
    improvement_plan = Column(Text, nullable=True)
    meta = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    analysis_id = Column(String, ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True, unique=True)

class Referral(Base):
    __tablename__ = "referrals"

    id = Column(String, primary_key=True, default=generate_uuid)
    referrer_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    invited_user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class Review(Base):
    __tablename__ = 'reviews'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    
    # Поля для ответа админа
    admin_reply = Column(Text, nullable=True)
    admin_replied_at = Column(TIMESTAMP(timezone=True), nullable=True)
    admin_replied_by = Column(String, ForeignKey('users.id'), nullable=True)
    
    # relationships - ВАЖНО: указываем foreign_keys явно!
    user = relationship("User", foreign_keys=[user_id], back_populates="reviews")
    admin = relationship("User", foreign_keys=[admin_replied_by])

class FakeUser(Base):
    __tablename__ = 'fake_users'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

class Promocode(Base):
    __tablename__ = 'promocodes'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(Text, unique=True, nullable=False, index=True)
    discount_percent = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)
    active = Column(Boolean, nullable=False, default=True)
    max_uses = Column(Integer, nullable=True)
    uses_count = Column(Integer, nullable=False, default=0)
    expires_at = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class PromocodeUsage(Base):
    __tablename__ = 'promocode_usages'
    
    id = Column(String, primary_key=True, default=generate_uuid)
    promocode_id = Column(String, ForeignKey('promocodes.id'), nullable=False)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    payment_id = Column(String, ForeignKey('payments.id'), nullable=True)
    original_amount = Column(Numeric, nullable=False)
    discount_amount = Column(Numeric, nullable=False)
    final_amount = Column(Numeric, nullable=False)
    applied_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)

class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(String, primary_key=True, default=generate_uuid)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    price = Column(Numeric, nullable=True)
    is_repeat = Column(Boolean, default=False, nullable=False)
    
    photos = Column(Text, nullable=False, default="[]")
    metrics = Column(Text, nullable=True)
    weak_zones = Column(Text, nullable=True)
    
    report_id = Column(String, ForeignKey("reports.id", ondelete="SET NULL"), nullable=True)
    is_deleted = Column(Boolean, default=False, nullable=False)
    base_analysis_id = Column(String, ForeignKey("analyses.id", ondelete="SET NULL"), nullable=True)

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    telegram_id = Column(Integer, unique=True, index=True, nullable=True)
    
    email = Column(String, unique=True, index=True, nullable=True)
    google_id = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    
    auth_provider = Column(String, nullable=True)
    
    tariff_type = Column(Text, nullable=False, default="free")
    tariff_expire = Column(TIMESTAMP(timezone=True), nullable=True)
    photo_uses_remaining = Column(Integer, nullable=False, default=0)
    bonus_uses_remaining = Column(Integer, nullable=False, default=0)
    llm_comparisons_used = Column(Integer, default=0)
    llm_last_used_month = Column(Integer, default=0)
    llm_last_used_year = Column(Integer, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)
    has_used_discount = Column(Boolean, default=False, nullable=False)
    can_use_discount = Column(Boolean, default=False, nullable=False)
    review_given_at = Column(TIMESTAMP(timezone=True), nullable=True)

    # relationships
    photos = relationship("Photo", back_populates="user", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="user", cascade="all, delete-orphan")
    metrics = relationship("Metric", back_populates="user", cascade="all, delete-orphan")
    reviews = relationship("Review", foreign_keys="Review.user_id", back_populates="user", cascade="all, delete-orphan")

    # Для автоплатежей
    payment_method_id = Column(String, nullable=True)  # ID сохраненной карты в ЮKassa
    auto_payment_enabled = Column(Boolean, default=False, nullable=False)

# Обратные связи
# Обратные связи (только те, которые не определены в классах)
Photo.user = relationship("User", back_populates="photos")
Metric.user = relationship("User", back_populates="metrics")
Report.user = relationship("User", back_populates="reports")
Referral.referrer = relationship("User", foreign_keys=[Referral.referrer_id], backref="referrals_made")
Referral.invited_user = relationship("User", foreign_keys=[Referral.invited_user_id], backref="referred_by")
# Review.user уже определён в классе Review, НЕ ДУБЛИРУЕМ!
PromocodeUsage.user = relationship("User")
PromocodeUsage.payment = relationship("Payment")
Analysis.user = relationship("User", back_populates="analyses")
Analysis.report = relationship("Report", foreign_keys=[Analysis.report_id], uselist=False)
Analysis.repeat_analyses = relationship("Analysis", backref=backref("base_analysis", remote_side=[Analysis.id]))