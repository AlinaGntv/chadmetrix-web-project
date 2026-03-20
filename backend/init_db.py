from database import engine
from models.models import Base

print("Создание таблиц в SQLite...")
Base.metadata.create_all(bind=engine)
print("Готово! Файл базы данных chadmetrix.db создан в папке backend")