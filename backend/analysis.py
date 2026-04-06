# backend/analysis.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
import uuid
import os
import json
import logging
from io import BytesIO
from typing import Optional, List
from datetime import datetime

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
TARGET_SIZE = (1200, 1200)
JPEG_QUALITY = 85

os.makedirs(UPLOAD_DIR, exist_ok=True)


def compress_image(file: UploadFile) -> BytesIO:
    """Сжимает изображение до приемлемого размера"""
    image = Image.open(file.file)

    if image.mode in ('RGBA', 'P'):
        image = image.convert('RGB')

    image.thumbnail(TARGET_SIZE, Image.Resampling.LANCZOS)

    output = BytesIO()
    image.save(output, format='JPEG', quality=JPEG_QUALITY, optimize=True)
    output.seek(0)

    original_size = getattr(file, 'size', 0) or 0
    compressed_size = len(output.getvalue())
    logger.info(f"[IMAGE] Compressed: {original_size // 1024}KB → {compressed_size // 1024}KB")

    return output


def save_file(file: UploadFile) -> tuple[str, str]:
    """Сохраняет файл, возвращает (local_path, public_url)"""
    ext = file.filename.split(".")[-1].lower() if file.filename else 'jpg'
    if ext not in ['jpg', 'jpeg', 'png', 'webp']:
        raise HTTPException(400, "Only JPG, PNG, WEBP allowed")

    try:
        file.file.seek(0, 2)
        original_size = file.file.tell()
        file.file.seek(0)
    except:
        original_size = 0

    if original_size > MAX_FILE_SIZE:
        raise HTTPException(413, f"File too large. Max size is 2MB.")

    compressed = compress_image(file)

    name = f"{uuid.uuid4()}.jpg"
    local_path = os.path.join(UPLOAD_DIR, name)
    public_url = f"{PUBLIC_URL_BASE}/{name}"

    with open(local_path, "wb") as f:
        f.write(compressed.getvalue())

    try:
        os.chown(local_path, 33, 33)
        os.chmod(local_path, 0o644)
        logger.info(f"[UPLOAD] File {name} created with www-data ownership")
    except Exception as e:
        logger.warning(f"[UPLOAD] Could not change file permissions: {e}")

    return local_path, public_url


