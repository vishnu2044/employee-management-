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

class DailyAttendanceRecordOut(BaseModel):
    date: date
    entry_time: Optional[str] = None
    exit_time: Optional[str] = None
    shift: Optional[str] = None
    worked_minutes: int = 0
    late_minutes: int = 0
    status: str

class CompanyEmployeeReportOut(BaseModel):
    employee_number: int
    employee_id: UUID
    employee_code: str
    employee_name: str
    role: Optional[str] = "Employee"
    is_active: bool = True
    shift: Optional[str] = None
    total_worked_minutes: int
    present_days: int
    absent_days: int
    late_days: int
    records: List[DailyAttendanceRecordOut]

class CompanyReportSummaryOut(BaseModel):
    total_employees: int
    total_worked_minutes: int
    total_present_days: int
    total_absent_days: int
    total_late_days: int

class CompanyAttendanceReportOut(BaseModel):
    company_name: str = "Piekarnia Putka"
    application_name: str = "Attendance & Working Hours System"
    report_title: str = "Attendance & Working Hours Report"
    period_type: str
    start_date: date
    end_date: date
    generated_at: str
    summary: CompanyReportSummaryOut
    employees: List[CompanyEmployeeReportOut]
