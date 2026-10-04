import { AttendanceRecord } from "@/types/attendance";
import { formatDuration } from "@/lib/dates";
import { CheckCircle2, PlusCircle } from "lucide-react";

interface AttendanceCellProps {
  record: AttendanceRecord;
  todayStr: string;
  onAddAttendance?: () => void;
}

export default function AttendanceCell({ record, todayStr, onAddAttendance }: AttendanceCellProps) {
  const isToday = record.date === todayStr;

  let bgClass = "";
  if (isToday) bgClass = "bg-[var(--color-today-bg)] border border-[var(--color-primary-dark)]";
  else if (record.status === "LATE") bgClass = "bg-[var(--color-late-bg)]";
  else if (record.status === "ABSENT") bgClass = "bg-[var(--color-absent-bg)]";

  if (record.status === "WEEKEND") {
    return (
      <td className="px-6 py-4 text-center text-xs tracking-widest text-gray-400 font-semibold uppercase border-r border-[var(--color-border)]">
        Weekend
      </td>
    );
  }

  if (record.status === "ABSENT") {
    return (
      <td className={`px-6 py-4 align-middle border-r border-[var(--color-border)] ${bgClass}`}>
        <div className="flex flex-col items-center justify-center h-full space-y-1 py-4">
          <span className="font-bold text-[var(--color-primary-dark)] tracking-wider">ABSENT</span>
          <span className="text-[0.65rem] text-gray-500 uppercase tracking-widest">Scheduled Leave</span>
        </div>
      </td>
    );
  }

  if (record.status === "PRESENT" || record.status === "LATE") {
    // Determine shift
    let shift = "DAY";
    if (record.entry_time && record.exit_time) {
      const [eH, eM] = record.entry_time.split(":").map(Number);
      const [xH, xM] = record.exit_time.split(":").map(Number);
      if (xH * 60 + xM < eH * 60 + eM || eH >= 16) {
        shift = "NIGHT";
      }
    }

    return (
      <td className={`px-2 py-3 border-r border-[var(--color-border)] ${bgClass} ${record.status === "LATE" ? "bg-[var(--color-late-bg)]" : ""}`}>
        <div className="flex flex-col space-y-1 w-full mx-auto text-center items-center justify-center">
          <div className="font-bold text-sm tracking-wide">{record.entry_time} - {record.exit_time}</div>
          
          <div className="flex flex-col items-center justify-center mt-1 pt-1 border-t border-black/5 w-full">
            <span className="text-[0.65rem] font-bold text-gray-500 uppercase tracking-widest">{shift}</span>
            {record.status === "LATE" && (
              <span className="mt-1 text-[#D84315] text-[0.6rem] font-bold px-1 rounded tracking-widest uppercase">
                SP (+{record.late_minutes}M)
              </span>
            )}
          </div>
        </div>
      </td>
    );
  }

  if (isToday) {
    return (
      <td className={`px-6 py-4 border-r border-[var(--color-border)] ${bgClass}`}>
        <div className="flex h-full items-center justify-center py-2">
          <button onClick={onAddAttendance} className="flex flex-col items-center justify-center space-y-2 bg-white text-[var(--color-primary-dark)] border border-[var(--color-border)] rounded shadow-sm py-3 px-4 hover:border-[var(--color-primary-dark)] hover:bg-red-50 transition w-full">
            <PlusCircle size={20} />
            <span className="text-[0.65rem] font-bold tracking-widest uppercase text-center">Add<br/>Attendance</span>
          </button>
        </div>
      </td>
    );
  }

  if (record.date > todayStr) {
    return (
      <td className="px-6 py-4 text-center border-r border-[var(--color-border)]">
        <span className="text-[0.6rem] font-bold text-gray-300 tracking-widest uppercase">Upcoming</span>
      </td>
    );
  }

  return (
    <td className="px-6 py-4 text-center text-gray-300 border-r border-[var(--color-border)]">
      —
    </td>
  );
}
