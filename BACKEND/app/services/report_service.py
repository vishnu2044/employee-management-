from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import List
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.schemas.report import EmployeeSummaryOut, ReportAttendanceRecord, EmployeeReportOut
from app.core.exceptions import EntityNotFoundError
from sqlalchemy import func

def get_employee_summary(db: Session, employee_id: UUID, period: str, year: int, month: int) -> EmployeeSummaryOut:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise EntityNotFoundError("Employee not found")
        
    query = db.query(Attendance).filter(Attendance.employee_id == employee_id)
    
    if period.lower() == "month":
        query = query.filter(
            func.extract('year', Attendance.attendance_date) == year,
            func.extract('month', Attendance.attendance_date) == month
        )
        
    records = query.all()
    
    total_minutes = sum(r.worked_minutes for r in records)
    present = sum(1 for r in records if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE))
    absent = sum(1 for r in records if r.status == AttendanceStatus.ABSENT)
    late = sum(1 for r in records if r.status == AttendanceStatus.LATE)
    
    avg_minutes = total_minutes // present if present > 0 else 0
    
    return EmployeeSummaryOut(
        employee_id=employee.id,
        employee_name=employee.full_name,
        period=period.upper(),
        total_worked_minutes=total_minutes,
        present_days=present,
        absent_days=absent,
        late_days=late,
        average_daily_minutes=avg_minutes
    )

def get_attendance_report(db: Session, employee_id: UUID, start_date: date, end_date: date) -> EmployeeReportOut:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise EntityNotFoundError("Employee not found")
        
    records = db.query(Attendance).filter(
        Attendance.employee_id == employee_id,
        Attendance.attendance_date >= start_date,
        Attendance.attendance_date <= end_date
    ).order_by(Attendance.attendance_date).all()
    
    report_records = []
    total_minutes = 0
    present = 0
    absent = 0
    late = 0
    
    for r in records:
        report_records.append(ReportAttendanceRecord(
            attendance_date=r.attendance_date,
            entry_time=r.entry_time,
            exit_time=r.exit_time,
            worked_minutes=r.worked_minutes,
            status=r.status.value
        ))
        total_minutes += r.worked_minutes
        if r.status in (AttendanceStatus.PRESENT, AttendanceStatus.LATE):
            present += 1
        if r.status == AttendanceStatus.ABSENT:
            absent += 1
        if r.status == AttendanceStatus.LATE:
            late += 1
            
    avg_minutes = total_minutes // present if present > 0 else 0
    
    return EmployeeReportOut(
        employee_id=employee.id,
        employee_name=employee.full_name,
        start_date=start_date,
        end_date=end_date,
        records=report_records,
        total_worked_minutes=total_minutes,
        present_days=present,
        absent_days=absent,
        late_days=late,
        average_daily_minutes=avg_minutes
    )
