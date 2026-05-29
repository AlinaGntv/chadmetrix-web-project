from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks, Form, Query, Body
from sqlalchemy.orm import Session
from sqlalchemy import desc
import uuid
import os
import json
import logging
from io import BytesIO
from typing import Optional, List
from datetime import datetime

from PIL import Image, ExifTags

from database import get_db, SessionLocal
from models.models import Analysis, Photo, User, Report
from auth import get_current_user
from services.vsellm_client import vsellm_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/analysis", tags=["analysis"])

UPLOAD_DIR = "/var/www/chadmetrix/uploads"
PUBLIC_URL_BASE = "https://chadmetrix.ru/uploads"
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15MB — Android камера может давать большие файлы
TARGET_SIZE = (1200, 1200)
JPEG_QUALITY = 85

os.makedirs(UPLOAD_DIR, exist_ok=True)


def fix_exif_rotation(image: Image.Image) -> Image.Image:
    """Исправляем поворот по EXIF — критично для Android-фото"""
    try:
        exif = image._getexif()
        if exif is None:
            return image

        # Находим тег Orientation
        orientation_key = None
        for tag, name in ExifTags.TAGS.items():
            if name == "Orientation":
                orientation_key = tag
                break

        if orientation_key is None or orientation_key not in exif:
            return image

        orientation = exif[orientation_key]

        rotation_map = {
            3: Image.ROTATE_180,
            6: Image.ROTATE_270,
            8: Image.ROTATE_90,
        }
        flip_map = {
            2: Image.FLIP_LEFT_RIGHT,
            4: Image.FLIP_TOP_BOTTOM,
            5: Image.TRANSPOSE,
            7: Image.TRANSVERSE,
        }

        if orientation in rotation_map:
            image = image.transpose(rotation_map[orientation])
        elif orientation in flip_map:
            image = image.transpose(flip_map[orientation])

    except Exception as e:
        logger.warning(f"[IMAGE] Could not fix EXIF rotation: {e}")

    return image


def compress_image(file_bytes: bytes) -> BytesIO:
    """
    Сжатие изображения из байт (не из UploadFile напрямую).
    Принимает bytes чтобы избежать проблем с seek() на Android.
    """
    try:
        image = Image.open(BytesIO(file_bytes))
    except Exception as e:
        raise HTTPException(400, f"Не удалось открыть изображение: {e}. Попробуйте другое фото.")

    # Исправляем EXIF-поворот (Android почти всегда шлёт повёрнутые фото)
    image = fix_exif_rotation(image)

    # Конвертируем в RGB
    if image.mode in ('RGBA', 'P', 'LA'):
        rgb_image = Image.new('RGB', image.size, (255, 255, 255))
        if image.mode == 'P':
            image = image.convert('RGBA')
        if image.mode in ('RGBA', 'LA'):
            rgb_image.paste(image, mask=image.split()[-1])
        else:
            rgb_image.paste(image)
        image = rgb_image
    elif image.mode != 'RGB':
        image = image.convert('RGB')

    # Ресайз только если > 2048px
    MAX_DIMENSION = 2048
    original_size = image.size
    if max(image.size) > MAX_DIMENSION:
        ratio = MAX_DIMENSION / max(image.size)
        new_size = (int(image.size[0] * ratio), int(image.size[1] * ratio))
        image = image.resize(new_size, Image.Resampling.LANCZOS)
        logger.info(f"[IMAGE] Resized from {original_size} to {new_size}")
    else:
        logger.info(f"[IMAGE] No resize needed, keeping {original_size}")

    output = BytesIO()
    image.save(output, format='JPEG', quality=95, optimize=False, progressive=False)
    output.seek(0)

    size_kb = len(output.getvalue()) / 1024
    logger.info(f"[IMAGE] Saved: {size_kb:.0f}KB, size={image.size}, quality=95")

    if size_kb < 150:
        logger.warning(f"[IMAGE] Image too small ({size_kb:.0f}KB) - may cause blur!")

    return output


