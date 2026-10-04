import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";

interface TimePickerProps {
  value: string; // "HH:mm"
  onChange: (time: string) => void;
  label?: string;
}

export default function TimePicker({ value, onChange, label }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const parseTime = (val: string) => {
    if (!val) return { h12: 12, m: 0, ampm: "AM" };
    const [h, m] = val.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return { h12, m: m || 0, ampm };
  };

  const { h12, m, ampm } = parseTime(value);

  const updateTime = (newH12: number, newM: number, newAmpm: string) => {
    let h24 = newH12;
    if (newAmpm === "PM" && newH12 < 12) h24 += 12;
    if (newAmpm === "AM" && newH12 === 12) h24 = 0;
    const formatted = `${h24.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
    onChange(formatted);
  };

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const ampms = ["AM", "PM"];

  return (
    <div className="relative" ref={dropdownRef}>
      {label && <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-2">{label}</label>}
      <div 
        className="flex items-center border border-[var(--color-border)] rounded bg-white overflow-hidden cursor-pointer hover:border-[var(--color-primary)] transition-colors px-3 py-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 text-center font-mono text-lg font-bold">
          {h12.toString().padStart(2, "0")} : {m.toString().padStart(2, "0")} {ampm}
        </div>
        <Clock size={20} className="text-gray-500 ml-2" />
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-[240px] bg-white border border-[var(--color-border)] shadow-xl rounded-md z-50 flex flex-row overflow-hidden h-64">
          <div className="flex-1 overflow-y-auto no-scrollbar border-r border-gray-100 py-2">
            {hours.map((h) => (
              <div
                key={h}
                onClick={() => updateTime(h, m, ampm)}
                className={`text-center py-2 cursor-pointer font-bold font-mono text-sm ${
                  h === h12 ? "bg-[#0066FF] text-white" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {h.toString().padStart(2, "0")}
              </div>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar border-r border-gray-100 py-2">
            {minutes.map((min) => (
              <div
                key={min}
                onClick={() => updateTime(h12, min, ampm)}
                className={`text-center py-2 cursor-pointer font-bold font-mono text-sm ${
                  min === m ? "bg-[#0066FF] text-white" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {min.toString().padStart(2, "0")}
              </div>
            ))}
          </div>
          <div className="flex-1 flex flex-col py-2">
            {ampms.map((a) => (
              <div
                key={a}
                onClick={() => updateTime(h12, m, a)}
                className={`text-center py-2 cursor-pointer font-bold font-mono text-sm ${
                  a === ampm ? "bg-[#0066FF] text-white" : "hover:bg-gray-100 text-gray-700"
                }`}
              >
                {a}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
