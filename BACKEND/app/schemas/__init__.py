from app.schemas.employee import EmployeeCreate, EmployeeUpdate, EmployeeOut
from app.schemas.attendance import (
    AttendanceCreate, AttendanceUpdate, AttendanceAbsent, AttendanceOut,
    DayAttendance, WeeklyEmployeeAttendance, WeeklyAttendanceOut
)
from app.schemas.supervisor import SupervisorLogin, Token, TokenData
from app.schemas.report import EmployeeSummaryOut, ReportAttendanceRecord, EmployeeReportOut
