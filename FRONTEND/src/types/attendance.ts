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
  is_active?: boolean;
  machine?: string;
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

export interface AttendanceHistoryRecord {
  id: string;
  attendance_id: string;
  employee_id: string;
  attendance_date: string;
  old_entry_time: string | null;
  old_exit_time: string | null;
  new_entry_time: string | null;
  new_exit_time: string | null;
  action: string;
  reason: string | null;
  changed_by: string | null;
  created_at: string;
}

export interface ReportAttendanceRecord {
  attendance_date: string;
  entry_time: string | null;
  exit_time: string | null;
  worked_minutes: number;
  late_minutes?: number;
  status: string;
}

export interface EmployeeReportData {
  employee_id: string;
  employee_name: string;
  start_date: string;
  end_date: string;
  records: ReportAttendanceRecord[];
  total_worked_minutes: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  average_daily_minutes: number;
}

export interface DailyReportRecord {
  date: string;
  entry_time: string | null;
  exit_time: string | null;
  shift: string | null;
  worked_minutes: number;
  late_minutes: number;
  status: string;
}

export interface CompanyEmployeeReport {
  employee_number: number;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  role: string;
  is_active: boolean;
  shift: string | null;
  total_worked_minutes: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  records: DailyReportRecord[];
}

export interface CompanyReportSummary {
  total_employees: number;
  total_worked_minutes: number;
  total_present_days: number;
  total_absent_days: number;
  total_late_days: number;
}

export interface CompanyAttendanceReportData {
  company_name: string;
  application_name: string;
  report_title: string;
  period_type: string;
  start_date: string;
  end_date: string;
  generated_at: string;
  summary: CompanyReportSummary;
  employees: CompanyEmployeeReport[];
}
