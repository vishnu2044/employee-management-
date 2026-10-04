from pydantic import BaseModel
from typing import List, Optional
from uuid import UUID
from datetime import date

class EmployeeSummaryOut(BaseModel):
    employee_id: UUID
    employee_name: str
    period: str
    total_worked_minutes: int
    present_days: int
    absent_days: int
    late_days: int
    average_daily_minutes: int

class ReportAttendanceRecord(BaseModel):
    attendance_date: date
    entry_time: Optional[str]
    exit_time: Optional[str]
    worked_minutes: int
    late_minutes: Optional[int] = 0
    status: str

class EmployeeReportOut(BaseModel):
    employee_id: UUID
    employee_name: str
    start_date: date
    end_date: date
    records: List[ReportAttendanceRecord]
    total_worked_minutes: int
    present_days: int
    absent_days: int
    late_days: int
    average_daily_minutes: int
