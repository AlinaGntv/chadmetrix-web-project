import os
import secrets
import logging
from urllib.parse import urlencode
from datetime import datetime, timedelta
from typing import Optional

import httpx
import jwt
from fastapi import APIRouter, HTTPException, Request, Depends, Response
from fastapi.responses import RedirectResponse, JSONResponse, HTMLResponse
from sqlalchemy.orm import Session
from passlib.context import CryptContext

from database import get_db
from models.models import User, Referral

router = APIRouter(prefix="/api/auth", tags=["auth"])

logger = logging.getLogger("auth.google")
logger.setLevel(logging.INFO)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "https://chadmetrix.ru/api/auth/callback/google",
)

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_DAYS = 7

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# Домен для cookie — берём из env или дефолт
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", "chadmetrix.ru")


def create_access_token(user_id: str) -> str:
    expire = datetime.utcnow() + timedelta(days=JWT_EXPIRE_DAYS)
    to_encode = {"sub": user_id, "exp": expire, "iat": datetime.utcnow()}
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)


def set_auth_cookie(response: Response, token: str):
    """
    Единая функция установки auth cookie.
    SameSite=None + Secure — единственный надёжный вариант для Android
    при кросс-доменных редиректах через OAuth.
    """
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",        # ← было "lax", меняем на "none"
        max_age=60 * 60 * 24 * JWT_EXPIRE_DAYS,
        path="/",
        # domain не указываем — браузер сам проставит текущий домен
        # (явный domain ломает cookie на некоторых Android браузерах)
    )


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    token = request.cookies.get("token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.is_deleted:
        raise HTTPException(status_code=401, detail="User not found")

    return user


@router.get("/login/google")
async def login_google(request: Request):
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        logger.error("Google OAuth env vars are missing")
        raise HTTPException(status_code=500, detail="Google OAuth is not configured")

    ref_code = request.query_params.get("ref")
    state = secrets.token_urlsafe(32)

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": state,
    }

    auth_url = f"{GOOGLE_AUTH_URL}?{urlencode(params)}"
    logger.info("Redirecting to Google OAuth: redirect_uri=%s ref=%s", GOOGLE_REDIRECT_URI, ref_code)

    response = RedirectResponse(url=auth_url, status_code=302)
    response.set_cookie(
        key="oauth_state",
        value=state,
        httponly=True,
        secure=True,
        samesite="none",   # ← тоже none, иначе не придёт после OAuth редиректа
        max_age=600,
        path="/",          # ← был /api/auth, меняем на / для надёжности
    )
    if ref_code:
        response.set_cookie(
            key="ref_code",
            value=ref_code,
            httponly=True,
            secure=True,
            samesite="none",
            max_age=600,
            path="/",
        )
    return response


