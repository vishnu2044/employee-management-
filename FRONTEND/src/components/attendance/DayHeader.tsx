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
      <th id="today-column" className="px-4 py-2.5 bg-[var(--color-primary-dark)] text-white min-w-[140px] text-center border-b-0 border-x border-[var(--color-primary-dark)]">
        <div className="flex flex-col items-center justify-center space-y-0.5">
          <span className="font-bold tracking-wider text-xs">{format(date, "EEE dd MMM").toUpperCase()}</span>
          <span className="bg-white text-[var(--color-primary-dark)] text-[0.6rem] px-1.5 py-0.2 rounded font-bold">TODAY</span>
        </div>
      </th>
    );
  }

  return (
    <th className="px-4 py-2.5 min-w-[140px] text-center font-semibold text-[var(--color-secondary-text)]">
      <div className="flex flex-col items-center justify-center">
        <span className="tracking-wider text-xs">{format(date, "EEE dd MMM").toUpperCase()}</span>
        <span className="text-[0.6rem] font-normal lowercase tracking-wide">
          {date.getDay() === 6 ? "weekend" : dateStr < todayStr ? "completed" : "upcoming"}
        </span>
      </div>
    </th>
  );
}
