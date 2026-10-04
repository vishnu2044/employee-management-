import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {

  return (
    <div>
      {label && <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-2">{label}</label>}
      <div className="flex items-center border border-[var(--color-border)] rounded bg-gray-50 overflow-hidden relative">
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-3 bg-transparent text-center font-mono text-lg font-bold appearance-none focus:outline-none cursor-pointer w-full"
        />
      </div>
    </div>
  );
}