@router.get("/callback/google")
async def callback_google(
    request: Request,
    response: Response,
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    db: Session = Depends(get_db)
):
    logger.info("Google callback received: query=%s", dict(request.query_params))

    if error:
        logger.warning("Google returned OAuth error: %s", error)
        raise HTTPException(status_code=400, detail=f"Google OAuth error: {error}")

    if not code:
        logger.error("Missing authorization code")
        raise HTTPException(status_code=400, detail="Missing authorization code")

    cookie_state = request.cookies.get("oauth_state")
    if cookie_state and state != cookie_state:
        logger.warning("State mismatch: cookie=%s param=%s", cookie_state, state)
        raise HTTPException(status_code=400, detail="State mismatch")

    ref_code = request.cookies.get("ref_code")

    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=20.0) as client:
        token_response = await client.post(
            GOOGLE_TOKEN_URL,
            data=token_data,
            headers={"Accept": "application/json"},
        )

        if token_response.status_code != 200:
            logger.error("Token exchange failed: %s", token_response.text)
            raise HTTPException(status_code=400, detail="Failed to get token from Google")

        tokens = token_response.json()
        access_token = tokens.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail="No access token received")

        userinfo_response = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )

        if userinfo_response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to get user info")

        user_info = userinfo_response.json()

    google_id = user_info.get("id")
    email = user_info.get("email")
    full_name = user_info.get("name")
    avatar_url = user_info.get("picture")

    if not google_id or not email:
        raise HTTPException(status_code=400, detail="Incomplete user info from Google")

    user = db.query(User).filter(User.google_id == google_id).first()
    is_new_user = False

    if not user:
        user = db.query(User).filter(User.email == email).first()

        if not user:
            is_new_user = True
            user = User(
                google_id=google_id,
                email=email,
                full_name=full_name,
                avatar_url=avatar_url,
                auth_provider="google",
                tariff_type="free",
                photo_uses_remaining=0,
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            if ref_code:
                referrer = db.query(User).filter(User.id == ref_code).first()
                if referrer and referrer.id != user.id:
                    referral = Referral(
                        referrer_id=referrer.id,
                        invited_user_id=user.id
                    )
                    db.add(referral)
                    db.commit()
                    logger.info("Referral created: referrer=%s invited=%s", referrer.id, user.id)
        else:
            user.google_id = google_id
            user.auth_provider = "google"
            if full_name and not user.full_name:
                user.full_name = full_name
            if avatar_url and not user.avatar_url:
                user.avatar_url = avatar_url
            db.commit()
    else:
        if full_name:
            user.full_name = full_name
        if avatar_url:
            user.avatar_url = avatar_url
        db.commit()

    token = create_access_token(user.id)

    logger.info("User authenticated: id=%s email=%s is_new=%s", user.id, user.email, is_new_user)

    # ── КЛЮЧЕВОЙ ФИК ДЛЯ ANDROID ─────────────────────────────────────────────
    # Вместо прямого RedirectResponse используем HTML-страницу которая:
    # 1. Устанавливает cookie через Set-Cookie header (браузер точно сохраняет)
    # 2. Делает редирект через JS после небольшой задержки
    # Это решает проблему с Android где cookie не успевает сохраниться
    # при мгновенном 302 редиректе после OAuth callback
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Входим...</title>
  <style>
    body {{ background: #000; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }}
    p {{ color: #fff; font-family: sans-serif; font-size: 16px; }}
  </style>
</head>
<body>
  <p>Входим...</p>
  <script>
    // Cookie уже установлена через Set-Cookie header.
    // Даём браузеру 100ms сохранить её, затем редиректим.
    setTimeout(function() {{
      window.location.href = '/dashboard';
    }}, 100);
  </script>
</body>
</html>"""

    html_response = HTMLResponse(content=html_content, status_code=200)

    # Устанавливаем auth cookie
    set_auth_cookie(html_response, token)

    # Очищаем временные cookie
    html_response.delete_cookie(key="oauth_state", path="/")
    html_response.delete_cookie(key="ref_code", path="/")
    # На всякий случай чистим и старые пути
    html_response.delete_cookie(key="oauth_state", path="/api/auth")
    html_response.delete_cookie(key="ref_code", path="/api/auth")

    return html_response


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    total_uses = (
        (current_user.photo_uses_remaining or 0) +
        (current_user.bonus_uses_remaining or 0)
    )

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "avatar_url": current_user.avatar_url,
        "tariff_type": current_user.tariff_type,
        "tariff_expire": current_user.tariff_expire.isoformat() if current_user.tariff_expire else None,
        "photo_uses_remaining": current_user.photo_uses_remaining,
        "bonus_uses_remaining": current_user.bonus_uses_remaining,
        "total_uses_remaining": total_uses,
        "payment_method_id": current_user.payment_method_id,
        "auto_payment_enabled": current_user.auto_payment_enabled,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None,
    }


@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="token", path="/")
    return {"ok": True, "message": "Logged out"}


__all__ = ["router", "get_current_user", "create_access_token"]