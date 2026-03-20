from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2AuthorizationCodeBearer
from sqlalchemy.orm import Session
from typing import Optional
import httpx
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

from database import get_db
from models.models import User

load_dotenv()

# Google OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/auth/callback/google")

# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

router = APIRouter(prefix="/api/auth", tags=["auth"])

def create_access_token(data: dict):
    """Создать JWT токен"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.get("/login/google")
async def google_login():
    """Перенаправление на Google OAuth"""
    return {
        "url": f"https://accounts.google.com/o/oauth2/v2/auth?"
               f"client_id={GOOGLE_CLIENT_ID}&"
               f"redirect_uri={GOOGLE_REDIRECT_URI}&"
               f"response_type=code&"
               f"scope=email%20profile%20openid&"
               f"access_type=offline"
    }

@router.get("/callback/google")
async def google_callback(code: str, request: Request, db: Session = Depends(get_db)):
    """Обработка callback от Google"""
    
    # 1. Обмениваем код на токены
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
        token_json = token_response.json()
        
        if "error" in token_json:
            raise HTTPException(status_code=400, detail=token_json["error"])
        
        access_token = token_json["access_token"]
        
        # 2. Получаем информацию о пользователе
        userinfo_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {access_token}"}
        userinfo_response = await client.get(userinfo_url, headers=headers)
        userinfo = userinfo_response.json()
    
    # 3. Ищем или создаем пользователя
    google_id = userinfo["id"]
    email = userinfo["email"]
    
    user = db.query(User).filter(
        (User.google_id == google_id) | (User.email == email)
    ).first()
    
    if not user:
        # Создаем нового пользователя
        user = User(
            google_id=google_id,
            email=email,
            full_name=userinfo.get("name"),
            avatar_url=userinfo.get("picture"),
            auth_provider="google",
            tariff_type="free",
            photo_uses_remaining=0
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 4. Создаем JWT токен для нашего API
    jwt_token = create_access_token({
        "sub": str(user.id),
        "email": user.email,
        "name": user.full_name
    })
    
    # 5. Перенаправляем на фронтенд с токеном
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
    redirect_url = f"{frontend_url}/auth/callback?token={jwt_token}"
    
    return {"redirect_url": redirect_url}

@router.get("/me")
async def get_current_user(request: Request, db: Session = Depends(get_db)):
    """Получить текущего пользователя по JWT токену"""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    token = auth_header.replace("Bearer ", "")
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": str(user.id),
        "email": user.email,
        "full_name": user.full_name,
        "avatar_url": user.avatar_url,
        "tariff_type": user.tariff_type,
        "photo_uses_remaining": user.photo_uses_remaining,
        "created_at": user.created_at
    }