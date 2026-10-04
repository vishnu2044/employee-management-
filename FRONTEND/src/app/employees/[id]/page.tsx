"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, 
  Calendar as CalendarIcon, 
  Clock, 
  Pencil, 
  Printer, 
  FileText, 
  History, 
  Filter, 
  ChevronRight,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import Link from "next/link";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  subWeeks, 
  addWeeks, 
  subMonths, 
  addMonths,
  subDays,
  addDays,
  eachDayOfInterval, 
  parseISO,
  isToday as checkIsToday
} from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { formatDuration } from "@/lib/dates";
import { use } from "react";
import EditEmployeeModal from "@/components/employees/EditEmployeeModal";
import { AttendanceHistoryRecord, ReportAttendanceRecord } from "@/types/attendance";

type PeriodMode = "day" | "week" | "month" | "custom";
type ActiveTab = "report" | "history";

export default function EmployeeDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ActiveTab>("report");
  const [periodMode, setPeriodMode] = useState<PeriodMode>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [historyActionFilter, setHistoryActionFilter] = useState<string>("ALL");
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    setIsSupervisor(!!localStorage.getItem("supervisor_token"));
  }, []);

  // Compute start_date and end_date strings based on periodMode
  const { startDateStr, endDateStr, periodLabel } = useMemo(() => {
    if (periodMode === "day") {
      const d = format(selectedDate, "yyyy-MM-dd");
      return {
        startDateStr: d,
        endDateStr: d,
        periodLabel: format(selectedDate, "EEEE, dd MMMM yyyy"),
      };
    }
    if (periodMode === "week") {
      const start = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
      const end = endOfWeek(selectedDate, { weekStartsOn: 0 });
      const s = format(start, "yyyy-MM-dd");
      const e = format(end, "yyyy-MM-dd");
      return {
        startDateStr: s,
        endDateStr: e,
        periodLabel: `${s} — ${e}`,
      };
    }
    if (periodMode === "month") {
      const start = startOfMonth(selectedDate);
      const end = endOfMonth(selectedDate);
      const s = format(start, "yyyy-MM-dd");
      const e = format(end, "yyyy-MM-dd");
      return {
        startDateStr: s,
        endDateStr: e,
        periodLabel: format(selectedDate, "MMMM yyyy"),
      };
    }
    // Custom
    return {
      startDateStr: customStartDate || format(new Date(), "yyyy-MM-dd"),
      endDateStr: customEndDate || format(new Date(), "yyyy-MM-dd"),
      periodLabel: `${customStartDate} — ${customEndDate}`,
    };
  }, [periodMode, selectedDate, customStartDate, customEndDate]);

  // Fetch Employee Metadata
  const { data: employeeDataApi, isLoading: isLoadingEmp } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => attendanceApi.getEmployee(employeeId),
  });

  // Fetch Analytics (Today's hours, Month total)
  const { data: analyticsData } = useQuery({
    queryKey: ["employee", employeeId, "analytics"],
    queryFn: () => attendanceApi.getEmployeeAnalytics(employeeId),
  });

  // Fetch Attendance Report for selected date range (works for both active and removed employees)
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ["attendanceReport", employeeId, startDateStr, endDateStr],
    queryFn: () => attendanceApi.getAttendanceReport(employeeId, startDateStr, endDateStr),
  });

  // Fetch Activity History
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["employeeHistory", employeeId, historyActionFilter],
    queryFn: () => attendanceApi.getEmployeeHistory(employeeId, historyActionFilter),
  });

  const displayName = employeeDataApi?.full_name || "Employee";
  const displayRole = employeeDataApi?.role || "Team Member";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const isActive = employeeDataApi?.is_active ?? true;

  // Process rows for Attendance Report
  const processedRows = useMemo(() => {
    if (!reportData) return [];

    const recordMap = new Map<string, ReportAttendanceRecord>();
    (reportData.records || []).forEach((r: ReportAttendanceRecord) => {
      recordMap.set(r.attendance_date, r);
    });

    let daysToDisplay: {
      date: string;
      entry_time: string | null;
      exit_time: string | null;
      worked_minutes: number;
      late_minutes: number;
      status: string;
    }[] = [];

    try {
      const start = parseISO(startDateStr);
      const end = parseISO(endDateStr);
      const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      // If range is reasonable (up to 31 days), generate every day in sequence
      if (diffDays >= 0 && diffDays <= 31) {
        const allDays = eachDayOfInterval({ start, end });
        daysToDisplay = allDays.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const existing = recordMap.get(dateStr);
          if (existing) {
            return {
              date: dateStr,
              entry_time: existing.entry_time,
              exit_time: existing.exit_time,
              worked_minutes: existing.worked_minutes,
              late_minutes: existing.late_minutes || 0,
              status: existing.status,
            };
          }
          const dayOfWeek = d.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          return {
            date: dateStr,
            entry_time: null,
            exit_time: null,
            worked_minutes: 0,
            late_minutes: 0,
            status: isWeekend ? "WEEKEND" : "—",
          };
        });
      } else {
        // Large custom range: display recorded rows
        daysToDisplay = (reportData.records || []).map((r: ReportAttendanceRecord) => ({
          date: r.attendance_date,
          entry_time: r.entry_time,
          exit_time: r.exit_time,
          worked_minutes: r.worked_minutes,
          late_minutes: r.late_minutes || 0,
          status: r.status,
        }));
      }
    } catch (e) {
      daysToDisplay = (reportData.records || []).map((r: ReportAttendanceRecord) => ({
        date: r.attendance_date,
        entry_time: r.entry_time,
        exit_time: r.exit_time,
        worked_minutes: r.worked_minutes,
        late_minutes: r.late_minutes || 0,
        status: r.status,
      }));
    }

    // Apply status filter
    if (statusFilter !== "ALL") {
      return daysToDisplay.filter((r) => r.status === statusFilter);
    }
    return daysToDisplay;
  }, [reportData, startDateStr, endDateStr, statusFilter]);

  // Compute period total minutes from processed rows
  const periodTotalMinutes = useMemo(() => {
    return processedRows.reduce((acc, row) => acc + (row.worked_minutes || 0), 0);
  }, [processedRows]);

  const handleUpdateEmployee = async (formData: { full_name: string; role: string }) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("supervisor_token")}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
        setIsEditModalOpen(false);
      } else {
        alert("Failed to update employee details.");
      }
    } catch (e) {
      alert("Error updating employee details.");
    }
  };

  const handlePrevPeriod = () => {
    if (periodMode === "day") setSelectedDate((d) => subDays(d, 1));
    else if (periodMode === "week") setSelectedDate((d) => subWeeks(d, 1));
    else if (periodMode === "month") setSelectedDate((d) => subMonths(d, 1));
  };

  const handleNextPeriod = () => {
    if (periodMode === "day") setSelectedDate((d) => addDays(d, 1));
    else if (periodMode === "week") setSelectedDate((d) => addWeeks(d, 1));
    else if (periodMode === "month") setSelectedDate((d) => addMonths(d, 1));
  };

  if (isLoadingEmp) {
    return <div className="p-12 text-center text-gray-500 font-bold uppercase tracking-widest">Loading employee data...</div>;
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Top Navigation */}
      <div className="print:hidden">
        <Link 
          href="/employees" 
          className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-4"
        >
          <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
        </Link>
      </div>

      {/* Printable Document Header (Only shown during print) */}
      <div className="hidden print:block border-b-2 border-black pb-4 mb-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black tracking-tight uppercase text-black">
              Employee Attendance Report
            </h1>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
              Piekarnia Putka Attendance & Working Hours System
            </p>
          </div>
          <div className="text-right text-xs text-gray-500">
            <p>Generated: {format(new Date(), "yyyy-MM-dd HH:mm")}</p>
            <p className="font-mono">{employeeId}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4 mt-4 pt-3 border-t border-gray-200 text-xs">
          <div>
            <span className="text-gray-400 block uppercase font-bold text-[9px]">Employee Name</span>
            <span className="font-bold text-black text-sm">{displayName}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-bold text-[9px]">Role</span>
            <span className="font-semibold text-black">{displayRole}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-bold text-[9px]">Status</span>
            <span className="font-bold text-black">{isActive ? "Active Employee" : "No Longer Works Here"}</span>
          </div>
          <div>
            <span className="text-gray-400 block uppercase font-bold text-[9px]">Report Period</span>
            <span className="font-bold text-black">{startDateStr} to {endDateStr}</span>
          </div>
        </div>
      </div>

      {/* Screen Header Card */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--color-border)] print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-600 border border-[var(--color-border)] shadow-xs">
              {initials}
            </div>
            <div>
              <div className="flex items-center flex-wrap gap-2 mb-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)] tracking-tight">
                  {displayName}
                </h1>
                {!isActive && (
                  <span className="bg-[#FFEBEE] text-[var(--color-primary-dark)] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase">
                    No longer works here
                  </span>
                )}
                {isSupervisor && (
                  <button 
                    onClick={() => setIsEditModalOpen(true)} 
                    className="text-gray-400 hover:text-[var(--color-primary-dark)] transition p-1"
                    title="Edit employee details"
                  >
                    <Pencil size={16} />
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium">
                {displayRole} • <span className="font-mono text-gray-400">{employeeId.split("-")[0]}</span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => window.print()} 
            className="bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white font-bold py-2.5 px-6 rounded text-xs flex items-center shadow-sm uppercase tracking-wider transition shrink-0 cursor-pointer"
          >
            <Printer size={15} className="mr-2" />
            Print PDF Report
          </button>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
        {/* Today's Hours */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-[var(--color-border)] border-t-4 border-t-[var(--color-primary-dark)]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Today's Hours</h3>
            <Clock size={16} className="text-[var(--color-primary-dark)]" />
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1">
            {analyticsData?.today_minutes ? formatDuration(analyticsData.today_minutes) : "—"}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Started shift at <span className="font-bold text-gray-800">{analyticsData?.today_entry || "—"}</span>
          </div>
        </div>
        
        {/* Period Hours */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-[var(--color-border)] border-t-4 border-t-gray-400">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">
              {periodMode === "week" ? "Selected Week" : periodMode === "month" ? "Selected Month" : "Selected Period"}
            </h3>
            <CalendarIcon size={16} className="text-gray-400" />
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1">
            {formatDuration(periodTotalMinutes)}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Standard Target: 40h 00m
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white p-5 rounded-lg shadow-sm border border-[var(--color-border)] border-t-4 border-t-[var(--color-success-text)]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Current Month</h3>
            <CalendarIcon size={16} className="text-[var(--color-success-text)]" />
          </div>
          <div className="text-3xl font-bold tracking-tight mb-1">
            {analyticsData?.monthly_minutes ? formatDuration(analyticsData.monthly_minutes) : "—"}
          </div>
          <div className="text-xs text-gray-500 font-medium">
            Total recorded: {analyticsData?.days_worked || 0} days worked
          </div>
        </div>
      </div>

      {/* Main Content Tabs (Report vs History) */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 sm:px-6 pt-3 bg-gray-50/50 print:hidden">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab("report")}
              className={`pb-3 text-xs font-bold uppercase tracking-widest flex items-center transition border-b-2 cursor-pointer ${
                activeTab === "report"
                  ? "text-[var(--color-primary-dark)] border-[var(--color-primary-dark)]"
                  : "text-gray-400 border-transparent hover:text-black"
              }`}
            >
              <FileText size={14} className="mr-1.5" />
              Attendance Report & Timesheet
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 text-xs font-bold uppercase tracking-widest flex items-center transition border-b-2 cursor-pointer ${
                activeTab === "history"
                  ? "text-[var(--color-primary-dark)] border-[var(--color-primary-dark)]"
                  : "text-gray-400 border-transparent hover:text-black"
              }`}
            >
              <History size={14} className="mr-1.5" />
              Activity History
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* TAB 1: ATTENDANCE REPORT & TIMESHEET                          */}
        {/* ============================================================== */}
        {activeTab === "report" && (
          <div>
            {/* Filter Bar */}
            <div className="p-4 border-b border-[var(--color-border)] bg-white flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 print:hidden">
              {/* Period Mode Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400 mr-1 flex items-center">
                  <Filter size={12} className="mr-1" /> Period:
                </span>
                {(["day", "week", "month", "custom"] as PeriodMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPeriodMode(mode)}
                    className={`px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                      periodMode === mode
                        ? "bg-gray-800 text-white shadow-xs"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {mode === "day" ? "Daily" : mode === "week" ? "Weekly" : mode === "month" ? "Monthly" : "Custom Date"}
                  </button>
                ))}
              </div>

              {/* Date Navigation & Pickers */}
              <div className="flex flex-wrap items-center gap-3">
                {periodMode !== "custom" && (
                  <div className="flex items-center space-x-1 bg-gray-50 border border-[var(--color-border)] rounded p-1">
                    <button
                      onClick={handlePrevPeriod}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600 transition cursor-pointer"
                      title="Previous"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-gray-800 px-2 min-w-[120px] text-center">
                      {periodLabel}
                    </span>
                    <button
                      onClick={handleNextPeriod}
                      className="p-1 hover:bg-gray-200 rounded text-gray-600 transition cursor-pointer"
                      title="Next"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {periodMode === "day" && (
                  <input
                    type="date"
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(parseISO(e.target.value));
                    }}
                    className="border border-[var(--color-border)] rounded px-2.5 py-1 text-xs bg-white text-gray-800 font-medium"
                  />
                )}

                {periodMode === "week" && (
                  <input
                    type="date"
                    value={format(selectedDate, "yyyy-MM-dd")}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(parseISO(e.target.value));
                    }}
                    className="border border-[var(--color-border)] rounded px-2.5 py-1 text-xs bg-white text-gray-800 font-medium"
                    title="Select any date to view its week"
                  />
                )}

                {periodMode === "month" && (
                  <input
                    type="month"
                    value={format(selectedDate, "yyyy-MM")}
                    onChange={(e) => {
                      if (e.target.value) setSelectedDate(parseISO(`${e.target.value}-01`));
                    }}
                    className="border border-[var(--color-border)] rounded px-2.5 py-1 text-xs bg-white text-gray-800 font-medium"
                  />
                )}

                {periodMode === "custom" && (
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">From:</span>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="border border-[var(--color-border)] rounded px-2 py-1 text-xs bg-white text-gray-800"
                      />
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] font-bold text-gray-400 uppercase">To:</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="border border-[var(--color-border)] rounded px-2 py-1 text-xs bg-white text-gray-800"
                      />
                    </div>
                  </div>
                )}

                {/* Status Filter */}
                <div className="flex items-center space-x-1 bg-gray-50 border border-[var(--color-border)] rounded p-0.5">
                  {["ALL", "PRESENT", "LATE", "ABSENT"].map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2 py-1 text-[0.6rem] font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                        statusFilter === st
                          ? "bg-gray-800 text-white"
                          : "text-gray-500 hover:text-black"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Print Only Period Summary Header */}
            <div className="hidden print:flex justify-between items-center bg-gray-50 p-3 border-b border-black text-xs font-bold">
              <div>REPORT PERIOD: {startDateStr} TO {endDateStr} ({periodMode.toUpperCase()})</div>
              <div>FILTER: {statusFilter}</div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-[var(--color-border)] print:border-black text-[0.65rem] uppercase tracking-widest text-gray-400 print:text-black font-bold">
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Time (Start - End)</th>
                    <th className="px-6 py-3">Worked</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingReport ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-bold uppercase tracking-widest">
                        Loading attendance report...
                      </td>
                    </tr>
                  ) : processedRows.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500 font-bold uppercase tracking-widest">
                        No attendance records found for this period
                      </td>
                    </tr>
                  ) : (
                    processedRows.map((row, idx) => {
                      const isRowToday = row.date === format(new Date(), "yyyy-MM-dd");
                      const hasTimes = row.entry_time && row.exit_time;
                      const isLate = row.status === "LATE";
                      
                      // Combined Time (Start - End) string
                      let timeField = "—";
                      if (hasTimes) {
                        timeField = `${row.entry_time} - ${row.exit_time}`;
                      } else if (row.entry_time) {
                        timeField = `${row.entry_time} - ...`;
                      }

                      return (
                        <tr
                          key={idx}
                          className={`border-b border-[var(--color-border)] print:border-gray-300 transition-colors ${
                            isRowToday ? "bg-[#FCF5F5] print:bg-transparent" : "hover:bg-gray-50/40"
                          }`}
                        >
                          <td className={`px-6 py-3.5 font-bold ${isRowToday ? "text-[var(--color-primary-dark)]" : "text-gray-800"}`}>
                            <div className="flex items-center">
                              {isRowToday && (
                                <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-dark)] mr-2 print:hidden"></div>
                              )}
                              <span>
                                {row.date ? format(parseISO(row.date), "EEE dd MMM yyyy") : "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 font-mono font-bold text-gray-700">
                            {timeField}
                          </td>
                          <td className={`px-6 py-3.5 font-bold ${isRowToday ? "text-[var(--color-primary-dark)]" : "text-gray-800"}`}>
                            {formatDuration(row.worked_minutes)}
                          </td>
                          <td className="px-6 py-3.5">
                            {row.status === "PRESENT" && (
                              <span className="bg-[#E8F5E9] text-[var(--color-success-text)] font-bold text-[0.65rem] px-2 py-0.5 rounded tracking-widest uppercase">
                                PRESENT
                              </span>
                            )}
                            {row.status === "LATE" && (
                              <span className="bg-[#FFE5E5] text-[#D84315] font-bold text-[0.65rem] px-2 py-0.5 rounded tracking-widest uppercase inline-flex items-center gap-1">
                                LATE {row.late_minutes > 0 ? `(SP +${row.late_minutes}M)` : ""}
                              </span>
                            )}
                            {row.status === "ABSENT" && (
                              <span className="bg-[#FFEBEE] text-[var(--color-primary-dark)] font-bold text-[0.65rem] px-2 py-0.5 rounded tracking-widest uppercase">
                                ABSENT
                              </span>
                            )}
                            {row.status === "WEEKEND" && (
                              <span className="bg-gray-100 text-gray-500 font-bold text-[0.65rem] px-2 py-0.5 rounded tracking-widest uppercase">
                                WEEKEND
                              </span>
                            )}
                            {row.status === "—" && <span className="text-gray-400 font-mono">—</span>}
                            {!["PRESENT", "LATE", "ABSENT", "WEEKEND", "—"].includes(row.status) && (
                              <span className="text-gray-500 font-semibold text-xs">{row.status}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="bg-gray-50/80 p-4 border-t border-[var(--color-border)] print:border-black flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 font-medium gap-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center font-serif italic text-[10px]">
                  i
                </div>
                <span>Logged entries include verified working hours and shifts within selected range.</span>
              </div>
              <div className="font-bold text-gray-800">
                Period Total: <span className="text-[var(--color-primary-dark)]">{formatDuration(periodTotalMinutes)}</span> logged
              </div>
            </div>

            {/* Print Signatures Block (Only appears on printed PDF) */}
            <div className="hidden print:flex justify-between items-end mt-12 pt-8 border-t border-gray-300 text-xs">
              <div className="w-64">
                <div className="border-b border-black mb-1 pb-4"></div>
                <p className="font-bold uppercase tracking-wider text-black">Supervisor Signature</p>
                <p className="text-[10px] text-gray-500">Date: ________________________</p>
              </div>
              <div className="w-64">
                <div className="border-b border-black mb-1 pb-4"></div>
                <p className="font-bold uppercase tracking-wider text-black">Employee Signature</p>
                <p className="text-[10px] text-gray-500">Date: ________________________</p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: ACTIVITY & AUDIT HISTORY                                */}
        {/* ============================================================== */}
        {activeTab === "history" && (
          <div>
            {/* History Filter Bar */}
            <div className="p-4 border-b border-[var(--color-border)] bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden">
              <div className="flex items-center space-x-2">
                <History size={15} className="text-gray-400" />
                <span className="text-xs font-bold uppercase tracking-widest text-gray-700">
                  Filter Activity Type:
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "ALL", label: "All Activities" },
                  { key: "CREATED", label: "Created" },
                  { key: "SUPERVISOR_EDITED", label: "Supervisor Edited" },
                  { key: "MARKED_ABSENT", label: "Marked Absent" },
                  { key: "ABSENCE_REMOVED", label: "Absence Removed" },
                ].map((act) => (
                  <button
                    key={act.key}
                    onClick={() => setHistoryActionFilter(act.key)}
                    className={`px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                      historyActionFilter === act.key
                        ? "bg-gray-800 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {act.label}
                  </button>
                ))}
              </div>
            </div>

            {/* History Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-gray-50/90 border-b border-[var(--color-border)] text-[0.65rem] uppercase tracking-widest text-gray-400 font-bold">
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3">Activity</th>
                    <th className="px-6 py-3">Attendance Date</th>
                    <th className="px-6 py-3">Details / Changes</th>
                    <th className="px-6 py-3">Changed By</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingHistory ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-bold uppercase tracking-widest">
                        Loading activity history...
                      </td>
                    </tr>
                  ) : !historyData || historyData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-bold uppercase tracking-widest">
                        No activity records found
                      </td>
                    </tr>
                  ) : (
                    historyData.map((item: AttendanceHistoryRecord) => {
                      let actionBadgeClass = "bg-gray-100 text-gray-700";
                      let actionName = item.action;
                      if (item.action === "SUPERVISOR_EDITED") {
                        actionBadgeClass = "bg-amber-100 text-amber-800";
                        actionName = "Supervisor Edited";
                      } else if (item.action === "CREATED") {
                        actionBadgeClass = "bg-green-100 text-green-800";
                        actionName = "Shift Created";
                      } else if (item.action === "MARKED_ABSENT") {
                        actionBadgeClass = "bg-red-100 text-red-800";
                        actionName = "Marked Absent";
                      } else if (item.action === "ABSENCE_REMOVED") {
                        actionBadgeClass = "bg-blue-100 text-blue-800";
                        actionName = "Absence Cleared";
                      }

                      return (
                        <tr key={item.id} className="border-b border-[var(--color-border)] hover:bg-gray-50/50 transition">
                          <td className="px-6 py-3.5 text-xs text-gray-500 font-mono">
                            {item.created_at ? format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss") : "—"}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className={`text-[0.65rem] font-bold px-2 py-0.5 rounded tracking-wider uppercase ${actionBadgeClass}`}>
                              {actionName}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-bold text-gray-800">
                            {item.attendance_date ? format(parseISO(item.attendance_date), "EEE, dd MMM yyyy") : "—"}
                          </td>
                          <td className="px-6 py-3.5 text-xs">
                            {item.action === "SUPERVISOR_EDITED" && (
                              <div className="flex flex-col space-y-0.5">
                                <span className="text-gray-500">
                                  Time: <span className="font-mono text-red-600 line-through mr-1">{item.old_entry_time || "—"} - {item.old_exit_time || "—"}</span>
                                  ➔ <span className="font-mono font-bold text-green-700">{item.new_entry_time || "—"} - {item.new_exit_time || "—"}</span>
                                </span>
                                {item.reason && <span className="text-gray-400 italic">"{item.reason}"</span>}
                              </div>
                            )}
                            {item.action === "CREATED" && (
                              <span className="font-mono text-gray-700">
                                Initial entry: {item.new_entry_time || "—"} - {item.new_exit_time || "—"}
                              </span>
                            )}
                            {item.action === "MARKED_ABSENT" && (
                              <span className="text-red-700 font-medium">
                                Marked as absent {item.reason ? `("${item.reason}")` : ""}
                              </span>
                            )}
                            {item.action === "ABSENCE_REMOVED" && (
                              <span className="text-blue-700 font-medium">
                                Absence cleared {item.reason ? `("${item.reason}")` : ""}
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-xs font-semibold text-gray-600">
                            {item.changed_by || "System"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8 print:hidden">
        <div>Attendance & Working Hours System</div>
        <div>© 2026 Piekarnia Putka. All rights reserved.</div>
      </div>

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employeeData={{ id: employeeId, full_name: displayName, role: displayRole }}
        onSave={handleUpdateEmployee}
      />
    </div>
  );
}
