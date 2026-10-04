"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeData?: { full_name: string; role: string; id: string };
  onSave: (data: { full_name: string; role: string }) => void;
}

export default function EditEmployeeModal({ isOpen, onClose, employeeData, onSave }: EditEmployeeModalProps) {
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    if (employeeData) {
      setFullName(employeeData.full_name || "");
      setRole(employeeData.role || "");
    }
  }, [employeeData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;
    onSave({ full_name: fullName, role });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl border border-[var(--color-border)] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-primary-dark)] text-white">
          <h2 className="text-lg font-bold tracking-tight">Edit Employee Details</h2>
          <button onClick={onClose} className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="e.g. John Doe"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-2">
              Role / Profession
            </label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              placeholder="e.g. Software Developer"
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
              Save Details
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
