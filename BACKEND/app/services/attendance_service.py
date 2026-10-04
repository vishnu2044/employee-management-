from sqlalchemy.orm import Session
from uuid import UUID
from datetime import date
from typing import List, Optional
from app.models.attendance import Attendance, AttendanceStatus
from app.models.employee import Employee
from app.models.attendance_history import AttendanceHistory
from app.schemas.attendance import AttendanceCreate, AttendanceUpdate, AttendanceAbsent, WeeklyAttendanceOut, WeeklyEmployeeAttendance, DayAttendance
from app.core.exceptions import EntityNotFoundError, DuplicateEntityError, ValidationError
from app.utils.calculations import calculate_worked_minutes, calculate_late_minutes
from app.utils.datetime import get_week_range, parse_time
from app.core.config import settings

def get_attendance_by_id(db: Session, attendance_id: UUID) -> Attendance:
    att = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not att:
        raise EntityNotFoundError("Attendance record not found")
    return att

def create_attendance(db: Session, attendance_in: AttendanceCreate, is_supervisor: bool = False, username: Optional[str] = None) -> Attendance:
    # Allow night shifts, so no exit <= entry validation here
    
    # Check duplicate
    existing = db.query(Attendance).filter(
        Attendance.employee_id == attendance_in.employee_id,
        Attendance.attendance_date == attendance_in.attendance_date
    ).first()
    if existing:
        raise DuplicateEntityError("Attendance has already been recorded for this date")
    
    worked_min = calculate_worked_minutes(attendance_in.entry_time, attendance_in.exit_time)
    late_min = calculate_late_minutes(attendance_in.entry_time)
    status = AttendanceStatus.LATE if late_min > 0 else AttendanceStatus.PRESENT
    
    att = Attendance(
        employee_id=attendance_in.employee_id,
        attendance_date=attendance_in.attendance_date,
        entry_time=attendance_in.entry_time,
        exit_time=attendance_in.exit_time,
        worked_minutes=worked_min,
        late_minutes=late_min,
        status=status,
        created_by=username if is_supervisor else None
    )
    
    db.add(att)
    db.commit()
    db.refresh(att)
    
    # Create history record
    hist = AttendanceHistory(
        attendance_id=att.id,
        employee_id=att.employee_id,
        attendance_date=att.attendance_date,
        new_entry_time=att.entry_time,
        new_exit_time=att.exit_time,
        action="CREATED",
        changed_by=username if is_supervisor else "SYSTEM"
    )
    db.add(hist)
    db.commit()
    
    return att

def update_attendance(db: Session, attendance_id: UUID, attendance_in: AttendanceUpdate, username: str) -> Attendance:
    att = get_attendance_by_id(db, attendance_id)
    
    old_entry = att.entry_time
    old_exit = att.exit_time
    
    new_entry = attendance_in.entry_time or att.entry_time
    new_exit = attendance_in.exit_time or att.exit_time
    
    # Allow night shifts, so no exit <= entry validation here

    att.entry_time = new_entry
    att.exit_time = new_exit
    if new_entry and new_exit:
        att.worked_minutes = calculate_worked_minutes(new_entry, new_exit)
        att.late_minutes = calculate_late_minutes(new_entry)
        att.status = AttendanceStatus.LATE if att.late_minutes > 0 else AttendanceStatus.PRESENT
        
    att.updated_by = username
    
    hist = AttendanceHistory(
        attendance_id=att.id,
        employee_id=att.employee_id,
        attendance_date=att.attendance_date,
        old_entry_time=old_entry,
        old_exit_time=old_exit,
        new_entry_time=new_entry,
        new_exit_time=new_exit,
        action="SUPERVISOR_EDITED",
        reason=attendance_in.reason,
        changed_by=username
    )
    
    db.add(hist)
    db.commit()
    db.refresh(att)
    return att

