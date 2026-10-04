import { format } from "date-fns";

interface DayHeaderProps {
  dateStr: string;
  todayStr: string;
}

export default function DayHeader({ dateStr, todayStr }: DayHeaderProps) {
  const isToday = dateStr === todayStr;
  const date = new Date(dateStr);

  if (isToday) {
    return (
      <th id="today-column" className="px-6 py-4 bg-[var(--color-primary-dark)] text-white min-w-[160px] text-center border-b-0 border-x border-[var(--color-primary-dark)]">
        <div className="flex flex-col items-center justify-center space-y-1">
          <span className="font-bold tracking-widest">{format(date, "EEE dd MMM").toUpperCase()}</span>
          <span className="bg-white text-[var(--color-primary-dark)] text-[0.65rem] px-2 py-0.5 rounded-full font-bold">TODAY</span>
        </div>
      </th>
    );
  }

  return (
    <th className="px-6 py-4 min-w-[160px] text-center font-semibold text-[var(--color-secondary-text)]">
      <div className="flex flex-col items-center justify-center">
        <span className="tracking-widest">{format(date, "EEE dd MMM").toUpperCase()}</span>
        <span className="text-[0.65rem] font-normal lowercase tracking-wide mt-1">
          {date.getDay() === 0 || date.getDay() === 6 ? "weekend" : dateStr < todayStr ? "completed" : "upcoming"}
        </span>
      </div>
    </th>
  );
}
