import os
import sys
import datetime
import random
from uuid import uuid4

# Add app to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.models.employee import Employee
from app.models.supervisor import Supervisor
from app.models.attendance import Attendance, AttendanceStatus
from app.core.security import get_password_hash
from app.utils.calculations import calculate_worked_minutes, calculate_late_minutes

# create tables if not exists
Base.metadata.create_all(bind=engine)

def seed_data():
    db = SessionLocal()
    
    # 1. Add Supervisor
    if not db.query(Supervisor).filter_by(username="admin").first():
        sup = Supervisor(
            username="admin",
            password_hash=get_password_hash("admin123"),
            is_active=True
        )
        db.add(sup)
        db.commit()
    
    # 2. Add Employees (Original 5 + 5 New Employees = 10 total)
    employees_data = [
        {"full_name": "John Mathew", "role": "Software Engineer"},
        {"full_name": "Sarah Connor", "role": "Project Manager"},
        {"full_name": "Michael Scott", "role": "Regional Manager"},
        {"full_name": "Jim Halpert", "role": "Sales Representative"},
        {"full_name": "Pam Beesly", "role": "Receptionist"},
        # 5 New Employees
        {"full_name": "Dwight Schrute", "role": "Assistant Regional Manager"},
        {"full_name": "Angela Martin", "role": "Senior Accountant"},
        {"full_name": "Stanley Hudson", "role": "Sales Executive"},
        {"full_name": "Ryan Howard", "role": "Business Analyst"},
        {"full_name": "Kelly Kapoor", "role": "Customer Support Lead"}
    ]
    
    employees = []
    for ed in employees_data:
        emp = db.query(Employee).filter_by(full_name=ed["full_name"]).first()
        if not emp:
            emp = Employee(full_name=ed["full_name"], role=ed["role"], is_active=True)
            db.add(emp)
            db.commit()
            db.refresh(emp)
        employees.append(emp)
        
    # Delete old placeholder names if present
    db.query(Employee).filter(Employee.full_name.in_(["software engineer", "developer"])).delete()
    db.commit()
        
    # 3. Add last 2 months of attendance data up to yesterday (never today)
    today = datetime.date.today()
    
    # Ensure today's data is never pre-populated (must be entered by user/supervisor)
    db.query(Attendance).filter(Attendance.attendance_date >= today).delete()
    db.commit()
    
    days_to_seed = 62  # approx. 2 full months
    start_date = today - datetime.timedelta(days=days_to_seed)
    
    added_count = 0
    for i in range(days_to_seed):
        current_date = start_date + datetime.timedelta(days=i)
        
        # Skip today and future dates
        if current_date >= today:
            continue
            
        # Skip weekends (5=Saturday, 6=Sunday)
        if current_date.weekday() >= 5:
            continue
            
        for emp in employees:
            # Check if attendance already exists for this employee & date
            if db.query(Attendance).filter_by(employee_id=emp.id, attendance_date=current_date).first():
                continue
                
            # Randomly assign realistic status
            rand = random.random()
            if rand < 0.82:  # ~82% Present on time
                status = AttendanceStatus.PRESENT
                entry_min = random.choice([20, 25, 30, 35, 40, 45, 50])
                entry_time = f"08:{entry_min:02d}"
                exit_hour = random.choice([17, 18])
                exit_min = random.choice([0, 15, 30])
                exit_time = f"{exit_hour:02d}:{exit_min:02d}"
                worked_minutes = calculate_worked_minutes(entry_time, exit_time)
                late_minutes = 0
            elif rand < 0.93:  # ~11% Late
                status = AttendanceStatus.LATE
                entry_hour = 9
                entry_min = random.choice([10, 15, 20, 30, 45])
                entry_time = f"{entry_hour:02d}:{entry_min:02d}"
                exit_hour = random.choice([17, 18])
                exit_min = random.choice([15, 30, 45])
                exit_time = f"{exit_hour:02d}:{exit_min:02d}"
                worked_minutes = calculate_worked_minutes(entry_time, exit_time)
                late_minutes = calculate_late_minutes(entry_time)
            else:  # ~7% Absent
                status = AttendanceStatus.ABSENT
                entry_time = None
                exit_time = None
                worked_minutes = 0
                late_minutes = 0
                
            att = Attendance(
                employee_id=emp.id,
                attendance_date=current_date,
                entry_time=entry_time,
                exit_time=exit_time,
                worked_minutes=worked_minutes,
                late_minutes=late_minutes,
                status=status
            )
            db.add(att)
            added_count += 1
            
    db.commit()
    db.close()
    print(f"Database seeded successfully: {len(employees)} employees, {added_count} new attendance records added.")

if __name__ == "__main__":
    seed_data()

