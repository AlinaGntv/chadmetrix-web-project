# backend/reports.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from database import get_db
from models.models import Report, User, Analysis
from auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["reports"])


@router.get("")
def get_reports(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить все отчеты текущего пользователя"""
    reports = db.query(Report).filter(
        Report.user_id == current_user.id,
        Report.is_deleted == False
    ).order_by(Report.created_at.desc()).all()
    
    return [
        {
            "id": report.id,
            "tariff": report.tariff,
            "overall_score": float(report.overall_score) if report.overall_score else None,
            "potential_score": float(report.potential_score) if report.potential_score else None,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "updated_at": report.updated_at.isoformat() if report.updated_at else None,
        }
        for report in reports
    ]


# === ВАЖНО: /for-comparison ДОЛЖЕН БЫТЬ ДО /{report_id} ===
@router.get("/for-comparison")
def get_reports_for_comparison(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить отчеты для сравнения (с фото и метриками)"""
    
    reports = db.query(Report).filter(
        Report.user_id == current_user.id,
        Report.is_deleted == False
    ).order_by(Report.created_at.desc()).all()
    
    result = []
    for report in reports:
        analysis = db.query(Analysis).filter(
            Analysis.report_id == report.id,
            Analysis.user_id == current_user.id
        ).first()
        
        photos = []
        if analysis and analysis.photos:
            try:
                photos = json.loads(analysis.photos)
            except:
                photos = []
        
        meta = {}
        if report.meta:
            try:
                meta = json.loads(report.meta)
            except:
                pass
        
        result.append({
            "id": report.id,
            "analysis_id": analysis.id if analysis else None,
            "tariff": report.tariff,
            "overall_score": float(report.overall_score) if report.overall_score else None,
            "potential_score": float(report.potential_score) if report.potential_score else None,
            "category": meta.get('category'),
            "photos": photos,
            "created_at": report.created_at.isoformat() if report.created_at else None,
            "metrics": json.loads(report.metrics_data) if report.metrics_data else None
        })
    
    return {
        "reports": result,
        "tariff_type": current_user.tariff_type,
        "total": len(result)
    }


# === /{report_id} ПОСЛЕ всех статичных роутов ===
@router.get("/{report_id}")
def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить детали конкретного отчета с фото"""
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id,
        Report.is_deleted == False
    ).first()
    
    if not report:
        raise HTTPException(404, "Report not found")
    
    analysis = db.query(Analysis).filter(
        Analysis.report_id == report_id,
        Analysis.user_id == current_user.id
    ).first()
    
    photos = []
    if analysis and analysis.photos:
        try:
            photos = json.loads(analysis.photos)
        except:
            photos = []
    
    return {
        "id": report.id,
        "status": "completed",
        "tariff": report.tariff,
        "overall_score": float(report.overall_score) if report.overall_score else None,
        "potential_score": float(report.potential_score) if report.potential_score else None,
        "metrics": json.loads(report.metrics_data) if report.metrics_data else None,
        "weak_zones": json.loads(analysis.weak_zones) if analysis and analysis.weak_zones else None,
        "improvement_plan": report.improvement_plan,
        "meta": json.loads(report.meta) if report.meta else None,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "updated_at": report.updated_at.isoformat() if report.updated_at else None,
        "photos": photos,
        "analysis_id": analysis.id if analysis else None,
        "report": {
            "overall_score": float(report.overall_score) if report.overall_score else None,
            "potential_score": float(report.potential_score) if report.potential_score else None,
            "category": json.loads(report.meta).get('category') if report.meta else None,
            "summary": json.loads(report.meta).get('summary') if report.meta else None,
            "improvement_plan": report.improvement_plan,
        }
    }