from pydantic import BaseModel, ConfigDict, Field
from typing import Optional, List
from uuid import UUID
from datetime import date, datetime
from app.models.attendance import AttendanceStatus

class AttendanceBase(BaseModel):
    employee_id: UUID
    attendance_date: date
    entry_time: str = Field(..., pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    exit_time: str = Field(..., pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")

class AttendanceCreate(AttendanceBase):
    pass

class AttendanceUpdate(BaseModel):
    entry_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    exit_time: Optional[str] = Field(None, pattern=r"^(?:[01]\d|2[0-3]):[0-5]\d$")
    reason: Optional[str] = None

class AttendanceAbsent(BaseModel):
    employee_id: UUID
    attendance_date: date
    reason: Optional[str] = None

class AttendanceOut(BaseModel):
    id: UUID
    employee_id: UUID
    attendance_date: date
    entry_time: Optional[str]
    exit_time: Optional[str]
    status: AttendanceStatus
    worked_minutes: int
    late_minutes: int
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class DayAttendance(BaseModel):
    date: date
    status: AttendanceStatus | str
    entry_time: Optional[str]
    exit_time: Optional[str]
    worked_minutes: int
    late_minutes: int
    
class WeeklyEmployeeAttendance(BaseModel):
    id: UUID
    name: str
    role: Optional[str]
    weekly_total_minutes: int
    days: List[DayAttendance]

class WeeklyAttendanceOut(BaseModel):
    week_start: date
    week_end: date
    today: date
    today_present: int = 0
    today_late: int = 0
    today_absent: int = 0
    employees: List[WeeklyEmployeeAttendance]