@router.post("")
async def create_analysis(
    background_tasks: BackgroundTasks,
    photo_front: UploadFile = File(..., description="Front face photo"),
    photo_side: UploadFile | None = File(None, description="Side face photo (optional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Создать анализ лица с поддержкой разных тарифов"""
    
    logger.info(f"[UPLOAD] User={current_user.id}, tariff={current_user.tariff_type}, front={photo_front.filename if photo_front else 'MISSING'}, side={photo_side.filename if photo_side else 'NONE'}")

    if not photo_front:
        raise HTTPException(400, "photo_front is required")

    # Проверка лимитов
    total_available = (current_user.photo_uses_remaining or 0) + (current_user.bonus_uses_remaining or 0)
    
    if total_available <= 0:
        raise HTTPException(403, "No photo analyses remaining. Please upgrade your plan.")
    
    # Определяем, можно ли загружать профиль
    tariff_type = current_user.tariff_type.lower()
    can_use_side = tariff_type in ['htn', 'chad'] or current_user.bonus_uses_remaining > 0
    
    # Если пользователь пытается загрузить профиль, но не имеет права
    if photo_side and not can_use_side:
        raise HTTPException(403, "Side photo is only available for HTN/CHAD tariffs or with bonus uses")
    
    # Определяем тип тарифа для LLM
    is_chad_tariff = tariff_type == 'chad'
    has_side_photo = photo_side is not None

    # Сохраняем фото
    try:
        front_path, front_url = save_file(photo_front)
    except Exception as e:
        logger.error(f"[UPLOAD] Failed to save front photo: {e}")
        raise HTTPException(400, f"Failed to process front photo: {str(e)}")

    side_url = None
    if photo_side and can_use_side:
        try:
            _, side_url = save_file(photo_side)
        except Exception as e:
            logger.error(f"[UPLOAD] Failed to save side photo: {e}")

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

    # Списание бонуса или обычного лимита
    if current_user.bonus_uses_remaining > 0:
        current_user.bonus_uses_remaining -= 1
        logger.info(f"[UPLOAD] Used bonus use for user {current_user.id}. Remaining bonus: {current_user.bonus_uses_remaining}")
    elif current_user.photo_uses_remaining > 0:
        current_user.photo_uses_remaining -= 1
        logger.info(f"[UPLOAD] Used regular use for user {current_user.id}. Remaining regular: {current_user.photo_uses_remaining}")

    db.commit()

    # 🔥 ИСПРАВЛЕНО: Передаём оба URL в фоновую задачу
    background_tasks.add_task(
        process_analysis_task,
        analysis.id,
        front_url,
        side_url,  # ← ДОБАВЛЯЕМ ФОТО ПРОФИЛЯ
        current_user.id,
        has_side_photo,
        is_chad_tariff
    )

    logger.info(f"[UPLOAD] Analysis created: {analysis.id}, type: {'CHAD' if is_chad_tariff else ('HTN' if has_side_photo else 'BASIC')}")

    return {
        "analysis_id": analysis.id,
        "status": "processing",
        "analysis_type": "chad" if is_chad_tariff else ("htn" if has_side_photo else "basic"),
        "message": "Analysis started. Check /api/analysis/{id}/status for progress."
    }


def process_analysis_task(analysis_id: str, front_url: str, side_url: str | None, user_id: str, has_side_photo: bool, is_chad_tariff: bool):
    """Фоновая обработка — создаём свою сессию БД"""
    db = SessionLocal()
    try:
        import asyncio
        asyncio.run(_process_analysis(analysis_id, front_url, side_url, user_id, has_side_photo, is_chad_tariff, db))
    finally:
        db.close()


async def _process_analysis(analysis_id: str, front_url: str, side_url: str | None, user_id: str, has_side_photo: bool, is_chad_tariff: bool, db: Session):
    """Асинхронная обработка анализа с поддержкой двух фото"""
    try:
        logger.info(f"[ANALYSIS] Starting LLM analysis for {analysis_id}, has_side_photo={has_side_photo}, is_chad_tariff={is_chad_tariff}")
        logger.info(f"[ANALYSIS] Front URL: {front_url}")
        if side_url:
            logger.info(f"[ANALYSIS] Side URL: {side_url}")

        # 🔥 ИСПРАВЛЕНО: Передаём оба URL в analyze_face
        result = await vsellm_client.analyze_face(
            front_url,
            side_url=side_url,  # ← ДОБАВЛЯЕМ ФОТО ПРОФИЛЯ
            days=30, 
            has_side_photo=has_side_photo, 
            is_chad_tariff=is_chad_tariff
        )

        logger.info(f"[ANALYSIS] LLM returned scores: obj={result.get('objective_score')}, pot={result.get('potential_score')}")

        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            logger.error(f"[ANALYSIS] Analysis {analysis_id} not found")
            return

        analysis.metrics = json.dumps(result.get('metrics', {}))

        weak_zones = result.get('weak_zones_focus', [])
        if not weak_zones:
            weak_zones = [k for k, v in result.get('metrics', {}).items() if isinstance(v, dict) and v.get('value', 0) < 5]
        analysis.weak_zones = json.dumps(weak_zones)

        user = db.query(User).filter(User.id == user_id).first()

        # Для CHAD тарифа добавляем акцент на слабые зоны в метаданные
        meta_data = {
            'category': result.get('category'),
            'summary': result.get('summary'),
            'analysis_type': result.get('analysis_type'),
            'has_side_photo': has_side_photo,
            'weak_zones_focus': weak_zones if is_chad_tariff else []
        }

        report = Report(
            id=str(uuid.uuid4()),
            user_id=user_id,
            tariff=user.tariff_type if user else 'free',
            overall_score=result.get('objective_score'),
            potential_score=result.get('potential_score'),
            metrics_data=json.dumps(result.get('metrics', {})),
            improvement_plan=result.get('roadmap'),
            meta=json.dumps(meta_data)
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
            "analysis_type": json.loads(report.meta).get('analysis_type') if report and report.meta else None,
            "weak_zones_focus": json.loads(report.meta).get('weak_zones_focus') if report and report.meta else []
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


@router.get("/history")
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Получить историю анализов пользователя для сравнений"""
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.is_deleted == False
    ).order_by(desc(Analysis.created_at)).offset(offset).limit(limit).all()
    
    result = []
    for analysis in analyses:
        report = db.query(Report).filter(Report.id == analysis.report_id).first()
        result.append({
            "id": analysis.id,
            "created_at": analysis.created_at.isoformat(),
            "has_report": analysis.report_id is not None,
            "overall_score": report.overall_score if report else None,
            "photos": json.loads(analysis.photos) if analysis.photos else []
        })
    
    return {
        "analyses": result,
        "total": len(result)
    }


@router.post("/compare/system")
async def system_comparison(
    analysis_ids: List[str],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Системное сравнение метрик между анализами"""
    analyses = db.query(Analysis).filter(
        Analysis.id.in_(analysis_ids),
        Analysis.user_id == current_user.id
    ).all()
    
    if len(analyses) < 2:
        raise HTTPException(400, "Need at least 2 analyses for comparison")
    
    reports = []
    for analysis in analyses:
        report = db.query(Report).filter(Report.id == analysis.report_id).first()
        if report and report.metrics_data:
            reports.append({
                "id": analysis.id,
                "date": analysis.created_at.isoformat(),
                "metrics": json.loads(report.metrics_data),
                "overall_score": report.overall_score
            })
    
    if len(reports) < 2:
        raise HTTPException(400, "Not enough completed reports for comparison")
    
    # Сравниваем метрики
    comparison = {
        "analyses": reports,
        "metrics_progress": {},
        "overall_progress": reports[-1]["overall_score"] - reports[0]["overall_score"] if reports[0]["overall_score"] and reports[-1]["overall_score"] else 0
    }
    
    # Сравниваем каждую метрику
    first_metrics = reports[0].get("metrics", {})
    last_metrics = reports[-1].get("metrics", {})
    
    for metric_name in first_metrics:
        first_value = first_metrics.get(metric_name, {}).get("value", 0)
        last_value = last_metrics.get(metric_name, {}).get("value", 0)
        comparison["metrics_progress"][metric_name] = {
            "first": first_value,
            "last": last_value,
            "change": last_value - first_value
        }
    
    return comparison


@router.post("/compare/llm")
async def llm_comparison(
    before_analysis_id: str,
    after_analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """LLM сравнение двух фото (глубокий анализ изменений)"""
    before_analysis = db.query(Analysis).filter(
        Analysis.id == before_analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    after_analysis = db.query(Analysis).filter(
        Analysis.id == after_analysis_id,
        Analysis.user_id == current_user.id
    ).first()
    
    if not before_analysis or not after_analysis:
        raise HTTPException(404, "Analysis not found")
    
    # Получаем фото
    before_photos = json.loads(before_analysis.photos) if before_analysis.photos else []
    after_photos = json.loads(after_analysis.photos) if after_analysis.photos else []
    
    if not before_photos or not after_photos:
        raise HTTPException(400, "Photos not found for comparison")
    
    # Используем первое фото (анфас) для сравнения
    before_url = before_photos[0]
    after_url = after_photos[0]
    
    comparison_result = await vsellm_client.analyze_comparison(
        before_url, 
        after_url, 
        is_llm_comparison=True
    )
    
    return {
        "before_analysis_id": before_analysis_id,
        "after_analysis_id": after_analysis_id,
        "before_date": before_analysis.created_at.isoformat(),
        "after_date": after_analysis.created_at.isoformat(),
        "comparison": comparison_result["comparison"]
    }