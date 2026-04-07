# backend/common/config.py
import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # Google OAuth
    GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://chadmetrix.ru/api/auth/callback/google")
    
    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
    
    # Frontend
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
    
    # YooKassa
    YOOKASSA_SHOP_ID = os.getenv("YOOKASSA_SHOP_ID")
    YOOKASSA_SECRET_KEY = os.getenv("YOOKASSA_SECRET_KEY")
    YOOKASSA_API_URL = os.getenv("YOOKASSA_API_URL", "https://api.yookassa.ru/v3/")
    
    # VseLLM
    VSELM_API_KEY = os.getenv("VSELM_API_KEY")
    VSELM_BASE_URL = os.getenv("VSELM_BASE_URL", "https://api.vsellm.ru/v1")
    VSELM_MODEL = os.getenv("VSELM_MODEL", "google/gemini-2.5-pro")

settings = Settings()