def save_file(file: UploadFile) -> tuple[str, str]:
    """Сохраняет файл, возвращает (local_path, public_url)"""

    # ── Определяем расширение ─────────────────────────────────────────────────
    # Android часто отдаёт filename без расширения или с нестандартным
    filename = file.filename or ""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

    # Если расширение не определилось или не поддерживается —
    # пробуем определить по content_type
    ALLOWED_EXTS = {'jpg', 'jpeg', 'png', 'webp', 'heic', 'heif'}
    CONTENT_TYPE_MAP = {
        'image/jpeg': 'jpg',
        'image/jpg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/heic': 'heic',
        'image/heif': 'heif',
        'image/gif': 'gif',  # не поддерживается, но распознаём для понятной ошибки
    }

    if ext not in ALLOWED_EXTS:
        content_type = (file.content_type or "").lower()
        ext = CONTENT_TYPE_MAP.get(content_type, "")

    if ext in ('heic', 'heif'):
        raise HTTPException(
            400,
            "HEIC/HEIF формат не поддерживается. "
            "Пожалуйста, сделайте скриншот или переведите фото в JPEG/PNG перед загрузкой."
        )

    if not ext or ext not in {'jpg', 'jpeg', 'png', 'webp'}:
        raise HTTPException(
            400,
            f"Неподдерживаемый формат файла '{ext or filename}'. "
            "Загрузите фото в формате JPG, PNG или WEBP."
        )

    # ── Читаем файл целиком в байты (решает проблему seek на Android) ─────────
    try:
        file_bytes = file.file.read()
    except Exception as e:
        logger.error(f"[UPLOAD] Failed to read file: {e}")
        raise HTTPException(400, "Не удалось прочитать файл. Попробуйте ещё раз.")

    if not file_bytes:
        raise HTTPException(400, "Файл пустой. Выберите другое фото.")

    # ── Проверка размера ───────────────────────────────────────────────────────
    file_size = len(file_bytes)
    logger.info(f"[UPLOAD] File size: {file_size / 1024 / 1024:.1f}MB, ext={ext}, content_type={file.content_type}")

    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            413,
            f"Файл слишком большой ({file_size // 1024 // 1024}MB). Максимум — 15MB."
        )

    # ── Сжимаем ───────────────────────────────────────────────────────────────
    try:
        compressed = compress_image(file_bytes)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPLOAD] Compression failed: {e}", exc_info=True)
        raise HTTPException(400, f"Ошибка обработки изображения: {e}")

    # ── Сохраняем ─────────────────────────────────────────────────────────────
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


# =============================================================================
# СТАТИЧНЫЕ РОУТЫ
# =============================================================================

@router.get("/for-comparison")
def get_analyses_for_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analyses = db.query(Analysis).filter(
        Analysis.user_id == current_user.id,
        Analysis.is_deleted == False,
        Analysis.report_id.isnot(None)
    ).order_by(desc(Analysis.created_at)).all()

    result = []
    for analysis in analyses:
        report = db.query(Report).filter(Report.id == analysis.report_id).first()
        if not report or report.overall_score is None:
            continue
        photos = json.loads(analysis.photos) if analysis.photos else []
        result.append({
            "id": analysis.id,
            "created_at": analysis.created_at.isoformat(),
            "overall_score": float(report.overall_score),
            "photos": photos
        })

    return {"analyses": result, "total": len(result)}


@router.get("/history")
def get_analysis_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
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
            "overall_score": float(report.overall_score) if report and report.overall_score else None,
            "photos": json.loads(analysis.photos) if analysis.photos else []
        })

    return {"analyses": result, "total": len(result)}


