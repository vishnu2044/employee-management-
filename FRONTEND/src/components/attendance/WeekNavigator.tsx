"use client";

import { getNextWeek, getPreviousWeek } from "@/lib/dates";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";

interface WeekNavigatorProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  todayPresent?: number;
  todayLate?: number;
  todayAbsent?: number;
  isSupervisor?: boolean;
}

export default function WeekNavigator({
  currentDate,
  onDateChange,
  todayPresent = 0,
  todayLate = 0,
  todayAbsent = 0,
  isSupervisor = false
}: WeekNavigatorProps) {
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });

  const isCurrentWeek = start.getTime() === startOfWeek(new Date(), { weekStartsOn: 1 }).getTime();

  return (
    <div className="flex flex-col space-y-3 w-full lg:w-auto">
      {/* Week selector row */}
      <div className="flex items-center bg-gray-50 border border-[var(--color-border)] rounded-md overflow-hidden">
        {isSupervisor ? (
          <button
            onClick={() => onDateChange(getPreviousWeek(currentDate))}
            className="flex items-center px-2 sm:px-3 py-2 text-[0.65rem] font-bold text-[var(--color-secondary-text)] hover:text-black hover:bg-gray-100 uppercase tracking-wider transition shrink-0"
          >
            <ChevronLeft size={14} className="sm:mr-1" />
            <span className="hidden sm:inline">Prev</span>
          </button>
        ) : (
          <div className="w-8 sm:w-16"></div>
        )}

        <div className="flex-1 px-3 py-2 border-l border-r border-[var(--color-border)] font-medium text-sm flex items-center justify-center bg-white shadow-sm whitespace-nowrap">
          {format(start, "dd")} — {format(end, "dd MMM yyyy")}
          {isCurrentWeek && (
            <span className="ml-2 bg-[var(--color-primary-dark)] text-white text-[0.6rem] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">
              Now
            </span>
          )}
        </div>

        {isSupervisor ? (
          <button
            onClick={() => onDateChange(getNextWeek(currentDate))}
            className="flex items-center px-2 sm:px-3 py-2 text-[0.65rem] font-bold text-[var(--color-secondary-text)] hover:text-black hover:bg-gray-100 uppercase tracking-wider transition shrink-0"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight size={14} className="sm:ml-1" />
          </button>
        ) : (
          <div className="w-8 sm:w-16"></div>
        )}
      </div>

      {/* Today summary and Record button row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center space-x-2 text-[0.65rem] font-semibold uppercase tracking-wider text-[var(--color-secondary-text)]">
          <span className="font-bold">Today:</span>
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success-text)]"></span>
            <span className="text-[var(--color-success-text)]">{todayPresent}</span>
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary-dark)]"></span>
            <span className="text-[var(--color-primary-dark)]">{todayLate}</span>
          </span>
          <span className="text-gray-300">·</span>
          <span className="flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
            <span className="text-gray-500">{todayAbsent}</span>
          </span>
        </div>

      </div>
    </div>
  );
}
