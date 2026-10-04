"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WeeklyAttendanceResponse, EmployeeWeeklyAttendance } from "@/types/attendance";
import { attendanceApi } from "@/lib/api";
import { format } from "date-fns";
import DayHeader from "./DayHeader";
import AttendanceCell from "./AttendanceCell";
import AttendanceModal from "./AttendanceModal";
import { Users, Search, Sun, Moon, Cpu, Filter, X, Check } from "lucide-react";

interface AttendanceTableProps {
  data: WeeklyAttendanceResponse;
}

export default function AttendanceTable({ data }: AttendanceTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{
    id: string;
    name: string;
    entry?: string;
    exit?: string;
    late_minutes?: number;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [shiftFilter, setShiftFilter] = useState<"ALL" | "DAY" | "NIGHT">("ALL");
  const [machineFilter, setMachineFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsSupervisor(!!localStorage.getItem("supervisor_token"));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (scrollContainerRef.current) {
        const todayHeader = document.getElementById("today-column");
        if (todayHeader) {
          const container = scrollContainerRef.current;
          const scrollLeft =
            todayHeader.offsetLeft - container.offsetWidth + todayHeader.offsetWidth + 140;
          container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
        }
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [data.today]);

  // Week structure from first employee
  const weekDays = data.employees[0]?.days || [];

  // Helper to determine employee shift
  const getEmployeeShift = (emp: EmployeeWeeklyAttendance): "DAY" | "NIGHT" => {
    for (const d of emp.days) {
      if (d.entry_time) {
        const [h] = d.entry_time.split(":").map(Number);
        if (h >= 16 || (d.exit_time && d.exit_time < d.entry_time)) {
          return "NIGHT";
        }
      }
    }
    return "DAY";
  };

  // Helper to get employee today status
  const getTodayStatus = (emp: EmployeeWeeklyAttendance): "PRESENT" | "LATE" | "ABSENT" | "PENDING" => {
    const todayRec = emp.days.find((d) => d.date === data.today);
    if (!todayRec) return "PENDING";
    if (todayRec.status === "LATE" || (todayRec.late_minutes && todayRec.late_minutes > 0)) return "LATE";
    if (todayRec.status === "PRESENT") return "PRESENT";
    if (todayRec.status === "ABSENT") return "ABSENT";
    return "PENDING";
  };

  // Pre-calculate shift counts
  const { dayCount, nightCount } = useMemo(() => {
    let day = 0;
    let night = 0;
    data.employees.forEach((emp) => {
      if (getEmployeeShift(emp) === "NIGHT") night++;
      else day++;
    });
    return { dayCount: day, nightCount: night };
  }, [data.employees]);

  // Filtered employees list
  const filteredEmployees = useMemo(() => {
    return data.employees.filter((emp, idx) => {
      // Name Search
      if (appliedSearch.trim()) {
        const query = appliedSearch.toLowerCase().trim();
        if (!emp.name.toLowerCase().includes(query)) return false;
      }

      // Shift Filter
      if (shiftFilter !== "ALL") {
        const shift = getEmployeeShift(emp);
        if (shift !== shiftFilter) return false;
      }

      // Machine Filter
      const assignedMachine = emp.machine || `Machine ${(idx % 4) + 1}`;
      if (machineFilter !== "ALL" && assignedMachine !== machineFilter) {
        return false;
      }

      // Status Filter
      if (statusFilter !== "ALL") {
        const status = getTodayStatus(emp);
        if (status !== statusFilter) return false;
      }

      return true;
    });
  }, [data.employees, appliedSearch, shiftFilter, machineFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAppliedSearch(searchQuery);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setAppliedSearch("");
    setShiftFilter("ALL");
    setMachineFilter("ALL");
    setStatusFilter("ALL");
  };

  const hasActiveFilters =
    appliedSearch !== "" || shiftFilter !== "ALL" || machineFilter !== "ALL" || statusFilter !== "ALL";

  const handleAddAttendance = (
    employeeId: string,
    employeeName: string,
    dateStr: string,
    entry?: string,
    exit?: string,
    lateMinutes?: number
  ) => {
    const isExistingRecord = Boolean(entry || exit);
    const isDifferentDate = dateStr !== data.today;
    if ((isExistingRecord || isDifferentDate) && !isSupervisor) {
      return;
    }

    setSelectedEmployee({
      id: employeeId,
      name: employeeName,
      entry,
      exit,
      late_minutes: lateMinutes,
    });
    setSelectedDate(new Date(dateStr));
    setModalOpen(true);
  };

  const handleSaveAttendance = async (formData: any) => {
    if (!selectedEmployee || !selectedDate) return;

    try {
      await attendanceApi.createAttendance({
        employee_id: selectedEmployee.id,
        attendance_date: format(selectedDate, "yyyy-MM-dd"),
        entry_time: formData.entry,
        exit_time: formData.exit,
        late_minutes: formData.late_minutes,
      });

      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert("Failed to save attendance.");
    }
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden">
      {/* Top Filter and Controls Bar */}
      <div className="p-3 sm:p-4 border-b border-[var(--color-border)] bg-gray-50/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Day / Night Shift Filter Bar */}
        <div className="flex items-center space-x-1 bg-white p-1 rounded-md border border-[var(--color-border)] shadow-xs">
          <button
            type="button"
            onClick={() => setShiftFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-bold rounded transition tracking-wider uppercase ${
              shiftFilter === "ALL"
                ? "bg-[var(--color-primary-dark)] text-white shadow-xs"
                : "text-gray-600 hover:text-black hover:bg-gray-100"
            }`}
          >
            All Shifts ({data.employees.length})
          </button>
          <button
            type="button"
            onClick={() => setShiftFilter("DAY")}
            className={`flex items-center px-3 py-1.5 text-xs font-bold rounded transition tracking-wider uppercase ${
              shiftFilter === "DAY"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-gray-600 hover:text-amber-700 hover:bg-amber-50"
            }`}
          >
            <Sun size={13} className="mr-1.5" />
            Day Shift ({dayCount})
          </button>
          <button
            type="button"
            onClick={() => setShiftFilter("NIGHT")}
            className={`flex items-center px-3 py-1.5 text-xs font-bold rounded transition tracking-wider uppercase ${
              shiftFilter === "NIGHT"
                ? "bg-indigo-900 text-white shadow-xs"
                : "text-gray-600 hover:text-indigo-800 hover:bg-indigo-50"
            }`}
          >
            <Moon size={13} className="mr-1.5" />
            Night Shift ({nightCount})
          </button>
        </div>

        {/* Right: Search Bar & Additional Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Machine Filter Dropdown */}
          <div className="flex items-center bg-white border border-[var(--color-border)] rounded-md px-2 py-1 shadow-xs">
            <Cpu size={13} className="text-gray-400 mr-1.5" />
            <select
              value={machineFilter}
              onChange={(e) => setMachineFilter(e.target.value)}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Machines</option>
              <option value="Machine 1">Machine 1</option>
              <option value="Machine 2">Machine 2</option>
              <option value="Machine 3">Machine 3</option>
              <option value="Machine 4">Machine 4</option>
            </select>
          </div>

          {/* Today Status Filter Dropdown */}
          <div className="flex items-center bg-white border border-[var(--color-border)] rounded-md px-2 py-1 shadow-xs">
            <Filter size={13} className="text-gray-400 mr-1.5" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs font-semibold text-gray-700 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Today Status</option>
              <option value="PRESENT">Present Today</option>
              <option value="LATE">Late Today</option>
              <option value="ABSENT">Absent Today</option>
              <option value="PENDING">Pending Today</option>
            </select>
          </div>

          {/* Search Input + Button Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-1">
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="Search employee..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value === "") setAppliedSearch("");
                }}
                className="w-36 sm:w-48 pl-2.5 pr-6 py-1 text-xs border border-[var(--color-border)] rounded-md bg-white focus:outline-none focus:border-[var(--color-primary)] font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setAppliedSearch("");
                  }}
                  className="absolute right-2 text-gray-400 hover:text-black"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="px-3 py-1 bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white text-xs font-bold rounded-md transition shadow-xs flex items-center"
            >
              <Search size={12} className="mr-1" /> Search
            </button>
          </form>

          {/* Clear all filters button */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="px-2 py-1 text-[11px] font-bold text-gray-500 hover:text-red-700 bg-gray-100 hover:bg-red-50 rounded border border-gray-200 transition"
              title="Reset all filters"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Main Table Area */}
      <div ref={scrollContainerRef} className="scrollable-table-container overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold bg-gray-50/90">
              <th className="px-2 py-2.5 font-bold w-10 text-center sticky left-0 z-30 bg-gray-50/95 backdrop-blur border-r border-[var(--color-border)]">
                #
              </th>
              <th className="px-4 py-2.5 sticky left-10 z-30 bg-gray-50/95 backdrop-blur border-r border-[var(--color-border)] min-w-[180px]">
                <div className="flex items-center">
                  <Users size={13} className="mr-1.5 text-gray-500" />
                  <span>Employee</span>
                </div>
              </th>
              {weekDays.map((day) => (
                <DayHeader key={day.date} dateStr={day.date} todayStr={data.today} />
              ))}
              <th className="px-4 py-2.5 sticky right-0 z-20 bg-gray-50/95 backdrop-blur border-l border-[var(--color-border)] min-w-[110px] text-center shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                <div className="flex items-center justify-center">
                  <Cpu size={13} className="mr-1 text-gray-500" />
                  <span>Machine</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td
                  colSpan={weekDays.length + 3}
                  className="px-6 py-8 text-center text-gray-400 font-medium text-xs"
                >
                  No employees match the selected filters.
                </td>
              </tr>
            ) : (
              filteredEmployees.map((emp, idx) => {
                const machineName = emp.machine || `Machine ${(idx % 4) + 1}`;
                return (
                  <tr
                    key={emp.id}
                    className="border-b border-[var(--color-border)] hover:bg-gray-50/40 transition-colors"
                  >
                    {/* Index */}
                    <td className="px-2 py-1.5 text-center text-gray-400 font-mono text-xs sticky left-0 z-10 bg-white border-r border-[var(--color-border)]">
                      {(idx + 1).toString().padStart(2, "0")}
                    </td>

                    {/* Employee Name (Simplified: no profile box, no job title) */}
                    <td className="px-4 py-1.5 sticky left-10 z-20 bg-white border-r border-[var(--color-border)]">
                      <span className="font-semibold text-xs sm:text-sm text-[var(--color-foreground)] tracking-tight">
                        {emp.name}
                      </span>
                    </td>

                    {/* Day Attendance Cells */}
                    {emp.days.map((day) => (
                      <AttendanceCell
                        key={`${emp.id}-${day.date}`}
                        record={day}
                        todayStr={data.today}
                        isSupervisor={isSupervisor}
                        onEditAttendance={
                          isSupervisor
                            ? () =>
                                handleAddAttendance(
                                  emp.id,
                                  emp.name,
                                  day.date,
                                  day.entry_time || undefined,
                                  day.exit_time || undefined,
                                  day.late_minutes
                                )
                            : undefined
                        }
                        onAddAttendance={() =>
                          handleAddAttendance(
                            emp.id,
                            emp.name,
                            day.date,
                            day.entry_time || undefined,
                            day.exit_time || undefined,
                            day.late_minutes
                          )
                        }
                      />
                    ))}

                    {/* Machine Column (Replaced Week Total) */}
                    <td className="px-3 py-1.5 sticky right-0 z-10 bg-white border-l border-[var(--color-border)] text-center shadow-[-2px_0_4px_rgba(0,0,0,0.03)]">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200 font-mono tracking-tight">
                        {machineName}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Attendance Modal (Supports entry, exit, and SP late time) */}
      {selectedEmployee && selectedDate && (
        <AttendanceModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          date={selectedDate}
          initialEntry={selectedEmployee.entry}
          initialExit={selectedEmployee.exit}
          initialLateMinutes={selectedEmployee.late_minutes}
          onSave={handleSaveAttendance}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["attendance"] })}
        />
      )}
    </div>
  );
}
