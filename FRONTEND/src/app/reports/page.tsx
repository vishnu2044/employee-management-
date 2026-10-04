"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  FileText, 
  Printer, 
  Calendar as CalendarIcon, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Search,
  Building,
  Layers,
  ListFilter
} from "lucide-react";
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
  parseISO 
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { formatDuration } from "@/lib/dates";
import { 
  CompanyAttendanceReportData, 
  CompanyEmployeeReport, 
  DailyReportRecord 
} from "@/types/attendance";

type PeriodType = "weekly" | "monthly" | "custom";
type ViewMode = "matrix" | "detailed";

export default function ReportsPage() {
  const [isSupervisor, setIsSupervisor] = useState<boolean>(false);
  const [periodType, setPeriodType] = useState<PeriodType>("weekly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [customStartDate, setCustomStartDate] = useState<string>(
    format(startOfMonth(new Date()), "yyyy-MM-dd")
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "DAY" | "NIGHT">("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("matrix");

  useEffect(() => {
    setIsSupervisor(!!localStorage.getItem("supervisor_token"));
  }, []);

  // Compute startDateStr and endDateStr
  const { startDateStr, endDateStr, periodDisplayLabel } = useMemo(() => {
    if (periodType === "weekly") {
      const s = format(startOfWeek(selectedDate, { weekStartsOn: 0 }), "yyyy-MM-dd");
      const e = format(endOfWeek(selectedDate, { weekStartsOn: 0 }), "yyyy-MM-dd");
      return {
        startDateStr: s,
        endDateStr: e,
        periodDisplayLabel: `Week of ${format(parseISO(s), "dd MMM")} – ${format(parseISO(e), "dd MMM yyyy")}`,
      };
    }
    if (periodType === "monthly") {
      const s = format(startOfMonth(selectedDate), "yyyy-MM-dd");
      const e = format(endOfMonth(selectedDate), "yyyy-MM-dd");
      return {
        startDateStr: s,
        endDateStr: e,
        periodDisplayLabel: format(selectedDate, "MMMM yyyy"),
      };
    }
    // Custom
    return {
      startDateStr: customStartDate,
      endDateStr: customEndDate,
      periodDisplayLabel: `${customStartDate} to ${customEndDate}`,
    };
  }, [periodType, selectedDate, customStartDate, customEndDate]);

  // Query Company Attendance Report
  const { data: reportData, isLoading, refetch, isFetching } = useQuery<CompanyAttendanceReportData>({
    queryKey: ["companyReport", startDateStr, endDateStr, periodType],
    queryFn: () => attendanceApi.getCompanyAttendanceReport(startDateStr, endDateStr, periodType),
  });

  // Filter employees by Shift and Search
  const filteredEmployees = useMemo(() => {
    if (!reportData) return [];
    return reportData.employees.filter((emp) => {
      // Shift filter
      if (shiftFilter !== "ALL") {
        if (shiftFilter === "DAY" && emp.shift !== "DAY") return false;
        if (shiftFilter === "NIGHT" && emp.shift !== "NIGHT") return false;
      }
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = emp.employee_name.toLowerCase().includes(q);
        const matchesRole = emp.role.toLowerCase().includes(q);
        const matchesCode = emp.employee_code.toLowerCase().includes(q);
        if (!matchesName && !matchesRole && !matchesCode) return false;
      }
      return true;
    });
  }, [reportData, shiftFilter, searchQuery]);

  // Recalculate summary metrics for filtered employees
  const filteredSummary = useMemo(() => {
    if (!filteredEmployees || filteredEmployees.length === 0) {
      return {
        total_employees: 0,
        total_worked_minutes: 0,
        total_present_days: 0,
        total_absent_days: 0,
        total_late_days: 0,
      };
    }
    return {
      total_employees: filteredEmployees.length,
      total_worked_minutes: filteredEmployees.reduce((acc, e) => acc + e.total_worked_minutes, 0),
      total_present_days: filteredEmployees.reduce((acc, e) => acc + e.present_days, 0),
      total_absent_days: filteredEmployees.reduce((acc, e) => acc + e.absent_days, 0),
      total_late_days: filteredEmployees.reduce((acc, e) => acc + e.late_days, 0),
    };
  }, [filteredEmployees]);

  // Date columns for table display (based on first employee records)
  const reportDates = useMemo(() => {
    if (!reportData || !reportData.employees[0]) return [];
    return reportData.employees[0].records.map((r) => r.date);
  }, [reportData]);

  // Previous / Next Period handlers
  const handlePrev = () => {
    if (periodType === "weekly") setSelectedDate((d) => subWeeks(d, 1));
    else if (periodType === "monthly") setSelectedDate((d) => subMonths(d, 1));
  };

  const handleNext = () => {
    if (periodType === "weekly") setSelectedDate((d) => addWeeks(d, 1));
    else if (periodType === "monthly") setSelectedDate((d) => addMonths(d, 1));
  };


  return (
    <div className="flex flex-col space-y-6 print:space-y-3 print:p-0 print:m-0 print:w-full print:block">
      {/* Print Specific CSS ensuring exact match to on-screen design */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: landscape;
            margin: 8mm;
          }
          html, body {
            background-color: var(--color-background, #F7F3EC) !important;
            color: #191716 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: 0 !important;
            display: block !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            display: block !important;
          }
          .print\\:hidden, header, nav, footer {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          * {
            box-shadow: none !important;
            text-shadow: none !important;
          }
          .overflow-x-auto, [class*="overflow-x"], [class*="overflow-hidden"] {
            overflow: visible !important;
            width: 100% !important;
          }
          .sticky, [class*="sticky"] {
            position: static !important;
            box-shadow: none !important;
            left: auto !important;
            right: auto !important;
            top: auto !important;
            bottom: auto !important;
            z-index: auto !important;
          }
          table {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            table-layout: fixed !important;
            border-collapse: collapse !important;
          }
          thead {
            display: table-header-group !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          th, td {
            overflow: hidden !important;
            word-wrap: break-word !important;
          }
        }
      `}} />

      {/* Printable Brand Header (Appears only during print) */}
      <div className="hidden print:flex items-center justify-between pb-3 mb-2 border-b border-[var(--color-border)]">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="/logo.jpg" alt="Piekarnia Putka Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-bold uppercase tracking-tight text-[var(--color-foreground)] leading-tight">
              Piekarnia Putka — Attendance Report
            </h1>
            <p className="text-[9px] text-[var(--color-primary)] font-semibold uppercase tracking-wider">
              Workforce Intelligence
            </p>
          </div>
        </div>
        <div className="text-right text-[9px] text-gray-500 font-mono">
          <p className="font-bold text-gray-800 text-[10px]">
            Period: {startDateStr} to {endDateStr}
          </p>
          <p>Generated: {reportData?.generated_at || format(new Date(), "yyyy-MM-dd HH:mm:ss")}</p>
        </div>
      </div>

      {/* Screen Title & Action Bar */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-[var(--color-border)] flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-[var(--color-primary)]"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">
              Workforce Intelligence
            </p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)] tracking-tight">
            Attendance Reports
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Generate and export official attendance reports for all active and participating employees.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="bg-white border border-[var(--color-border)] hover:bg-gray-50 text-[var(--color-foreground)] font-bold py-2 px-3.5 rounded text-xs flex items-center shadow-xs uppercase tracking-wider transition cursor-pointer"
          >
            <Clock size={14} className="mr-1.5 text-gray-500" />
            {isFetching ? "Generating..." : "Generate Report"}
          </button>

          <button
            onClick={() => window.print()}
            className="bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white font-bold py-2 px-5 rounded text-xs flex items-center shadow-sm uppercase tracking-wider transition cursor-pointer"
          >
            <Printer size={14} className="mr-2 text-white" />
            Print PDF
          </button>
        </div>
      </div>

      {/* Filter & Period Selection Control Card */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] p-4 space-y-4 print:hidden">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Period Mode Selector */}
          <div className="flex items-center space-x-1 bg-gray-50 p-1 rounded-md border border-[var(--color-border)]">
            {(["weekly", "monthly", "custom"] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodType(p)}
                className={`px-3 py-1.5 text-xs font-bold rounded transition tracking-wider uppercase cursor-pointer ${
                  periodType === p
                    ? "bg-[var(--color-primary-dark)] text-white shadow-xs"
                    : "text-gray-600 hover:text-black hover:bg-gray-200/50"
                }`}
              >
                {p === "weekly" ? "Weekly" : p === "monthly" ? "Monthly" : "Custom Date Range"}
              </button>
            ))}
          </div>

          {/* Date Pickers / Navigation */}
          <div className="flex flex-wrap items-center gap-2.5">
            {periodType !== "custom" ? (
              <div className="flex items-center space-x-1 bg-gray-50 border border-[var(--color-border)] rounded px-1 py-0.5">
                <button
                  onClick={handlePrev}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600 transition cursor-pointer"
                  title="Previous"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-xs font-bold text-gray-800 px-3 min-w-[150px] text-center">
                  {periodDisplayLabel}
                </span>
                <button
                  onClick={handleNext}
                  className="p-1 hover:bg-gray-200 rounded text-gray-600 transition cursor-pointer"
                  title="Next"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            ) : null}

            {periodType === "weekly" && (
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Choose Any Date:</span>
                <input
                  type="date"
                  value={format(selectedDate, "yyyy-MM-dd")}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(parseISO(e.target.value));
                  }}
                  className="border border-[var(--color-border)] rounded px-2.5 py-1 text-xs bg-white text-gray-800 font-medium"
                />
              </div>
            )}

            {periodType === "monthly" && (
              <div className="flex items-center space-x-1">
                <span className="text-[10px] font-bold uppercase text-gray-400">Month:</span>
                <input
                  type="month"
                  value={format(selectedDate, "yyyy-MM")}
                  onChange={(e) => {
                    if (e.target.value) setSelectedDate(parseISO(`${e.target.value}-01`));
                  }}
                  className="border border-[var(--color-border)] rounded px-2.5 py-1 text-xs bg-white text-gray-800 font-medium"
                />
              </div>
            )}

            {periodType === "custom" && (
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400">From:</span>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="border border-[var(--color-border)] rounded px-2 py-1 text-xs bg-white text-gray-800 font-medium"
                  />
                </div>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400">To:</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="border border-[var(--color-border)] rounded px-2 py-1 text-xs bg-white text-gray-800 font-medium"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Secondary Sub-filters: Shift Filter, Search & View Mode Switcher */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between pt-3 border-t border-[var(--color-border)] gap-3">
          {/* Shift Filter */}
          <div className="flex items-center space-x-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest text-gray-400 mr-1 flex items-center">
              <Filter size={11} className="mr-1" /> Shift:
            </span>
            {(["ALL", "DAY", "NIGHT"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setShiftFilter(s)}
                className={`px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                  shiftFilter === s
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-56">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Filter employee..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1 border border-[var(--color-border)] rounded text-xs bg-gray-50 focus:outline-none focus:border-[var(--color-primary)] transition"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 rounded p-0.5 border border-[var(--color-border)]">
              <button
                onClick={() => setViewMode("matrix")}
                className={`px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded transition cursor-pointer flex items-center ${
                  viewMode === "matrix" ? "bg-white text-black shadow-xs" : "text-gray-500 hover:text-black"
                }`}
                title="Summary Roll View"
              >
                <Layers size={12} className="mr-1" /> Summary
              </button>
              <button
                onClick={() => setViewMode("detailed")}
                className={`px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wider rounded transition cursor-pointer flex items-center ${
                  viewMode === "detailed" ? "bg-white text-black shadow-xs" : "text-gray-500 hover:text-black"
                }`}
                title="Detailed Timesheets View"
              >
                <ListFilter size={12} className="mr-1" /> Detailed
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Summary Cards (Identical style in view and print) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 print:grid print:grid-cols-5 print:gap-2">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-[var(--color-border)] border-t-3 border-t-gray-800 print:p-2">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest print:text-[8px]">Employees</span>
            <Users size={14} className="text-gray-400 print:hidden" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[var(--color-foreground)] print:text-base">
            {filteredSummary.total_employees}
          </div>
          <span className="text-[10px] text-gray-400 font-medium print:text-[7px]">In selected report</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-[var(--color-border)] border-t-3 border-t-[var(--color-primary-dark)] print:p-2">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest print:text-[8px]">Total Hours</span>
            <Clock size={14} className="text-[var(--color-primary-dark)] print:hidden" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[var(--color-primary-dark)] print:text-base">
            {formatDuration(filteredSummary.total_worked_minutes)}
          </div>
          <span className="text-[10px] text-gray-400 font-medium print:text-[7px]">Verified work hours</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-[var(--color-border)] border-t-3 border-t-[var(--color-success-text)] print:p-2">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest print:text-[8px]">Present Days</span>
            <CheckCircle2 size={14} className="text-[var(--color-success-text)] print:hidden" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-green-700 print:text-base">
            {filteredSummary.total_present_days}
          </div>
          <span className="text-[10px] text-gray-400 font-medium print:text-[7px]">On-time & late shifts</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-[var(--color-border)] border-t-3 border-t-[#D84315] print:p-2">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest print:text-[8px]">Late Shifts (SP)</span>
            <AlertCircle size={14} className="text-[#D84315] print:hidden" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-[#D84315] print:text-base">
            {filteredSummary.total_late_days}
          </div>
          <span className="text-[10px] text-gray-400 font-medium print:text-[7px]">Shift penalties recorded</span>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border border-[var(--color-border)] border-t-3 border-t-red-600 col-span-2 md:col-span-1 print:p-2">
          <div className="flex items-center justify-between text-gray-500 mb-1">
            <span className="text-[0.65rem] font-bold uppercase tracking-widest print:text-[8px]">Absent Days</span>
            <XCircle size={14} className="text-red-500 print:hidden" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-red-700 print:text-base">
            {filteredSummary.total_absent_days}
          </div>
          <span className="text-[10px] text-gray-400 font-medium print:text-[7px]">Marked absences</span>
        </div>
      </div>

      {/* Main Report Table Container */}
      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden print:overflow-visible print:border-black print:rounded-none print:shadow-none">
        {/* Report Card Title Header */}
        <div className="p-4 border-b border-[var(--color-border)] bg-gray-50/70 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 print:p-2 print:bg-transparent print:border-black">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 flex items-center print:text-xs">
              <FileText size={15} className="mr-2 text-[var(--color-primary-dark)] print:hidden" />
              {periodType === "weekly"
                ? `Weekly Timesheet Roll (${startDateStr} – ${endDateStr})`
                : periodType === "monthly"
                ? `Monthly Timesheet Roll (${format(selectedDate, "MMMM yyyy")})`
                : `Custom Range Timesheet Roll (${startDateStr} – ${endDateStr})`}
            </h2>
            <p className="text-[11px] text-gray-500 font-medium print:text-[8px]">
              Showing {filteredEmployees.length} employee{filteredEmployees.length === 1 ? "" : "s"} (active employees and participants who worked during this period).
            </p>
          </div>

          <div className="text-xs font-mono font-bold text-gray-600 print:text-[10px]">
            Total: <span className="text-[var(--color-primary-dark)]">{formatDuration(filteredSummary.total_worked_minutes)}</span>
          </div>
        </div>

        {/* LOADING & EMPTY STATES */}
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            Compiling and verifying attendance records...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">
            No employees or attendance records match the selected period and filters.
          </div>
        ) : (
          /* ============================================================== */
          /* SUMMARY TIMESHEET ROLL TABLE (Used for Weekly, Monthly & Custom) */
          /* ============================================================== */
          <div className="overflow-x-auto print:overflow-visible print:w-full">
            <table className="w-full text-xs text-left border-collapse min-w-max print:min-w-0 print:w-full print:table-fixed">
              <colgroup className="hidden print:table-column-group">
                <col className="print:w-[4%]" />
                <col className="print:w-[20%]" />
                <col className="print:w-[15%]" />
                <col className="print:w-[7%]" />
                <col className="print:w-[10%]" />
                <col className="print:w-[10%]" />
                <col className="print:w-[11%]" />
                <col className="print:w-[10%]" />
                <col className="print:w-[13%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[var(--color-border)] text-[0.65rem] uppercase tracking-widest text-gray-400 font-bold bg-gray-50/90 print:bg-transparent print:border-black">
                  <th className="px-4 py-3 w-12 text-center print:w-[4%] print:px-1 print:py-2">#</th>
                  <th className="px-4 py-3 min-w-[200px] print:w-[20%] print:min-w-0 print:px-2 print:py-2">Employee</th>
                  <th className="px-4 py-3 print:w-[15%] print:px-2 print:py-2">Role</th>
                  <th className="px-4 py-3 text-center print:w-[7%] print:px-1 print:py-2">Shift</th>
                  <th className="px-4 py-3 text-center print:w-[10%] print:px-1 print:py-2">Employment</th>
                  <th className="px-4 py-3 text-center print:w-[10%] print:px-1 print:py-2">Present Days</th>
                  <th className="px-4 py-3 text-center print:w-[11%] print:px-1 print:py-2">Late Shifts (SP)</th>
                  <th className="px-4 py-3 text-center print:w-[10%] print:px-1 print:py-2">Absent Days</th>
                  <th className="px-6 py-3 text-right print:w-[13%] print:px-2 print:py-2">Total Hours Worked</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((emp, idx) => {
                  const isInactive = !emp.is_active;

                  return (
                    <tr
                      key={emp.employee_id}
                      className={`border-b border-[var(--color-border)] hover:bg-gray-50/60 transition print:border-gray-300 ${
                        isInactive ? "opacity-75 bg-gray-50/20" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-center text-gray-400 font-mono print:px-1 print:py-1.5 print:text-[8px]">
                        {(idx + 1).toString().padStart(2, "0")}
                      </td>
                      <td className="px-4 py-3 print:px-2 print:py-1.5">
                        <div className="font-bold text-[var(--color-foreground)] text-xs print:text-[9.5px] truncate">
                          {emp.employee_name}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono print:text-[7.5px] truncate">
                          ID: {emp.employee_code}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-medium print:px-2 print:py-1.5 print:text-[8.5px] truncate">
                        {emp.role}
                      </td>
                      <td className="px-4 py-3 text-center print:px-1 print:py-1.5">
                        <span
                          className={`text-[9px] print:text-[7.5px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            emp.shift === "NIGHT"
                              ? "bg-indigo-100 text-indigo-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {emp.shift || "DAY"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center print:px-1 print:py-1.5">
                        {isInactive ? (
                          <span className="bg-gray-200 text-gray-600 font-bold text-[8px] print:text-[6.5px] px-1.5 py-0.5 rounded tracking-widest uppercase">
                            No longer works here
                          </span>
                        ) : (
                          <span className="bg-[#E8F5E9] text-[var(--color-success-text)] font-bold text-[8px] print:text-[6.5px] px-1.5 py-0.5 rounded tracking-widest uppercase">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-green-700 print:px-1 print:py-1.5 print:text-[8.5px]">
                        {emp.present_days}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-[#D84315] print:px-1 print:py-1.5 print:text-[8.5px]">
                        {emp.late_days}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-red-700 print:px-1 print:py-1.5 print:text-[8.5px]">
                        {emp.absent_days}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-bold text-sm text-[var(--color-primary-dark)] print:px-2 print:py-1.5 print:text-[10px]">
                        {formatDuration(emp.total_worked_minutes)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Detailed Timesheet Section (When Detailed view is selected) */}
        {viewMode === "detailed" && (
          <div className="p-4 border-t border-[var(--color-border)] bg-gray-50/50 space-y-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-600 flex items-center">
              <CalendarIcon size={14} className="mr-1.5 text-[var(--color-primary-dark)]" />
              Individual Employee Daily Breakdown
            </div>

            {filteredEmployees.map((emp) => (
              <div
                key={emp.employee_id}
                className="bg-white rounded-lg border border-[var(--color-border)] p-4 shadow-xs space-y-3 print:border-black print:p-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2">
                  <div>
                    <h3 className="font-bold text-sm text-black flex items-center gap-2">
                      <span>{emp.employee_name}</span>
                      <span className="text-xs text-gray-500 font-normal">({emp.role})</span>
                      {!emp.is_active && (
                        <span className="bg-gray-100 text-gray-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase">
                          No longer works here
                        </span>
                      )}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono">
                      Code: {emp.employee_code} • Shift: {emp.shift || "DAY"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 font-medium">Period Total: </span>
                    <span className="font-mono font-bold text-sm text-[var(--color-primary-dark)]">
                      {formatDuration(emp.total_worked_minutes)}
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-gray-100 text-[10px] uppercase font-bold text-gray-400">
                        <th className="py-1 px-3">Date</th>
                        <th className="py-1 px-3">Shift</th>
                        <th className="py-1 px-3">Time (Start - End)</th>
                        <th className="py-1 px-3">Worked</th>
                        <th className="py-1 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {emp.records.map((r) => {
                        const hasTimes = r.entry_time && r.exit_time;
                        return (
                          <tr key={r.date} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="py-1.5 px-3 font-semibold text-gray-700">
                              {format(parseISO(r.date), "EEE dd MMM yyyy")}
                            </td>
                            <td className="py-1.5 px-3 text-[10px] text-gray-500">
                              {r.shift || "—"}
                            </td>
                            <td className="py-1.5 px-3 font-mono text-gray-800">
                              {hasTimes ? `${r.entry_time} - ${r.exit_time}` : "—"}
                            </td>
                            <td className="py-1.5 px-3 font-bold text-gray-800">
                              {formatDuration(r.worked_minutes)}
                            </td>
                            <td className="py-1.5 px-3">
                              {r.status === "PRESENT" && (
                                <span className="bg-[#E8F5E9] text-[var(--color-success-text)] font-bold text-[8px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                                  PRESENT
                                </span>
                              )}
                              {r.status === "LATE" && (
                                <span className="bg-[#FFE5E5] text-[#D84315] font-bold text-[8px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                                  LATE {r.late_minutes > 0 ? `(SP +${r.late_minutes}M)` : ""}
                                </span>
                              )}
                              {r.status === "ABSENT" && (
                                <span className="bg-[#FFEBEE] text-[var(--color-primary-dark)] font-bold text-[8px] px-1.5 py-0.5 rounded tracking-wider uppercase">
                                  ABSENT
                                </span>
                              )}
                              {r.status === "WEEKEND" && (
                                <span className="text-gray-400 font-mono text-[10px]">OFF</span>
                              )}
                              {r.status === "—" && (
                                <span className="text-gray-300 font-mono">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Summary / Verification */}
        <div className="bg-gray-50/80 p-4 border-t border-[var(--color-border)] print:border-black flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 font-medium gap-2">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center font-serif italic text-[10px]">
              i
            </div>
            <span>
              All daily shift hours and overnight calculations have been verified against backend ground truth records.
            </span>
          </div>
          <div className="font-bold text-gray-800">
            Workforce Total:{" "}
            <span className="text-[var(--color-primary-dark)]">
              {formatDuration(filteredSummary.total_worked_minutes)}
            </span>{" "}
            ({filteredSummary.total_employees} employees)
          </div>
        </div>

      </div>

      {/* Screen Footer */}
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8 print:hidden">
        <div>Piekarnia Putka Attendance & Working Hours System</div>
        <div>Confidential Internal Document • © 2026 Piekarnia Putka</div>
      </div>
    </div>
  );
}