@router.post("/compare/system")
async def system_comparison(
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    analysis_ids = request.get('analysis_ids', [])
    tariff_type = current_user.tariff_type.lower()

    if tariff_type in ('basic', 'разовый'):
        raise HTTPException(403, "Системное сравнение доступно только на тарифах HTN и CHAD")

    if len(analysis_ids) < 2:
        raise HTTPException(400, "Need at least 2 analysis_ids in the request")

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
            meta = {}
            if report.meta:
                try:
                    meta = json.loads(report.meta)
                except:
                    pass
            reports.append({
                "id": analysis.id,
                "report_id": report.id,
                "date": analysis.created_at.isoformat(),
                "metrics": json.loads(report.metrics_data),
                "overall_score": report.overall_score,
                "potential_score": report.potential_score,
                "category": meta.get('category')
            })

    if len(reports) < 2:
        raise HTTPException(400, "Not enough completed reports for comparison")

    reports.sort(key=lambda x: x['date'])
    first = reports[0]
    last = reports[-1]

    metrics_progress = {}
    first_metrics = first.get("metrics", {})
    last_metrics = last.get("metrics", {})

    for metric_name in first_metrics:
        fv = first_metrics.get(metric_name, {})
        lv = last_metrics.get(metric_name, {})
        try:
            first_val = float(fv.get("value", 0) if isinstance(fv, dict) else fv)
            last_val = float(lv.get("value", 0) if isinstance(lv, dict) else lv)
        except:
            first_val = last_val = 0

        metrics_progress[metric_name] = {
            "first": first_val,
            "last": last_val,
            "change": round(last_val - first_val, 1),
            "trend": "up" if last_val > first_val else "down" if last_val < first_val else "stable"
        }

    overall_change = 0
    if first.get("overall_score") and last.get("overall_score"):
        try:
            overall_change = round(float(last["overall_score"]) - float(first["overall_score"]), 1)
        except:
            pass

    return {
        "comparison_type": "system",
        "first_report": {
            "id": first["id"], "report_id": first["report_id"],
            "date": first["date"], "overall_score": first["overall_score"],
            "potential_score": first["potential_score"], "category": first.get("category")
        },
        "last_report": {
            "id": last["id"], "report_id": last["report_id"],
            "date": last["date"], "overall_score": last["overall_score"],
            "potential_score": last["potential_score"], "category": last.get("category")
        },
        "metrics_progress": metrics_progress,
        "overall_change": overall_change,
        "trend": "up" if overall_change > 0 else "down" if overall_change < 0 else "stable",
        "reports_count": len(reports)
    }


@router.post("/compare/llm")
async def llm_comparison(
    request: dict = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    before_analysis_id = request.get('before_analysis_id')
    after_analysis_id = request.get('after_analysis_id')

    if not before_analysis_id or not after_analysis_id:
        raise HTTPException(400, "before_analysis_id and after_analysis_id are required")

    tariff_type = current_user.tariff_type.lower()
    if tariff_type != 'chad':
        raise HTTPException(403, "LLM сравнение доступно только на тарифе CHAD")

    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year

    last_used_month = getattr(current_user, 'llm_last_used_month', 0)
    last_used_year = getattr(current_user, 'llm_last_used_year', 0)

    if last_used_year != current_year or last_used_month != current_month:
        current_user.llm_comparisons_used = 0
        current_user.llm_last_used_month = current_month
        current_user.llm_last_used_year = current_year
        db.commit()

    if (current_user.llm_comparisons_used or 0) >= 1:
        raise HTTPException(403, "Лимит LLM сравнений (1) на месяц исчерпан.")

    before_analysis = db.query(Analysis).filter(
        Analysis.id == before_analysis_id, Analysis.user_id == current_user.id
    ).first()
    after_analysis = db.query(Analysis).filter(
        Analysis.id == after_analysis_id, Analysis.user_id == current_user.id
    ).first()

    if not before_analysis or not after_analysis:
        raise HTTPException(404, "Analysis not found")

    before_photos = json.loads(before_analysis.photos) if before_analysis.photos else []
    after_photos = json.loads(after_analysis.photos) if after_analysis.photos else []

    if not before_photos or not after_photos:
        raise HTTPException(400, "Photos not found for comparison")

    comparison_result = await vsellm_client.analyze_comparison(
        before_photos[0], after_photos[0], is_llm_comparison=True
    )

    current_user.llm_comparisons_used = 1
    db.commit()

    return {
        "before_analysis_id": before_analysis_id,
        "after_analysis_id": after_analysis_id,
        "before_date": before_analysis.created_at.isoformat(),
        "after_date": after_analysis.created_at.isoformat(),
        "comparison": comparison_result.get("comparison", {}),
        "llm_comparisons_remaining": 0
    }


# =============================================================================
# ДИНАМИЧЕСКИЕ РОУТЫ
# =============================================================================

@router.post("")
async def create_analysis(
    background_tasks: BackgroundTasks,
    photo_front: UploadFile = File(..., description="Front face photo"),
    photo_side: UploadFile | None = File(None, description="Side face photo (optional)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    logger.info(
        f"[UPLOAD] User={current_user.id}, tariff={current_user.tariff_type}, "
        f"front={photo_front.filename!r}, content_type={photo_front.content_type}, "
        f"side={photo_side.filename if photo_side else 'NONE'}"
    )

    if not photo_front:
        raise HTTPException(400, "photo_front is required")

    total_available = (current_user.photo_uses_remaining or 0) + (current_user.bonus_uses_remaining or 0)
    if total_available <= 0:
        raise HTTPException(403, "No photo analyses remaining. Please upgrade your plan.")

    tariff_type = current_user.tariff_type.lower()
    can_use_side = tariff_type in ['htn', 'chad'] or (current_user.bonus_uses_remaining or 0) > 0

    if photo_side and not can_use_side:
        raise HTTPException(403, "Side photo is only available for HTN/CHAD tariffs or with bonus uses")

    is_chad_tariff = tariff_type == 'chad'
    has_side_photo = photo_side is not None

    try:
        front_path, front_url = save_file(photo_front)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[UPLOAD] Failed to save front photo: {e}", exc_info=True)
        raise HTTPException(400, f"Не удалось обработать фото: {e}")

    side_url = None
    if photo_side and can_use_side:
        try:
            _, side_url = save_file(photo_side)
        except HTTPException as e:
            logger.warning(f"[UPLOAD] Side photo rejected: {e.detail}")
            # Не падаем — просто игнорируем профиль
        except Exception as e:
            logger.error(f"[UPLOAD] Failed to save side photo: {e}")

    analysis = Analysis(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        photos=json.dumps([front_url] + ([side_url] if side_url else [])),
        price=0,
        is_repeat=False,
    )
    db.add(analysis)

    photo1 = Photo(id=str(uuid.uuid4()), user_id=current_user.id, file_url=front_url)
    db.add(photo1)

    if side_url:
        db.add(Photo(id=str(uuid.uuid4()), user_id=current_user.id, file_url=side_url))

    if current_user.bonus_uses_remaining and current_user.bonus_uses_remaining > 0:
        current_user.bonus_uses_remaining -= 1
    elif current_user.photo_uses_remaining and current_user.photo_uses_remaining > 0:
        current_user.photo_uses_remaining -= 1

    db.commit()

    background_tasks.add_task(
        process_analysis_task,
        analysis.id, front_url, side_url, current_user.id, has_side_photo, is_chad_tariff
    )

    logger.info(
        f"[UPLOAD] Analysis created: {analysis.id}, "
        f"type: {'CHAD' if is_chad_tariff else ('HTN' if has_side_photo else 'BASIC')}"
    )

    return {
        "analysis_id": analysis.id,
        "status": "processing",
        "analysis_type": "chad" if is_chad_tariff else ("htn" if has_side_photo else "basic"),
        "message": "Analysis started. Check /api/analysis/{id}/status for progress."
    }


def process_analysis_task(analysis_id, front_url, side_url, user_id, has_side_photo, is_chad_tariff):
    db = SessionLocal()
    try:
        import asyncio
        asyncio.run(_process_analysis(analysis_id, front_url, side_url, user_id,
                                      has_side_photo, is_chad_tariff, db))
    finally:
        db.close()


async def _process_analysis(analysis_id, front_url, side_url, user_id,
                             has_side_photo, is_chad_tariff, db):
    try:
        logger.info(f"[ANALYSIS] Starting LLM for {analysis_id}, side={has_side_photo}, chad={is_chad_tariff}")

        result = await vsellm_client.analyze_face(
            front_url, side_url=side_url, days=30,
            has_side_photo=has_side_photo, is_chad_tariff=is_chad_tariff
        )

        logger.info(
            f"[ANALYSIS] LLM returned: obj={result.get('objective_score')}, "
            f"pot={result.get('potential_score')}, metrics={len(result.get('metrics', {}))}"
        )

        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            logger.error(f"[ANALYSIS] {analysis_id} not found in DB")
            return

        analysis.metrics = json.dumps(result.get('metrics', {}))

        weak_zones = result.get('weak_zones', [])
        if not weak_zones and result.get('metrics'):
            metrics = result.get('metrics', {})
            weak_zones = [
                name for name, data in metrics.items()
                if isinstance(data, dict) and data.get('value', 10) < 5
            ][:5]

        analysis.weak_zones = json.dumps(weak_zones)

        user = db.query(User).filter(User.id == user_id).first()

        meta_data = {
            'category': result.get('category'),
            'summary': result.get('summary'),
            'analysis_type': result.get('analysis_type'),
            'has_side_photo': has_side_photo,
            'weak_zones_focus': weak_zones if is_chad_tariff else [],
            'profile_analysis': result.get('profile_analysis', {}) if has_side_photo else {}
        }

        roadmap_data = result.get('roadmap', {})
        if isinstance(roadmap_data, dict):
            roadmap_json = json.dumps(roadmap_data, ensure_ascii=False)
        else:
            roadmap_json = json.dumps({"week1": str(roadmap_data), "week2": "", "week3": "", "week4": ""})

        report = Report(
            id=str(uuid.uuid4()),
            user_id=user_id,
            tariff=user.tariff_type if user else 'free',
            pdf_url=None,
            overall_score=result.get('objective_score'),
            potential_score=result.get('potential_score'),
            metrics_data=json.dumps(result.get('metrics', {})),
            improvement_plan=roadmap_json,
            meta=json.dumps(meta_data)
        )
        db.add(report)
        db.flush()

        analysis.report_id = report.id
        analysis.status = "completed"
        db.commit()
        logger.info(f"[ANALYSIS] {analysis_id} completed, report_id={report.id}")

    except Exception as e:
        logger.error(f"[ANALYSIS] Failed {analysis_id}: {e}", exc_info=True)
        db.rollback()
        # Сохраняем статус failed чтобы фронт остановил поллинг
        try:
            fail_db = SessionLocal()
            failed_analysis = fail_db.query(Analysis).filter(Analysis.id == analysis_id).first()
            if failed_analysis:
                failed_analysis.status = "failed"
                fail_db.commit()
                logger.info(f"[ANALYSIS] {analysis_id} marked as failed")
            fail_db.close()
        except Exception as db_err:
            logger.error(f"[ANALYSIS] Could not mark as failed: {db_err}")
        raise


@router.get("/{analysis_id}")
def get_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id, Analysis.user_id == current_user.id
    ).first()

    if not analysis:
        raise HTTPException(404, "Analysis not found")

    report = None
    if analysis.report_id:
        report = db.query(Report).filter(Report.id == analysis.report_id).first()

    improvement_plan = None
    if report and report.improvement_plan:
        try:
            roadmap_obj = json.loads(report.improvement_plan)
            improvement_plan = roadmap_obj if isinstance(roadmap_obj, dict) else {"week1": str(roadmap_obj), "week2": "", "week3": "", "week4": ""}
        except:
            improvement_plan = {"week1": report.improvement_plan, "week2": "", "week3": "", "week4": ""}

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
            "improvement_plan": improvement_plan,
            "analysis_type": json.loads(report.meta).get('analysis_type') if report and report.meta else None,
            "weak_zones_focus": json.loads(report.meta).get('weak_zones_focus') if report and report.meta else [],
            "profile_analysis": json.loads(report.meta).get('profile_analysis') if report and report.meta else {}
        } if report else None,
        "created_at": analysis.created_at.isoformat() if analysis.created_at else None
    }


@router.get("/{analysis_id}/status")
def get_analysis_status(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    analysis = db.query(Analysis).filter(
        Analysis.id == analysis_id, Analysis.user_id == current_user.id
    ).first()

    if not analysis:
        raise HTTPException(404, "Analysis not found")

    has_report = analysis.report_id is not None
    # Читаем реальный статус из БД
    db_status = getattr(analysis, "status", None)

    if has_report:
        final_status = "completed"
    elif db_status == "failed":
        final_status = "failed"
    else:
        final_status = "processing"

    return {
        "analysis_id": analysis_id,
        "status": final_status,
        "has_report": has_report,
        "report_id": analysis.report_id
    }