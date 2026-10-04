import uuid
import enum
from sqlalchemy import Column, String, Integer, DateTime, Date, ForeignKey, UniqueConstraint, Uuid
from datetime import datetime, timezone
from app.core.database import Base

class AttendanceStatus(str, enum.Enum):
    PRESENT = "PRESENT"
    LATE = "LATE"
    ABSENT = "ABSENT"
    INCOMPLETE = "INCOMPLETE"

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    employee_id = Column(Uuid(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    attendance_date = Column(Date, nullable=False, index=True)
    entry_time = Column(String, nullable=True)  # Stored in HH:MM format
    exit_time = Column(String, nullable=True)   # Stored in HH:MM format
    status = Column(String, nullable=False)     # AttendanceStatus
    worked_minutes = Column(Integer, default=0)
    late_minutes = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    created_by = Column(String, nullable=True)
    updated_by = Column(String, nullable=True)

    __table_args__ = (
        UniqueConstraint("employee_id", "attendance_date", name="uix_employee_attendance_date"),
    )
