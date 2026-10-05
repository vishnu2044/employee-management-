"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, CalendarX, UserPlus, Users, Edit } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import AddEmployeeModal from "@/components/employees/AddEmployeeModal";
import MarkAbsentModal from "@/components/employees/MarkAbsentModal";
import { formatDuration } from "@/lib/dates";

function getShiftType(entryTime?: string | null, exitTime?: string | null): "DAY" | "NIGHT" | null {
  if (!entryTime || !exitTime) return null;
  const [eH, eM] = entryTime.split(":").map(Number);
  const [xH, xM] = exitTime.split(":").map(Number);
  const t1 = eH * 60 + eM;
  const t2 = xH * 60 + xM;
  if (t2 < t1) return "NIGHT";
  if (eH >= 16) return "NIGHT"; // Afternoon/evening starts are night shifts
  return "DAY";
}

export default function EmployeesList() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAbsentModalOpen, setIsAbsentModalOpen] = useState(false);

  const [currentDate] = useState(new Date());
  const dateStr = format(currentDate, "yyyy-MM-dd");

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("supervisor_token");
      setIsSupervisor(!!token);
    };
    checkAuth();
    window.addEventListener("auth-change", checkAuth);
    return () => window.removeEventListener("auth-change", checkAuth);
  }, []);

  const { data: weekData, isLoading } = useQuery({
    queryKey: ["attendance", "week", dateStr, "all"],
    queryFn: () => attendanceApi.getWeek(dateStr, true),
  });

  const handleAddEmployee = async (data: { full_name: string; role: string }) => {
    try {
      await attendanceApi.createEmployee(data);
      queryClient.invalidateQueries({ queryKey: ["attendance", "week"] });
      setIsAddModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add employee.");
    }
  };

  const handleMarkAbsent = async (data: { employee_id: string; attendance_date: string; reason?: string }) => {
    try {
      await attendanceApi.markAbsent(data);
      queryClient.invalidateQueries({ queryKey: ["attendance", "week", dateStr] });
      setIsAbsentModalOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to mark absent.");
    }
  };

  const processedEmployees = useMemo(() => {
    if (!weekData) return [];
    return weekData.employees.map((emp: any) => {
      const todayData = emp.days.find((d: any) => d.date === weekData.today) || {};
      const shift = getShiftType(todayData.entry_time, todayData.exit_time);
      return {
        ...emp,
        todayStatus: todayData.status || "—",
        todayWorked: todayData.worked_minutes || 0,
        todayEntry: todayData.entry_time,
        todayExit: todayData.exit_time,
        shift,
      };
    }).filter((emp: any) => {
      // Apply search
      if (search && !emp.name.toLowerCase().includes(search.toLowerCase()) && !(emp.role && emp.role.toLowerCase().includes(search.toLowerCase()))) {
        return false;
      }
      // Apply filters
      if (filter === "ALL") return true;
      if (filter === "PRESENT") return emp.todayStatus === "PRESENT";
      if (filter === "LATE") return emp.todayStatus === "LATE";
      if (filter === "ABSENT") return emp.todayStatus === "ABSENT";
      if (filter === "DAY") return emp.shift === "DAY";
      if (filter === "NIGHT") return emp.shift === "NIGHT";
      return true;
    });
  }, [weekData, filter, search]);

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-[var(--color-border)]">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <div className="w-2 h-2 bg-[var(--color-primary)]"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">Employee Directory</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)] tracking-tight">Employees</h1>
        </div>
        
        {isSupervisor && (
          <div className="flex items-center gap-3">
            <button onClick={() => setIsAbsentModalOpen(true)} className="flex-1 sm:flex-none bg-white border border-[var(--color-border)] hover:bg-gray-50 text-[var(--color-foreground)] font-bold py-2 px-4 rounded text-xs flex items-center justify-center shadow-sm uppercase tracking-wider transition">
              <CalendarX size={14} className="mr-1.5 text-gray-500" />
              Mark Absent
            </button>
            <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white font-bold py-2 px-4 rounded text-xs flex items-center justify-center shadow-sm uppercase tracking-wider transition">
              <UserPlus size={14} className="mr-1.5" />
              Add Employee
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-[var(--color-border)] flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
          <div className="relative w-full lg:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search size={14} />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded bg-gray-50 focus:outline-none focus:border-[var(--color-primary)] transition-colors text-sm"
              placeholder="Search employees..."
            />
          </div>

          <div className="flex flex-wrap bg-gray-50 rounded border border-[var(--color-border)] p-0.5 w-full lg:w-auto">
            {["ALL", "PRESENT", "LATE", "ABSENT", "DAY", "NIGHT"].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)} 
                className={`flex-1 sm:flex-none px-3 py-1.5 text-[0.65rem] font-bold uppercase tracking-wider rounded transition-colors text-center ${filter === f ? "bg-gray-800 text-white" : "text-gray-500 hover:text-gray-800"}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-max">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-[0.65rem] uppercase tracking-widest text-gray-400 font-bold bg-gray-50/80">
                <th className="px-4 py-3 font-bold w-12 text-center sticky left-0 bg-gray-50/90 z-10">#</th>
                <th className="px-6 py-3 font-bold sticky left-12 bg-gray-50/90 z-10 border-r border-[var(--color-border)] shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)]">Employee</th>
                <th className="px-6 py-3 font-bold">Status</th>
                <th className="px-6 py-3 font-bold">Today</th>
                <th className="px-6 py-3 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-bold uppercase tracking-widest">Loading...</td></tr>
              ) : processedEmployees.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-bold uppercase tracking-widest">No employees found</td></tr>
              ) : processedEmployees.map((emp: any, idx: number) => {
                const isInactive = emp.is_active === false;
                return (
                  <tr 
                    key={emp.id} 
                    onClick={() => router.push(`/employees/${emp.id}`)}
                    className={`border-b border-[var(--color-border)] hover:bg-gray-50/80 cursor-pointer transition-colors group ${isInactive ? "opacity-75 bg-gray-50/30" : ""}`}
                  >
                    <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs sticky left-0 bg-white group-hover:bg-gray-50/80 transition-colors z-10">
                      {(idx + 1).toString().padStart(2, '0')}
                    </td>
                    <td className="px-6 py-3 border-r border-[var(--color-border)] sticky left-12 bg-white group-hover:bg-gray-50/80 transition-colors z-10 shadow-[1px_0_3px_-1px_rgba(0,0,0,0.1)]">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center font-bold text-gray-500 shrink-0 text-xs border border-[var(--color-border)]">
                          {emp.name ? emp.name.split(" ").map((n: string) => n[0]).join("") : <Users size={14} />}
                        </div>
                        <div>
                          <p className="font-bold text-[var(--color-foreground)] leading-tight group-hover:text-[var(--color-primary)] transition-colors">{emp.name}</p>
                          <p className="text-[0.65rem] text-[var(--color-secondary-text)] leading-tight">
                            {emp.role || "Employee"} • <span className="font-mono text-gray-400">{emp.id.split("-")[0]}</span>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {isInactive ? (
                        <div className="flex flex-col">
                          <span className="bg-gray-200 text-gray-600 font-bold text-[0.6rem] px-2 py-0.5 rounded tracking-widest uppercase w-max">
                            NO LONGER WORKS HERE
                          </span>
                        </div>
                      ) : (
                        <>
                          {emp.todayStatus === "PRESENT" && <span className="bg-[#E8F5E9] text-[var(--color-success-text)] font-bold text-[0.6rem] px-2 py-0.5 rounded tracking-widest uppercase">PRESENT</span>}
                          {emp.todayStatus === "LATE" && <span className="bg-[#FFE5E5] text-[#D84315] font-bold text-[0.6rem] px-2 py-0.5 rounded tracking-widest uppercase">LATE</span>}
                          {emp.todayStatus === "ABSENT" && <span className="bg-[#FFEBEE] text-[var(--color-primary-dark)] font-bold text-[0.6rem] px-2 py-0.5 rounded tracking-widest uppercase">ABSENT</span>}
                          {!["PRESENT", "LATE", "ABSENT"].includes(emp.todayStatus) && <span className="text-gray-400 font-medium text-xs">{emp.todayStatus}</span>}
                        </>
                      )}
                    </td>
                    <td className="px-6 py-3 font-bold text-gray-800 text-sm">
                      {isInactive ? "—" : formatDuration(emp.todayWorked)}
                    </td>
                    <td className="px-6 py-3 text-right whitespace-nowrap">
                      {isSupervisor && !isInactive ? (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to remove ${emp.name}?`)) {
                              try {
                                await attendanceApi.removeEmployee(emp.id);
                                queryClient.invalidateQueries({ queryKey: ["attendance", "week"] });
                              } catch (err) {
                                alert("Failed to remove employee. You may need to log in again.");
                              }
                            }
                          }}
                          className="text-[0.65rem] font-bold tracking-widest uppercase text-[var(--color-primary)] hover:text-red-700 transition-colors p-1"
                        >
                          REMOVE
                        </button>
                      ) : (
                        <span className="text-gray-300 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8">
        <div>Attendance & Working Hours System</div>
        <div>© 2026 Piekarnia Putka. All rights reserved.</div>
      </div>
      
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddEmployee}
      />
      
      <MarkAbsentModal
        isOpen={isAbsentModalOpen}
        onClose={() => setIsAbsentModalOpen(false)}
        onSave={handleMarkAbsent}
      />
    </div>
  );
}
