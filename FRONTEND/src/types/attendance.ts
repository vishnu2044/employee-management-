export type AttendanceStatus = "PRESENT" | "LATE" | "ABSENT" | "INCOMPLETE" | "UPCOMING" | "SCHEDULED" | "WEEKEND";

export interface AttendanceRecord {
  id?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  entry_time: string | null;
  exit_time: string | null;
  worked_minutes: number;
  late_minutes: number;
}

export interface EmployeeWeeklyAttendance {
  id: string;
  name: string;
  role: string;
  weekly_total_minutes: number;
  days_worked: number;
  days: AttendanceRecord[];
}

export interface WeeklyAttendanceResponse {
  week_start: string;
  week_end: string;
  today: string;
  today_present: number;
  today_late: number;
  today_absent: number;
  employees: EmployeeWeeklyAttendance[];
}
