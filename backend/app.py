# backend/app.py
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, get_db
from models.models import Base, Referral, User, Payment
from auth import get_current_user
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="chadmetrix API")

# ИСПРАВЛЕННЫЙ CORS — без пробелов!
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://chadmetrix.ru",
        "https://www.chadmetrix.ru"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from auth import router as auth_router
from analysis import router as analysis_router
from payments import router as payments_router

app.include_router(auth_router)
app.include_router(analysis_router)
app.include_router(payments_router)

# === РЕФЕРРАЛЬНЫЕ ЭНДПОИНТЫ ===
@app.get("/api/referrals/stats")
def get_referral_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    referrals = db.query(Referral).filter(
        Referral.referrer_id == current_user.id
    ).all()
    
    invited_count = len(referrals)
    invited_user_ids = [r.invited_user_id for r in referrals]
    
    purchased_count = 0
    if invited_user_ids:
        purchased_count = db.query(Payment).filter(
            Payment.user_id.in_(invited_user_ids),
            Payment.status == "succeeded"
        ).distinct(Payment.user_id).count()
    
    return {
        "invited_count": invited_count,
        "purchased_count": purchased_count,
        "bonuses": purchased_count,
        "referral_code": current_user.id
    }

@app.get("/")
def root():
    return {"ok": True, "message": "chadmetrix API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/test")
def test():
    return {"message": "Backend connected successfully!"}