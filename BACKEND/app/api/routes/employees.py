from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID

from app.core.database import get_db
from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.schemas.attendance import AttendanceHistoryOut
from app.services import employee_service
from app.api.deps import get_current_supervisor

router = APIRouter()

@router.get("/", response_model=List[EmployeeOut])
def list_employees(include_inactive: bool = False, db: Session = Depends(get_db)):
    return employee_service.get_employees(db, include_inactive)

@router.get("/{id}", response_model=EmployeeOut)
def get_employee(id: UUID, db: Session = Depends(get_db)):
    return employee_service.get_employee(db, id)

@router.post("/", response_model=EmployeeOut, status_code=status.HTTP_201_CREATED)
def create_employee(
    employee_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_supervisor = Depends(get_current_supervisor)
):
    return employee_service.create_employee(db, employee_in)

@router.patch("/{id}", response_model=EmployeeOut)
def update_employee(
    id: UUID,
    employee_in: EmployeeUpdate,
    db: Session = Depends(get_db),
    current_supervisor = Depends(get_current_supervisor)
):
    return employee_service.update_employee(db, id, employee_in)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_employee(
    id: UUID,
    db: Session = Depends(get_db),
    current_supervisor = Depends(get_current_supervisor)
):
    employee_service.deactivate_employee(db, id)
    return None

@router.get("/{id}/analytics")
def get_employee_analytics(id: UUID, db: Session = Depends(get_db)):
    from app.models.attendance import Attendance, AttendanceStatus
    from datetime import date
    import datetime
    
    today = date.today()
    # Get current month start and end
    month_start = today.replace(day=1)
    if today.month == 12:
        month_end = today.replace(year=today.year+1, month=1, day=1) - datetime.timedelta(days=1)
    else:
        month_end = today.replace(month=today.month+1, day=1) - datetime.timedelta(days=1)
        
    attendances = db.query(Attendance).filter(
        Attendance.employee_id == id,
        Attendance.attendance_date >= month_start,
        Attendance.attendance_date <= month_end
    ).all()
    
    monthly_minutes = sum(a.worked_minutes for a in attendances if a.worked_minutes)
    days_worked = len([a for a in attendances if a.status in [AttendanceStatus.PRESENT, AttendanceStatus.LATE]])
    
    today_att = next((a for a in attendances if a.attendance_date == today), None)
    today_minutes = today_att.worked_minutes if today_att else 0
    today_entry = today_att.entry_time if today_att else None
    
    return {
        "monthly_minutes": monthly_minutes,
        "days_worked": days_worked,
        "today_minutes": today_minutes,
        "today_entry": today_entry
    }

@router.get("/{id}/history", response_model=List[AttendanceHistoryOut])
def get_employee_history(
    id: UUID,
    action: Optional[str] = None,
    db: Session = Depends(get_db)
):
    from app.models.attendance_history import AttendanceHistory
    query = db.query(AttendanceHistory).filter(AttendanceHistory.employee_id == id)
    if action and action != "ALL":
        query = query.filter(AttendanceHistory.action == action)
    return query.order_by(AttendanceHistory.created_at.desc()).all()

