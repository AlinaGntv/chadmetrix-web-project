# backend/app.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models.models import Base
import auth
import analysis

# Создаем таблицы
Base.metadata.create_all(bind=engine)

app = FastAPI(title="chadmetrix API")

# Настройка CORS
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

# Подключаем роутеры
app.include_router(auth.router)
app.include_router(analysis.router)

@app.get("/")
def root():
    return {"ok": True, "message": "chadmetrix API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/test")
def test():
    return {"message": "Backend connected successfully!"}