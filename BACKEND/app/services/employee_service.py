from sqlalchemy.orm import Session
from uuid import UUID
from typing import List, Optional
from app.models.employee import Employee
from app.schemas.employee import EmployeeCreate, EmployeeUpdate
from app.core.exceptions import EntityNotFoundError

def get_employee(db: Session, employee_id: UUID) -> Employee:
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise EntityNotFoundError("Employee not found")
    return employee

def get_employees(db: Session, include_inactive: bool = False) -> List[Employee]:
    query = db.query(Employee)
    if not include_inactive:
        query = query.filter(Employee.is_active == True)
    return query.all()

def create_employee(db: Session, employee_in: EmployeeCreate) -> Employee:
    employee = Employee(**employee_in.model_dump())
    db.add(employee)
    db.commit()
    db.refresh(employee)
    return employee

def update_employee(db: Session, employee_id: UUID, employee_in: EmployeeUpdate) -> Employee:
    employee = get_employee(db, employee_id)
    update_data = employee_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(employee, field, value)
    db.commit()
    db.refresh(employee)
    return employee

def deactivate_employee(db: Session, employee_id: UUID) -> Employee:
    employee = get_employee(db, employee_id)
    employee.is_active = False
    db.commit()
    db.refresh(employee)
    return employee
