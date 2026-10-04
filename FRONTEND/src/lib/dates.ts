import { startOfWeek, endOfWeek, addWeeks, subWeeks, format, isToday, isBefore, isAfter, startOfDay, isSameDay } from "date-fns";

// Use a fixed timezone in real app, but for now we'll use local time to simulate business date
// as requested in the PRD (using date-fns for simplicity in the mockup)

export function getWeekStart(date: Date = new Date()) {
  return startOfWeek(date, { weekStartsOn: 1 }); // Monday start
}

export function getWeekEnd(date: Date = new Date()) {
  return endOfWeek(date, { weekStartsOn: 1 });
}

export function getNextWeek(date: Date) {
  return addWeeks(date, 1);
}

export function getPreviousWeek(date: Date) {
  return subWeeks(date, 1);
}

export function formatDate(date: Date, formatStr: string = "yyyy-MM-dd") {
  return format(date, formatStr);
}

export function formatTime24(timeString: string | null | undefined) {
  if (!timeString) return "—";
  return timeString; // assuming it's already HH:mm
}

export function isPastDate(date: Date) {
  return isBefore(startOfDay(date), startOfDay(new Date()));
}

export function isFutureDate(date: Date) {
  return isAfter(startOfDay(date), startOfDay(new Date()));
}

export function checkIsToday(date: Date) {
  return isToday(date);
}

export function formatDuration(minutes: number) {
  if (minutes === 0 || !minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
}
