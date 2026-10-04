from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import date

from app.core.database import get_db
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceAbsent, AttendanceOut, WeeklyAttendanceOut
from app.services import attendance_service
from app.api.deps import get_current_supervisor
from app.core.exceptions import AuthorizationError
from app.utils.datetime import get_current_business_date
from app.core.config import settings

router = APIRouter()

from fastapi import Request
from app.api.deps import get_current_supervisor

@router.get("/week", response_model=WeeklyAttendanceOut)
def get_weekly_attendance(
    start_date: date,
    include_inactive: bool = False,
    request: Request = None,
    db: Session = Depends(get_db)
):
    # Check if supervisor
    auth_header = request.headers.get("Authorization") if request else None
    is_supervisor = False
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            from app.core.security import decode_access_token
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                is_supervisor = True
        except:
            pass

    today = get_current_business_date(settings.APP_TIMEZONE)
    # Check if start_date is in the current week
    from app.utils.datetime import get_week_range
    current_week_start, current_week_end = get_week_range(today)
    
    # If not supervisor, can only query if start_date is within current week
    if not is_supervisor:
        if start_date < current_week_start or start_date > current_week_end:
            raise AuthorizationError("Normal users can only view the current week")

    return attendance_service.get_weekly_attendance(db, start_date, include_inactive=include_inactive)

@router.post("/", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def create_attendance(
    attendance_in: AttendanceCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    auth_header = request.headers.get("Authorization")
    is_supervisor = False
    username = None
    if auth_header and auth_header.startswith("Bearer "):
        try:
            token = auth_header.split(" ")[1]
            from app.core.security import decode_access_token
            payload = decode_access_token(token)
            if payload and payload.get("sub"):
                is_supervisor = True
                username = payload.get("sub")
        except:
            pass

    today = get_current_business_date(settings.APP_TIMEZONE)
    if not is_supervisor and attendance_in.attendance_date != today:
        raise AuthorizationError("Normal users can only submit attendance for the current day")
    
    return attendance_service.create_attendance(db, attendance_in, is_supervisor=is_supervisor, username=username)

@router.patch("/{id}", response_model=AttendanceOut)
def update_attendance(
    id: UUID,
    attendance_in: AttendanceUpdate,
    db: Session = Depends(get_db),
    current_supervisor = Depends(get_current_supervisor)
):
    return attendance_service.update_attendance(db, id, attendance_in, current_supervisor.username)

@router.post("/absent", response_model=AttendanceOut, status_code=status.HTTP_201_CREATED)
def mark_absent(
    absent_in: AttendanceAbsent,
    db: Session = Depends(get_db),
    current_supervisor = Depends(get_current_supervisor)
):
    return attendance_service.mark_absent(db, absent_in, current_supervisor.username)

@router.delete("/{id}/absence", status_code=status.HTTP_204_NO_CONTENT)
def remove_absence(
    id: UUID,
    db: Session = Depends(get_db),
    current_supervisor = Depends(get_current_supervisor)
):
    attendance_service.remove_absence(db, id, current_supervisor.username)
    return None
