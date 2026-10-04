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
    
    # 2. Add Employees
    employees_data = [
        {"full_name": "John Mathew", "role": "Software Engineer"},
        {"full_name": "Sarah Connor", "role": "Project Manager"},
        {"full_name": "Michael Scott", "role": "Regional Manager"},
        {"full_name": "Jim Halpert", "role": "Sales Representative"},
        {"full_name": "Pam Beesly", "role": "Receptionist"}
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
        
    if not employees:
        employees = db.query(Employee).all()
        
    # Delete old fake users from the screenshot (e.g. software engineer, developer)
    db.query(Employee).filter(Employee.full_name.in_(["software engineer", "developer"])).delete()
    db.commit()
        
    # 3. Add last month data
    today = datetime.date.today()
    start_date = today - datetime.timedelta(days=35)
    
    for i in range(35):
        current_date = start_date + datetime.timedelta(days=i)
        
        # Skip weekends (0=Mon, 6=Sun)
        if current_date.weekday() >= 5:
            continue
            
        for emp in employees:
            # Check if attendance already exists
            if db.query(Attendance).filter_by(employee_id=emp.id, attendance_date=current_date).first():
                continue
                
            # Randomly assign status
            rand = random.random()
            if rand < 0.8: # 80% Present on time
                status = AttendanceStatus.PRESENT
                entry_time = "08:30"
                exit_time = "17:30"
                worked_minutes = 9 * 60
                late_minutes = 0
            elif rand < 0.9: # 10% Late
                status = AttendanceStatus.LATE
                entry_time = "09:15"
                exit_time = "17:30"
                worked_minutes = 8 * 60 + 15
                late_minutes = 45
            elif rand < 0.95: # 5% Absent
                status = AttendanceStatus.ABSENT
                entry_time = None
                exit_time = None
                worked_minutes = 0
                late_minutes = 0
            else: # 5% Sick leave (mark as absent for now)
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
            
    db.commit()
    db.close()
    print("Database seeded successfully with demo data.")

if __name__ == "__main__":
    seed_data()
