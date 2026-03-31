# backend/analysis.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks, Form
from sqlalchemy.orm import Session
import uuid
import os
import json
import logging
from io import BytesIO

from PIL import Image

from database import get_db, SessionLocal
from models.models import Analysis, Photo, User, Report
from auth import get_current_user
from services.vsellm_client import vsellm_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

UPLOAD_DIR = "/var/www/chadmetrix/uploads"
PUBLIC_URL_BASE = "https://chadmetrix.ru/uploads"
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB
TARGET_SIZE = (1200, 1200)  # Макс размер после сжатия
JPEG_QUALITY = 85

os.makedirs(UPLOAD_DIR, exist_ok=True)


def compress_image(file: UploadFile) -> BytesIO:
    """Сжимает изображение до приемлемого размера"""
    image = Image.open(file.file)
    
    # Конвертируем в RGB (для JPEG)
    if image.mode in ('RGBA', 'P'):
        image = image.convert('RGB')
    
    # Уменьшаем если слишком большое
    image.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)
    
    # Сохраняем с оптимизацией
    output = BytesIO()
    image.save(output, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    output.seek(0)
    
    original_size = getattr(file, 'size', 0) or 0
    compressed_size = len(output.getvalue())
    logger.info(f"[IMAGE] Compressed: {original_size // 1024}KB → {compressed_size // 1024}KB")
    
    return output


def save_file(file: UploadFile) -> tuple[str, str]:
    """Сохраняет файл, сжимает если нужно, возвращает (local_path, public_url)"""
    ext = file.filename.split(".")[-1].lower() if file.filename else 'jpg'
    if ext not in ['jpg', 'jpeg', 'png', 'webp']:
        raise HTTPException(400, "Only JPG, PNG, WEBP allowed")
    
    # Проверяем размер оригинала
    try:
        file.file.seek(0, 2)
        original_size = file.file.tell()
        file.file.seek(0)
    except:
        original_size = 0
    
    if original_size > MAX_FILE_SIZE:
        raise HTTPException(413, f"File too large. Max size is 2MB.")
    
    # Сжимаем всегда для оптимизации
    compressed = compress_image(file)
    
    name = f"{uuid.uuid4()}.jpg"
    local_path = os.path.join(UPLOAD_DIR, name)
    public_url = f"{PUBLIC_URL_BASE}/{name}"

    with open(local_path, "wb") as f:
        f.write(compressed.getvalue())

    return local_path, public_url


@router.post("")
async def create_analysis(
    background_tasks: BackgroundTasks,
    photo_front: UploadFile = File(..., description="Front face photo"),
    photo_side: UploadFile | None = File(None, description="Side face photo (optional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Создать анализ лица"""
    
    # Логирование для отладки
    logger.info(f"[UPLOAD] User={current_user.id}, front={photo_front.filename if photo_front else 'MISSING'}, side={photo_side.filename if photo_side else 'NONE'}")
    
    if not photo_front:
        raise HTTPException(400, "photo_front is required")
    
    if current_user.photo_uses_remaining <= 0:
        raise HTTPException(403, "No photo analyses remaining. Please upgrade your plan.")
    
    # Сохраняем фото (с автоматическим сжатием)
    try:
        front_path, front_url = save_file(photo_front)
    except Exception as e:
        logger.error(f"[UPLOAD] Failed to save front photo: {e}")
        raise HTTPException(400, f"Failed to process front photo: {str(e)}")
    
    side_url = None
    if photo_side:
        try:
            _, side_url = save_file(photo_side)
        except Exception as e:
            logger.error(f"[UPLOAD] Failed to save side photo: {e}")
            # Продолжаем без side фото
    
    # Создаем запись анализа
    analysis = Analysis(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        photos=json.dumps([front_url] + ([side_url] if side_url else [])),
        price=0,
        is_repeat=False,
    )
    db.add(analysis)

    # Создаем записи фото
    photo1 = Photo(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        file_url=front_url,
    )
    db.add(photo1)

    if side_url:
        photo2 = Photo(
            id=str(uuid.uuid4()),
            user_id=current_user.id,
            file_url=side_url,
        )
        db.add(photo2)

    # Уменьшаем лимит
    if current_user.photo_uses_remaining > 0:
        current_user.photo_uses_remaining -= 1
    
    db.commit()

    # Запускаем анализ в фоне
    background_tasks.add_task(
        process_analysis_task,
        analysis.id,
        front_url,
        current_user.id
    )

    logger.info(f"[UPLOAD] Analysis created: {analysis.id}")

    return {
        "analysis_id": analysis.id,
        "status": "processing",
        "message": "Analysis started. Check /api/analysis/{id}/status for progress."
    }


def process_analysis_task(analysis_id: str, photo_url: str, user_id: str):
    """Фоновая обработка — создаём свою сессию БД"""
    db = SessionLocal()
    try:
        import asyncio
        asyncio.run(_process_analysis(analysis_id, photo_url, user_id, db))
    finally:
        db.close()


async def _process_analysis(analysis_id: str, photo_url: str, user_id: str, db: Session):
    """Асинхронная обработка анализа"""
    try:
        logger.info(f"[ANALYSIS] Starting LLM analysis for {analysis_id}")
        
        result = await vsellm_client.analyze_face(photo_url, days=30)
        
        logger.info(f"[ANALYSIS] LLM returned scores: obj={result.get('objective_score')}, pot={result.get('potential_score')}")
        
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            logger.error(f"[ANALYSIS] Analysis {analysis_id} not found")
            return
            
        analysis.metrics = json.dumps(result.get('metrics', {}))
        
        weak_zones = [k for k, v in result.get('metrics', {}).items() if isinstance(v, dict) and v.get('value', 0) < 5]
        analysis.weak_zones = json.dumps(weak_zones)
        
        user = db.query(User).filter(User.id == user_id).first()
        
        report = Report(
            id=str(uuid.uuid4()),
            user_id=user_id,
            tariff=user.tariff_type if user else 'free',
            overall_score=result.get('objective_score'),
            potential_score=result.get('potential_score'),
            metrics_data=json.dumps(result.get('metrics', {})),
            improvement_plan=result.get('roadmap'),
            meta=json.dumps({
                'category': result.get('category'),
                'summary': result.get('summary'),
                'raw_response_preview': result.get('raw_response', '')[:500]
            })
        )
        db.add(report)
        db.flush()
        
        analysis.report_id = report.id
        
        db.commit()
        logger.info(f"[ANALYSIS] {analysis_id} completed successfully, report_id={report.id}")
        
    except Exception as e:
        logger.error(f"[ANALYSIS] Failed to process {analysis_id}: {e}", exc_info=True)
        db.rollback()
        raise


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Получить результат анализа"""
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    
    report = None
    if analysis.report_id:
        report = db.query(Report).filter(Report.id == analysis.report_id).first()
    
    return {
        "id": analysis.id,
        "status": "completed" if report else "processing",
        "photos": json.loads(analysis.photos) if analysis.photos else [],
        "metrics": json.loads(analysis.metrics) if analysis.metrics else None,
        "weak_zones": json.loads(analysis.weak_zones) if analysis.weak_zones else None,
        "report": {
            "overall_score": report.overall_score if report else None,
            "potential_score": report.potential_score if report else None,
            "category": json.loads(report.meta).get('category') if report and report.meta else None,
            "summary": json.loads(report.meta).get('summary') if report and report.meta else None,
            "improvement_plan": report.improvement_plan if report else None,
        } if report else None,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None
    }


@router.get("/{analysis_id}/status")
def get_analysis_status(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Проверить статус анализа"""
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not analysis:
        raise HTTPException(404, "Analysis not found")
    
    has_report = analysis.report_id is not None
    
    return {
        "analysis_id": analysis_id,
        "status": "completed" if has_report else "processing",
        "has_report": has_report,
        "report_id": analysis.report_id
    }