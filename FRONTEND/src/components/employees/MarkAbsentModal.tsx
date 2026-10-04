"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { attendanceApi } from "@/lib/api";

interface MarkAbsentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { employee_id: string; attendance_date: string; reason?: string }) => void;
}

export default function MarkAbsentModal({ isOpen, onClose, onSave }: MarkAbsentModalProps) {
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");

  const { data: employees = [] } = useQuery({
    queryKey: ["employees"],
    queryFn: attendanceApi.getEmployees,
    enabled: isOpen
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || !date) return;
    onSave({ employee_id: employeeId, attendance_date: date, reason });
    setEmployeeId("");
    setReason("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-[var(--color-border)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-primary-dark)] text-white">
          <h2 className="text-lg font-bold tracking-tight">Mark Absent</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-2">
              Employee
            </label>
            <select
              value={employeeId}
              onChange={(e) => setEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors bg-white"
              required
            >
              <option value="">Select Employee</option>
              {employees.map((emp: any) => (
                <option key={emp.id} value={emp.id}>{emp.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="e.g. Sick leave"
            />
          </div>

          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-black uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white font-bold py-2 px-6 rounded text-sm shadow-sm uppercase tracking-wider transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
