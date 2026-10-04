from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date

from app.core.database import get_db
from app.schemas.report import EmployeeSummaryOut, EmployeeReportOut
from app.services import report_service

router = APIRouter()

@router.get("/attendance", response_model=EmployeeReportOut)
def get_attendance_report(
    employee_id: UUID,
    start_date: date,
    end_date: date,
    db: Session = Depends(get_db)
):
    return report_service.get_attendance_report(db, employee_id, start_date, end_date)

@router.get("/summary/{employee_id}", response_model=EmployeeSummaryOut)
def get_employee_summary(
    employee_id: UUID,
    period: str,
    year: int,
    month: int,
    db: Session = Depends(get_db)
):
    return report_service.get_employee_summary(db, employee_id, period, year, month)
