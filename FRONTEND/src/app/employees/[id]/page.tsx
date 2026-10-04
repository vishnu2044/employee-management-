"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Calendar as CalendarIcon, Clock, Pencil } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { formatDuration } from "@/lib/dates";
import { use } from "react";
import EditEmployeeModal from "@/components/employees/EditEmployeeModal";

export default function EmployeeDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const employeeId = resolvedParams.id;
  
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const dateStr = format(currentDate, "yyyy-MM-dd");
  const queryClient = useQueryClient();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    setIsSupervisor(!!localStorage.getItem("supervisor_token"));
  }, []);
  
  const { data, isLoading } = useQuery({
    queryKey: ["attendance", "week", dateStr],
    queryFn: () => attendanceApi.getWeek(dateStr),
  });

  const { data: employeeDataApi } = useQuery({
    queryKey: ["employee", employeeId],
    queryFn: () => attendanceApi.getEmployee(employeeId),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ["employee", employeeId, "analytics"],
    queryFn: () => attendanceApi.getEmployeeAnalytics(employeeId),
  });

  if (isLoading) {
    return <div className="p-12 text-center text-[var(--color-secondary-text)]">Loading data...</div>;
  }

  const employeeData = data?.employees.find(e => e.id === employeeId);
  // fallback to employeeDataApi if week doesn't have it (e.g. inactive)
  const displayName = employeeData?.name || employeeDataApi?.full_name || "Unknown";
  const displayRole = employeeData?.role || employeeDataApi?.role || "Employee";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("");
  
  const isActive = employeeDataApi ? employeeDataApi.is_active : true;

  const handleUpdateEmployee = async (formData: { full_name: string; role: string }) => {
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
      const res = await fetch(`${API_BASE_URL}/employees/${employeeId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("supervisor_token")}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: ["employee", employeeId] });
        queryClient.invalidateQueries({ queryKey: ["attendance"] });
        setIsEditModalOpen(false);
      } else {
        alert("Failed to update employee");
      }
    } catch (e) {
      alert("Error updating employee");
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      <div>
        <Link href="/employees" className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-black transition-colors mb-6">
          <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg shadow-sm border border-[var(--color-border)]">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-2xl font-bold text-gray-500 border border-gray-200">
              {initials}
            </div>
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-3xl font-bold text-[var(--color-foreground)] tracking-tight">{displayName}</h1>
                {!isActive && (
                   <span className="bg-[#FFEBEE] text-[var(--color-primary-dark)] text-[10px] font-bold px-2 py-0.5 rounded tracking-wider uppercase ml-2">No longer works here</span>
                )}
                {isSupervisor && (
                  <button onClick={() => setIsEditModalOpen(true)} className="text-gray-400 hover:text-[var(--color-primary-dark)] transition ml-2">
                    <Pencil size={18} />
                  </button>
                )}
              </div>
              <p className="text-gray-500 font-medium">
                {displayRole}
              </p>
            </div>
          </div>
          
          <button onClick={() => window.print()} className="bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white font-bold py-2.5 px-6 rounded text-sm flex items-center shadow-sm uppercase tracking-wider transition">
            Print PDF Report
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--color-border)] border-t-4 border-t-[var(--color-primary-dark)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Today's Hours</h3>
            <Clock size={16} className="text-[var(--color-primary-dark)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight mb-1">{analyticsData?.today_minutes ? formatDuration(analyticsData.today_minutes) : "—"}</div>
          <div className="text-xs text-gray-500 font-medium">Started shift at <span className="font-bold text-gray-800">{analyticsData?.today_entry || "—"}</span></div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--color-border)] border-t-4 border-t-gray-300">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">This Week</h3>
            <CalendarIcon size={16} className="text-gray-400" />
          </div>
          <div className="text-4xl font-bold tracking-tight mb-1">{employeeData ? formatDuration(employeeData.weekly_total_minutes) : "—"}</div>
          <div className="text-xs text-gray-500 font-medium">Standard Target: 40h 00m</div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-[var(--color-border)] border-t-4 border-t-[var(--color-success-text)]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">This Month</h3>
            <CalendarIcon size={16} className="text-[var(--color-success-text)]" />
          </div>
          <div className="text-4xl font-bold tracking-tight mb-1">{analyticsData?.monthly_minutes ? formatDuration(analyticsData.monthly_minutes) : "—"}</div>
          <div className="text-xs text-gray-500 font-medium">Total recorded: {analyticsData?.days_worked || 0} days worked</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2 bg-gray-50/50">
          <div className="flex space-x-2">
            <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Daily</button>
            <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-[var(--color-primary-dark)] border-b-2 border-[var(--color-primary-dark)]">Weekly (Active)</button>
            <button className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Monthly</button>
          </div>
          <div className="flex items-center space-x-4 text-sm font-bold text-gray-600">
            <div className="flex items-center"><CalendarIcon size={16} className="mr-2" /> {data?.week_start} - {data?.week_end}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-gray-50/80 border-b border-[var(--color-border)] text-xs uppercase tracking-widest text-gray-400 font-bold">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Entry</th>
                <th className="px-6 py-4">Exit</th>
                <th className="px-6 py-4">Worked</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {(employeeData?.days || []).map((row: any, idx: number) => {
                const isActive = row.date === data?.today;
                return (
                  <tr key={idx} className={`border-b border-[var(--color-border)] ${isActive ? "bg-[#FCF5F5]" : "hover:bg-gray-50/30"} transition-colors`}>
                    <td className={`px-6 py-4 font-bold ${isActive ? "text-[var(--color-primary-dark)]" : "text-gray-800"}`}>
                      <div className="flex items-center">
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-dark)] mr-2"></div>}
                        {format(new Date(row.date), "EEE dd MMM")}
                      </div>
                    </td>
                    <td className={`px-6 py-4 font-bold`}>{row.entry_time || "—"}</td>
                    <td className={`px-6 py-4 font-bold ${!row.exit_time ? "text-gray-300" : ""}`}>{row.exit_time || "—"}</td>
                    <td className={`px-6 py-4 font-bold ${isActive ? "text-[var(--color-primary-dark)]" : ""}`}>{formatDuration(row.worked_minutes)}</td>
                    <td className="px-6 py-4">
                      {row.status === "PRESENT" && <span className="bg-[#E8F5E9] text-[var(--color-success-text)] font-bold text-[0.65rem] px-2 py-1 rounded tracking-widest uppercase">PRESENT</span>}
                      {row.status === "LATE" && <span className="bg-[#FFE5E5] text-[#D84315] font-bold text-[0.65rem] px-2 py-1 rounded tracking-widest uppercase">LATE</span>}
                      {row.status === "ABSENT" && <span className="bg-[#FFEBEE] text-[var(--color-primary-dark)] font-bold text-[0.65rem] px-2 py-1 rounded tracking-widest uppercase">ABSENT</span>}
                      {row.status === "WEEKEND" && <span className="bg-gray-100 text-gray-500 font-bold text-[0.65rem] px-2 py-1 rounded tracking-widest uppercase">WEEKEND</span>}
                      {!row.status && <span className="text-gray-400">—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-gray-50 p-4 flex flex-col md:flex-row items-center justify-between text-xs text-gray-500 font-medium">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full border border-gray-300 flex items-center justify-center font-serif italic text-[10px]">i</div>
            <span>Logged days to date include completed shifts this week.</span>
          </div>
          <div>Weekly Total: <span className="font-bold text-gray-800">{employeeData ? formatDuration(employeeData.weekly_total_minutes) : "0h 0m"} logged</span> of 40h standard</div>
        </div>
      </div>
      
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8">
        <div>Attendance & Working Hours System</div>
        <div>© 2026 Piekarnia Putka. All rights reserved.</div>
      </div>

      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employeeData={{ id: employeeId, full_name: displayName, role: displayRole }}
        onSave={handleUpdateEmployee}
      />
    </div>
  );
}
