import uuid
from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Uuid
from datetime import datetime, timezone
from app.core.database import Base

class AttendanceHistory(Base):
    __tablename__ = "attendance_history"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    attendance_id = Column(Uuid(as_uuid=True), ForeignKey("attendance.id"), nullable=False)
    employee_id = Column(Uuid(as_uuid=True), ForeignKey("employees.id"), nullable=False)
    attendance_date = Column(Date, nullable=False)
    old_entry_time = Column(String, nullable=True)
    old_exit_time = Column(String, nullable=True)
    new_entry_time = Column(String, nullable=True)
    new_exit_time = Column(String, nullable=True)
    action = Column(String, nullable=False) # CREATED, SUPERVISOR_EDITED, MARKED_ABSENT, ABSENCE_REMOVED
    reason = Column(String, nullable=True)
    changed_by = Column(String, nullable=True) # Supervisor ID or username
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
