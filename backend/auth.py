# backend/auth.py
from fastapi import APIRouter, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
import httpx
import jwt
import os
from datetime import datetime, timedelta
from database import get_db
from models.models import User, Referral  # Добавь Referral если есть
import secrets
import string

router = APIRouter(prefix="/api/auth", tags=["auth"])

# Конфигурация Google OAuth
GOOGLE_CLIENT_ID = "673223204288-1d1oopu0oimto1vi6ld2404atvp4gu85.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"
GOOGLE_REDIRECT_URI = "https://chadmetrix.ru/api/auth/callback/google"

# JWT секрет — обязательно поменяй в продакшене!
JWT_SECRET = os.getenv("JWT_SECRET", "change-this-secret-in-production-32-chars-long!!")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 30


def generate_referral_code():
    """Генерация реферального кода"""
    return ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(8))


@router.get("/login/google")
async def login_google():
    """Редирект на Google OAuth"""
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth"
        f"?client_id={GOOGLE_CLIENT_ID}"
        f"&redirect_uri={GOOGLE_REDIRECT_URI}"
        "&response_type=code"
        "&scope=openid%20email%20profile"
        "&access_type=offline"
        "&prompt=consent"
    )
    return RedirectResponse(url=google_auth_url)


@router.get("/callback/google")
async def callback_google(code: str):
    """Обработка callback от Google"""
    
    # 1. Обмен code на токены
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }
    
    async with httpx.AsyncClient() as client:
        token_response = await client.post(token_url, data=token_data)
        if token_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get token from Google")
        
        tokens = token_response.json()
        access_token = tokens.get("access_token")
        
        # 2. Получение данных пользователя
        userinfo_response = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        
        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")
        
        user_info = userinfo_response.json()
    
    # 3. Создание/обновление пользователя в БД
    db = next(get_db())
    try:
        user = db.query(User).filter(User.email == user_info["email"]).first()
        
        if not user:
            # Создаём нового пользователя
            user = User(
                id=str(secrets.token_hex(16)),  # Генерируем UUID
                email=user_info["email"],
                full_name=user_info.get("name", ""),
                avatar_url=user_info.get("picture", ""),
                google_id=user_info.get("id", ""),
                auth_provider="google",
                tariff_type="free",
                photo_uses_remaining=0,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Обновляем данные если пользователь уже есть (например из Telegram)
            if not user.google_id:
                user.google_id = user_info.get("id", "")
                user.auth_provider = "google"
            user.full_name = user_info.get("name", user.full_name)
            user.avatar_url = user_info.get("picture", user.avatar_url)
            user.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
    
    finally:
        db.close()
    
    # 4. Создание JWT токена
    token_payload = {
        "sub": str(user.id),
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS),
        "iat": datetime.utcnow()
    }
    jwt_token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    # 5. Редирект на фронтенд с токеном
    redirect_url = f"https://chadmetrix.ru/auth/callback?token={jwt_token}"
    return RedirectResponse(url=redirect_url)


@router.get("/me")
async def get_current_user(request: Request):
    """Получение текущего пользователя по JWT"""
    # Пробуем получить токен из cookie или из заголовка Authorization
    token = request.cookies.get("token")
    
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
    
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        
        db = next(get_db())
        user = db.query(User).filter(User.id == user_id).first()
        db.close()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        return {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "avatar_url": user.avatar_url,
            "tariff_type": user.tariff_type,
            "photo_uses_remaining": user.photo_uses_remaining,
            "created_at": user.created_at.isoformat() if user.created_at else None
        }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/logout")
async def logout(response: Response):
    """Выход из системы"""
    response.delete_cookie("token")
    return {"message": "Logged out successfully"}