import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { WeeklyAttendanceResponse, EmployeeWeeklyAttendance } from "@/types/attendance";
import { attendanceApi } from "@/lib/api";
import { format } from "date-fns";
import DayHeader from "./DayHeader";
import AttendanceCell from "./AttendanceCell";
import AttendanceModal from "./AttendanceModal";
import { formatDuration } from "@/lib/dates";
import { Users, Clock } from "lucide-react";

interface AttendanceTableProps {
  data: WeeklyAttendanceResponse;
}

export default function AttendanceTable({ data }: AttendanceTableProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<{ id: string; name: string } | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (scrollContainerRef.current) {
        const todayHeader = document.getElementById("today-column");
        if (todayHeader) {
          // Scroll horizontally so that the Today column is aligned towards the right
          const container = scrollContainerRef.current;
          const scrollLeft = todayHeader.offsetLeft - container.offsetWidth + todayHeader.offsetWidth + 180; // 180 is for the sticky 'Week Total' column
          container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
        }
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [data.today]);

  // First employee's days array defines the week structure
  const weekDays = data.employees[0]?.days || [];

  const handleAddAttendance = (employeeId: string, employeeName: string, dateStr: string) => {
    setSelectedEmployee({ id: employeeId, name: employeeName });
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
      });
      
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      setModalOpen(false);
    } catch (error) {
      console.error("Failed to save attendance:", error);
      alert("Failed to save attendance.");
    }
  };

  return (
    <div className="w-full relative bg-white">
      <div ref={scrollContainerRef} className="scrollable-table-container overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse min-w-max">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wider text-[var(--color-secondary-text)] font-semibold bg-gray-50/80">
              <th className="px-4 py-3 font-bold w-12 text-center sticky left-0 z-30 bg-gray-50/95 backdrop-blur">#</th>
              <th className="px-6 py-4 sticky left-12 z-30 bg-gray-50/95 backdrop-blur border-r border-[var(--color-border)] min-w-[250px]">
                <div className="flex items-center"><Users size={14} className="mr-2" /> Employee</div>
              </th>
              {weekDays.map((day) => (
                <DayHeader key={day.date} dateStr={day.date} todayStr={data.today} />
              ))}
              <th className="px-6 py-4 sticky right-0 z-20 bg-gray-50/95 backdrop-blur border-l border-[var(--color-border)] min-w-[150px] shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                <div className="flex items-center"><Clock size={14} className="mr-2" /> Week Total</div>
              </th>
            </tr>
          </thead>
          <tbody>
            {data.employees.map((emp, idx) => (
              <tr key={emp.id} className="border-b border-[var(--color-border)] hover:bg-gray-50/30 transition-colors">
                <td className="px-4 py-3 text-center text-gray-400 font-mono text-xs sticky left-0 z-10 bg-white">
                  {(idx + 1).toString().padStart(2, '0')}
                </td>
                <td className="px-6 py-4 sticky left-12 z-20 bg-white border-r border-[var(--color-border)]">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded bg-gray-100 border border-[var(--color-border)] flex items-center justify-center font-bold text-gray-500 shrink-0">
                      {emp.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <p className="font-bold text-[var(--color-foreground)]">{emp.name}</p>
                      <p className="text-xs text-[var(--color-secondary-text)]">{emp.role}</p>
                    </div>
                  </div>
                </td>
                {emp.days.map((day) => (
                  <AttendanceCell 
                    key={`${emp.id}-${day.date}`} 
                    record={day} 
                    todayStr={data.today} 
                    onAddAttendance={() => handleAddAttendance(emp.id, emp.name, day.date)}
                  />
                ))}
                <td className="px-6 py-4 sticky right-0 z-10 bg-white border-l border-[var(--color-border)] shadow-[-2px_0_4px_rgba(0,0,0,0.05)]">
                  <p className="font-bold text-base">{formatDuration(emp.weekly_total_minutes)}</p>
                  <p className="text-xs text-[var(--color-secondary-text)]">{emp.days_worked} of 5 days</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedEmployee && selectedDate && (
        <AttendanceModal 
          isOpen={modalOpen} 
          onClose={() => setModalOpen(false)} 
          employeeId={selectedEmployee.id}
          employeeName={selectedEmployee.name}
          date={selectedDate}
          onSave={handleSaveAttendance}
          onSuccess={() => queryClient.invalidateQueries({ queryKey: ["attendance"] })}
        />
      )}
    </div>
  );
}
