from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.schemas.report import (
    EmployeeSummaryOut, 
    ReportAttendanceRecord, 
    EmployeeReportOut,
    DailyAttendanceRecordOut,
    CompanyEmployeeReportOut,
    CompanyReportSummaryOut,
    CompanyAttendanceReportOut
)
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
            late_minutes=r.late_minutes or 0,
            status=r.status.value if hasattr(r.status, 'value') else str(r.status)
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

def get_company_attendance_report(
    db: Session, 
    start_date: date, 
    end_date: date, 
    period_type: str = "weekly"
) -> CompanyAttendanceReportOut:
    # 1. Build date list
    curr = start_date
    date_list = []
    while curr <= end_date:
        date_list.append(curr)
        curr += timedelta(days=1)
        
    # 2. Query active employees
    active_employees = db.query(Employee).filter(Employee.is_active == True).all()
    active_ids = {e.id for e in active_employees}
    
    # 3. Query attendances in range
    attendances = db.query(Attendance).filter(
        Attendance.attendance_date >= start_date,
        Attendance.attendance_date <= end_date
    ).all()
    
    # 4. Find inactive employees who worked or had attendance in this period
    emp_ids_with_attendance = {a.employee_id for a in attendances}
    inactive_ids_with_att = emp_ids_with_attendance - active_ids
    
    inactive_employees = []
    if inactive_ids_with_att:
        inactive_employees = db.query(Employee).filter(Employee.id.in_(inactive_ids_with_att)).all()
        
    all_employees = sorted(active_employees + inactive_employees, key=lambda e: (not e.is_active, e.full_name))
    
    # Map attendances by (employee_id, attendance_date)
    att_map = {(a.employee_id, a.attendance_date): a for a in attendances}
    
    employee_reports: List[CompanyEmployeeReportOut] = []
    
    for idx, emp in enumerate(all_employees):
        emp_records: List[DailyAttendanceRecordOut] = []
        emp_total_minutes = 0
        emp_present_days = 0
        emp_absent_days = 0
        emp_late_days = 0
        shift_counts = {"DAY": 0, "NIGHT": 0}
        
        for d in date_list:
            att = att_map.get((emp.id, d))
            if att:
                status_str = att.status.value if hasattr(att.status, "value") else str(att.status)
                shift = None
                if att.entry_time and att.exit_time:
                    try:
                        eH = int(att.entry_time.split(":")[0])
                        xH = int(att.exit_time.split(":")[0])
                        shift = "NIGHT" if (xH < eH or eH >= 16) else "DAY"
                        shift_counts[shift] += 1
                    except:
                        shift = "DAY"
                        shift_counts["DAY"] += 1
                
                emp_records.append(DailyAttendanceRecordOut(
                    date=d,
                    entry_time=att.entry_time,
                    exit_time=att.exit_time,
                    shift=shift,
                    worked_minutes=att.worked_minutes or 0,
                    late_minutes=att.late_minutes or 0,
                    status=status_str
                ))
                emp_total_minutes += (att.worked_minutes or 0)
                if status_str in ("PRESENT", "LATE"):
                    emp_present_days += 1
                if status_str == "LATE":
                    emp_late_days += 1
                if status_str == "ABSENT":
                    emp_absent_days += 1
            else:
                # 5=Saturday, 6=Sunday
                is_weekend = d.weekday() in (5, 6)
                status_str = "WEEKEND" if is_weekend else "—"
                emp_records.append(DailyAttendanceRecordOut(
                    date=d,
                    entry_time=None,
                    exit_time=None,
                    shift=None,
                    worked_minutes=0,
                    late_minutes=0,
                    status=status_str
                ))
                
        # Primary shift
        if shift_counts["NIGHT"] > 0 and shift_counts["DAY"] == 0:
            primary_shift = "NIGHT"
        elif shift_counts["NIGHT"] > 0 and shift_counts["DAY"] > 0:
            primary_shift = "MIXED"
        else:
            primary_shift = "DAY"
            
        employee_reports.append(CompanyEmployeeReportOut(
            employee_number=idx + 1,
            employee_id=emp.id,
            employee_code=str(emp.id).split("-")[0],
            employee_name=emp.full_name,
            role=emp.role or "Employee",
            is_active=emp.is_active,
            shift=primary_shift,
            total_worked_minutes=emp_total_minutes,
            present_days=emp_present_days,
            absent_days=emp_absent_days,
            late_days=emp_late_days,
            records=emp_records
        ))
        
    summary = CompanyReportSummaryOut(
        total_employees=len(employee_reports),
        total_worked_minutes=sum(e.total_worked_minutes for e in employee_reports),
        total_present_days=sum(e.present_days for e in employee_reports),
        total_absent_days=sum(e.absent_days for e in employee_reports),
        total_late_days=sum(e.late_days for e in employee_reports)
    )
    
    return CompanyAttendanceReportOut(
        company_name="Piekarnia Putka",
        application_name="Attendance & Working Hours System",
        report_title=f"{period_type.capitalize()} Attendance & Working Hours Report",
        period_type=period_type,
        start_date=start_date,
        end_date=end_date,
        generated_at=datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC"),
        summary=summary,
        employees=employee_reports
    )