def mark_absent(db: Session, absent_in: AttendanceAbsent, username: str) -> Attendance:
    existing = db.query(Attendance).filter(
        Attendance.employee_id == absent_in.employee_id,
        Attendance.attendance_date == absent_in.attendance_date
    ).first()
    
    if existing:
        if existing.status == AttendanceStatus.ABSENT:
            return existing
        raise DuplicateEntityError("Attendance already exists for this date")
    
    att = Attendance(
        employee_id=absent_in.employee_id,
        attendance_date=absent_in.attendance_date,
        status=AttendanceStatus.ABSENT,
        created_by=username
    )
    db.add(att)
    db.commit()
    db.refresh(att)
    
    hist = AttendanceHistory(
        attendance_id=att.id,
        employee_id=att.employee_id,
        attendance_date=att.attendance_date,
        action="MARKED_ABSENT",
        reason=absent_in.reason,
        changed_by=username
    )
    db.add(hist)
    db.commit()
    return att

def remove_absence(db: Session, attendance_id: UUID, username: str):
    att = get_attendance_by_id(db, attendance_id)
    if att.status != AttendanceStatus.ABSENT:
        raise ValidationError("Only ABSENT records can be removed via this operation")
    
    hist = AttendanceHistory(
        attendance_id=att.id,
        employee_id=att.employee_id,
        attendance_date=att.attendance_date,
        action="ABSENCE_REMOVED",
        changed_by=username
    )
    db.add(hist)
    db.delete(att)
    db.commit()

def get_weekly_attendance(db: Session, target_date: date) -> WeeklyAttendanceOut:
    week_start, week_end = get_week_range(target_date)
    today = get_week_range(date.today())[0] # dummy check, we should pass current business date actually
    from app.utils.datetime import get_current_business_date
    actual_today = get_current_business_date(settings.APP_TIMEZONE)
    
    active_employees = db.query(Employee).filter(Employee.is_active == True).all()
    
    attendances = db.query(Attendance).filter(
        Attendance.attendance_date >= week_start,
        Attendance.attendance_date <= week_end
    ).all()
    
    emp_ids_with_att = list(set([a.employee_id for a in attendances]))
    inactive_employees_with_att = db.query(Employee).filter(
        Employee.is_active == False,
        Employee.id.in_(emp_ids_with_att)
    ).all() if emp_ids_with_att else []
    
    employees = active_employees + inactive_employees_with_att
    
    att_map = {}
    for a in attendances:
        if a.employee_id not in att_map:
            att_map[a.employee_id] = {}
        att_map[a.employee_id][a.attendance_date] = a
        
    result_employees = []
    today_present = 0
    today_late = 0
    today_absent = 0
    
    for emp in employees:
        weekly_total = 0
        days = []
        import datetime
        for i in range(7):
            current_day = week_start + datetime.timedelta(days=i)
            emp_att = att_map.get(emp.id, {}).get(current_day)
            
            if emp_att:
                weekly_total += emp_att.worked_minutes
                days.append(DayAttendance(
                    date=current_day,
                    status=emp_att.status,
                    entry_time=emp_att.entry_time,
                    exit_time=emp_att.exit_time,
                    worked_minutes=emp_att.worked_minutes,
                    late_minutes=emp_att.late_minutes
                ))
                
                if current_day == actual_today:
                    if emp_att.status == AttendanceStatus.PRESENT:
                        today_present += 1
                    elif emp_att.status == AttendanceStatus.LATE:
                        today_late += 1
                    elif emp_att.status == AttendanceStatus.ABSENT:
                        today_absent += 1
            else:
                days.append(DayAttendance(
                    date=current_day,
                    status="UPCOMING",
                    entry_time=None,
                    exit_time=None,
                    worked_minutes=0,
                    late_minutes=0
                ))
        
        result_employees.append(WeeklyEmployeeAttendance(
            id=emp.id,
            name=emp.full_name,
            role=emp.role,
            weekly_total_minutes=weekly_total,
            days=days
        ))
        
    return WeeklyAttendanceOut(
        week_start=week_start,
        week_end=week_end,
        today=actual_today,
        today_present=today_present,
        today_late=today_late,
        today_absent=today_absent,
        employees=result_employees
    )
