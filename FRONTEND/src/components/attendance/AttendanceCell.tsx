"use client";

import { AttendanceRecord } from "@/types/attendance";
import { PlusCircle, Pencil, Plus } from "lucide-react";

interface AttendanceCellProps {
  record: AttendanceRecord;
  todayStr: string;
  isSupervisor?: boolean;
  onEditAttendance?: () => void;
  onAddAttendance?: () => void;
}

export default function AttendanceCell({
  record,
  todayStr,
  isSupervisor = false,
  onEditAttendance,
  onAddAttendance,
}: AttendanceCellProps) {
  const isToday = record.date === todayStr;

  const handleClick = () => {
    if (record.status === "PRESENT" || record.status === "LATE" || record.status === "ABSENT") {
      if (onEditAttendance) onEditAttendance();
      else if (onAddAttendance) onAddAttendance();
    } else if (isToday) {
      if (onAddAttendance) onAddAttendance();
    } else if (isSupervisor && onAddAttendance) {
      onAddAttendance();
    }
  };

  // Weekend
  if (record.status === "WEEKEND") {
    return (
      <td className="px-2 py-1.5 text-center text-[0.65rem] tracking-wider text-gray-400 font-medium uppercase border-r border-[var(--color-border)] bg-gray-50/40">
        Weekend
      </td>
    );
  }

  // Absent
  if (record.status === "ABSENT") {
    return (
      <td
        onClick={handleClick}
        className={`px-2 py-1.5 border-r border-[var(--color-border)] bg-red-50/60 ${
          isSupervisor ? "cursor-pointer hover:bg-red-100/70 transition group relative" : ""
        }`}
      >
        <div className="flex flex-col items-center justify-center py-1">
          <span className="font-bold text-[0.65rem] text-[var(--color-primary-dark)] tracking-wider">
            ABSENT
          </span>
          <span className="text-[0.55rem] text-gray-500 uppercase tracking-tight">
            Leave
          </span>
          {isSupervisor && (
            <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-[var(--color-primary-dark)]">
              <Pencil size={11} />
            </span>
          )}
        </div>
      </td>
    );
  }

  // Present or Late
  if (record.status === "PRESENT" || record.status === "LATE") {
    const isLate = record.status === "LATE" || (Boolean(record.late_minutes) && record.late_minutes > 0);

    // Green color for on-time, reddish for late
    const cellClass = isLate
      ? "bg-[#FFF0F0] text-[#B71C1C] border border-[#FFCDD2]/60 hover:bg-[#FFE5E5]"
      : "bg-[#E8F5E9] text-[#1B5E20] border border-[#C8E6C9]/80 hover:bg-[#DCEDC8]";

    return (
      <td
        onClick={handleClick}
        className={`px-1.5 py-1 border-r border-[var(--color-border)] relative ${cellClass} ${
          isSupervisor ? "cursor-pointer transition group" : ""
        }`}
      >
        <div className="flex flex-col items-center justify-center py-0.5">
          <div className="font-bold text-xs tracking-tight whitespace-nowrap font-mono">
            {record.entry_time} - {record.exit_time}
          </div>
          {isLate && record.late_minutes > 0 ? (
            <div className="text-[0.6rem] font-bold text-[#D84315] uppercase tracking-wider mt-0.5">
              SP (+{record.late_minutes}M)
            </div>
          ) : null}
          {isSupervisor && (
            <span className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition text-gray-700 bg-white/80 p-0.5 rounded shadow-xs">
              <Pencil size={10} />
            </span>
          )}
        </div>
      </td>
    );
  }

  // Today with no attendance yet
  if (isToday) {
    return (
      <td className="px-2 py-1 border-r border-[var(--color-border)] bg-[var(--color-today-bg)]">
        <button
          onClick={onAddAttendance}
          className="flex items-center justify-center space-x-1 bg-white text-[var(--color-primary-dark)] border border-[var(--color-primary-dark)]/30 rounded py-1 px-2 hover:bg-red-50 transition w-full shadow-xs text-center"
        >
          <Plus size={13} />
          <span className="text-[0.65rem] font-bold tracking-wider uppercase">Add</span>
        </button>
      </td>
    );
  }

  // Past day without attendance
  if (record.date < todayStr) {
    return (
      <td
        onClick={isSupervisor ? handleClick : undefined}
        className={`px-2 py-1.5 text-center text-gray-300 border-r border-[var(--color-border)] ${
          isSupervisor ? "cursor-pointer hover:bg-gray-100/60 group relative" : ""
        }`}
      >
        <span className="text-gray-300 font-mono text-xs">—</span>
        {isSupervisor && (
          <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-50/80 text-gray-600 text-[0.65rem] font-bold transition">
            <Plus size={12} className="mr-0.5" /> Add
          </span>
        )}
      </td>
    );
  }

  // Upcoming day
  return (
    <td
      onClick={isSupervisor ? handleClick : undefined}
      className={`px-2 py-1.5 text-center border-r border-[var(--color-border)] ${
        isSupervisor ? "cursor-pointer hover:bg-gray-50 group relative" : ""
      }`}
    >
      <span className="text-[0.6rem] font-medium text-gray-300 tracking-wider uppercase">—</span>
      {isSupervisor && (
        <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-gray-50/80 text-gray-600 text-[0.6rem] font-bold transition">
          <Plus size={11} className="mr-0.5" /> Set
        </span>
      )}
    </td>
  );
}
