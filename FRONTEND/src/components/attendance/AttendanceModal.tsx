"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, CheckCircle2, UserMinus } from "lucide-react";
import { format } from "date-fns";
import TimePicker from "./TimePicker";
import { attendanceApi } from "@/lib/api";

const attendanceSchema = z.object({
  entry: z.string().min(1, "Entry time is required"),
  exit: z.string().min(1, "Exit time is required"),
});

type AttendanceFormValues = z.infer<typeof attendanceSchema>;

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  employeeName: string;
  date: Date;
  onSave: (data: AttendanceFormValues) => void;
  onSuccess?: () => void;
}

export default function AttendanceModal({ isOpen, onClose, employeeId, employeeName, date, onSave, onSuccess }: AttendanceModalProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [formData, setFormData] = useState<AttendanceFormValues | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    setIsSupervisor(!!localStorage.getItem("supervisor_token"));
  }, [isOpen]);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<AttendanceFormValues>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: { entry: "08:30", exit: "17:30" }
  });

  const entryValue = watch("entry");
  const exitValue = watch("exit");

  if (!isOpen) return null;

  const onSubmit = (data: AttendanceFormValues) => {
    setFormData(data);
    setIsConfirming(true);
  };

  const handleConfirm = () => {
    if (formData) {
      onSave(formData);
      setIsConfirming(false);
      onClose();
    }
  };

  const handleMarkAbsent = async () => {
    if (confirm(`Mark ${employeeName} as absent on ${format(date, "dd MMM yyyy")}?`)) {
      try {
        await attendanceApi.markAbsent({
          employee_id: employeeId,
          attendance_date: format(date, "yyyy-MM-dd"),
          reason: "Scheduled Leave"
        });
        if (onSuccess) onSuccess();
        onClose();
      } catch (err) {
        alert("Failed to mark absent");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center bg-[var(--color-primary-dark)] rounded-t-lg text-white px-6 py-4">
          <h2 className="text-lg font-bold tracking-wider uppercase">
            {isConfirming ? "Confirm Attendance" : "Record Attendance"}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {!isConfirming ? (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">Employee</label>
                <div className="font-semibold text-[var(--color-foreground)]">{employeeName}</div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">Date</label>
                <div className="font-semibold text-[var(--color-foreground)]">{format(date, "dd MMMM yyyy")}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <TimePicker 
                    label="Entry Time"
                    value={entryValue}
                    onChange={(val) => setValue("entry", val, { shouldValidate: true })}
                  />
                  {errors.entry && <p className="text-red-500 text-xs mt-1">{errors.entry.message}</p>}
                </div>
                <div>
                  <TimePicker 
                    label="Exit Time"
                    value={exitValue}
                    onChange={(val) => setValue("exit", val, { shouldValidate: true })}
                  />
                  {errors.exit && <p className="text-red-500 text-xs mt-1">{errors.exit.message}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-[var(--color-border)]">
              {isSupervisor ? (
                <button 
                  type="button" 
                  onClick={handleMarkAbsent}
                  className="px-4 py-2 text-[var(--color-primary-dark)] bg-[#FFEBEE] hover:bg-red-100 text-xs font-bold rounded transition uppercase tracking-wider shadow-sm flex items-center"
                >
                  <UserMinus size={14} className="mr-1" /> Mark Absent
                </button>
              ) : <div></div>}
              <div className="flex space-x-3">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-bold text-[var(--color-secondary-text)] hover:text-black transition uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white text-sm font-bold rounded transition uppercase tracking-wider shadow-sm"
                >
                  Save
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-6">
            <div className="bg-orange-50 text-orange-800 p-4 rounded text-sm font-medium border border-orange-200">
              Once saved, this attendance cannot be changed by a normal user.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">Employee</label>
                <div className="font-semibold text-[var(--color-foreground)]">{employeeName}</div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">Date</label>
                <div className="font-semibold text-[var(--color-foreground)]">{format(date, "dd MMMM yyyy")}</div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border border-[var(--color-border)]">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">Entry</label>
                  <div className="font-mono font-bold text-lg">{formData?.entry}</div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-secondary-text)] uppercase tracking-widest mb-1">Exit</label>
                  <div className="font-mono font-bold text-lg">{formData?.exit}</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-[var(--color-border)]">
              <button 
                type="button" 
                onClick={() => setIsConfirming(false)}
                className="px-4 py-2 text-sm font-bold text-[var(--color-secondary-text)] hover:text-black transition uppercase tracking-wider"
              >
                Back
              </button>
              <button 
                type="button"
                onClick={handleConfirm}
                className="px-6 py-2 bg-[var(--color-primary-dark)] hover:bg-[var(--color-primary)] text-white text-sm font-bold rounded transition uppercase tracking-wider shadow-sm flex items-center"
              >
                <CheckCircle2 size={16} className="mr-2" /> Confirm
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
