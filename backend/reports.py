# backend/reports.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.models import Report, User
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


@router.get("/{report_id}")
def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить детали конкретного отчета"""
    report = db.query(Report).filter(
        Report.id == report_id,
        Report.user_id == current_user.id,
        Report.is_deleted == False
    ).first()
    
    if not report:
        raise HTTPException(404, "Report not found")
    
    import json
    
    return {
        "id": report.id,
        "tariff": report.tariff,
        "overall_score": float(report.overall_score) if report.overall_score else None,
        "potential_score": float(report.potential_score) if report.potential_score else None,
        "metrics_data": json.loads(report.metrics_data) if report.metrics_data else None,
        "improvement_plan": report.improvement_plan,
        "meta": json.loads(report.meta) if report.meta else None,
        "created_at": report.created_at.isoformat() if report.created_at else None,
        "updated_at": report.updated_at.isoformat() if report.updated_at else None,
        "analysis_id": report.analysis_id,
    }