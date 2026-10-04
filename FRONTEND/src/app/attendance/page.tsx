"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";
import { format, startOfWeek } from "date-fns";
import WeekNavigator from "@/components/attendance/WeekNavigator";
import AttendanceTable from "@/components/attendance/AttendanceTable";

export default function AttendancePage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isSupervisor, setIsSupervisor] = useState(false);
  
  useEffect(() => {
    setIsSupervisor(!!localStorage.getItem("supervisor_token"));
  }, []);

  const dateStr = format(currentDate, "yyyy-MM-dd");
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["attendance", "week", dateStr],
    queryFn: () => attendanceApi.getWeek(dateStr),
  });

  return (
    <div className="flex flex-col space-y-6">
      <div className="flex flex-col gap-4 bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-[var(--color-border)]">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <div className="w-2 h-2 bg-[var(--color-primary)]"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--color-primary)]">Weekly Timesheet</p>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-foreground)] tracking-tight">Attendance</h1>
          </div>
        </div>
        
        <WeekNavigator 
          currentDate={currentDate} 
          onDateChange={setCurrentDate} 
          todayPresent={data?.today_present}
          todayLate={data?.today_late}
          todayAbsent={data?.today_absent}
          isSupervisor={isSupervisor}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-[var(--color-secondary-text)]">Loading attendance data...</div>
        ) : isError ? (
          <div className="p-12 text-center text-red-500">Error loading data.</div>
        ) : data ? (
          <>
            <AttendanceTable data={data} />
            <div className="bg-gray-50 border-t border-[var(--color-border)] p-4 flex flex-col md:flex-row items-center justify-between text-xs font-semibold text-[var(--color-secondary-text)] uppercase tracking-wider space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-success-text)]"></div>
                  <span>On time recorded</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary-dark)]"></div>
                  <span>Late (+15m grace)</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  <span>Scheduled absence</span>
                </div>
              </div>
              <div>Displaying standard 24-hour business day records</div>
            </div>
            <div className="bg-white border-t border-[var(--color-border)] p-4 flex flex-col md:flex-row items-center justify-between text-xs text-[var(--color-secondary-text)]">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded-full border border-red-200 flex items-center justify-center text-red-500 font-serif italic text-[10px]">i</div>
                <span>Standard work day expected duration: 08h 30m with 00h 45m scheduled break.</span>
              </div>
              <div className="font-semibold uppercase tracking-wider">All times in 24h format</div>
            </div>
          </>
        ) : null}
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-8">
        <div>Attendance & Working Hours System</div>
        <div>© 2026 Piekarnia Putka. All rights reserved.</div>
      </div>
    </div>
  );
}
