# backend/app.py
from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from database import engine, get_db
from models.models import Base, Referral, User, Payment
from auth import get_current_user
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="chadmetrix API")

# ИСПРАВЛЕННЫЙ CORS — без пробелов в URL!
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

# Обработчик ошибок валидации (для отладки 422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"[VALIDATION ERROR] {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()}
    )

# Импорты роутеров
from auth import router as auth_router
from analysis import router as analysis_router
from payments import router as payments_router
from reports import router as reports_router

# Подключение роутеров
app.include_router(auth_router)      # /api/auth/*
app.include_router(analysis_router)  # /api/analysis/*
app.include_router(payments_router)  # /api/payments/*
app.include_router(reports_router)   # /api/reports/*

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

# Диагностика роутов (временно, для отладки)
@app.get("/api/debug/routes")
def debug_routes():
    """Показать все зарегистрированные маршруты"""
    routes = []
    for route in app.routes:
        if hasattr(route, "methods"):
            routes.append({
                "path": route.path,
                "methods": list(route.methods),
                "name": route.name
            })
    return {"routes": routes, "count": len(routes)}