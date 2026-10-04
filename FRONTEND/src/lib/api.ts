import { WeeklyAttendanceResponse, AttendanceRecord } from "@/types/attendance";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const attendanceApi = {
  getWeek: async (dateStr: string): Promise<WeeklyAttendanceResponse> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("supervisor_token") : null;
    const res = await fetch(`${API_BASE_URL}/attendance/week?start_date=${dateStr}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      if (res.status === 403) throw new Error("Normal users can only view the current week");
      throw new Error(`Failed to fetch week data: ${res.statusText}`);
    }
    return res.json();
  },

  createAttendance: async (data: { employee_id: string; attendance_date: string; entry_time: string; exit_time: string }) => {
    const res = await fetch(`${API_BASE_URL}/attendance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Failed to create attendance: ${res.statusText}`);
    }
    return res.json();
  },

  loginSupervisor: async (data: { username: string; password: string }) => {
    const formData = new URLSearchParams();
    formData.append("username", data.username);
    formData.append("password", data.password);
    
    const res = await fetch(`${API_BASE_URL}/supervisor/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });
    if (!res.ok) {
      throw new Error("Invalid username or password");
    }
    return res.json(); // Returns { access_token, token_type }
  },

  getEmployees: async () => {
    const res = await fetch(`${API_BASE_URL}/employees`);
    if (!res.ok) {
      throw new Error(`Failed to fetch employees: ${res.statusText}`);
    }
    return res.json();
  },

  getEmployee: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/employees/${id}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch employee: ${res.statusText}`);
    }
    return res.json();
  },

  getEmployeeAnalytics: async (id: string) => {
    const res = await fetch(`${API_BASE_URL}/employees/${id}/analytics`);
    if (!res.ok) {
      throw new Error(`Failed to fetch employee analytics: ${res.statusText}`);
    }
    return res.json();
  },

  createEmployee: async (data: { full_name: string; role?: string; photo_url?: string }) => {
    const token = localStorage.getItem("supervisor_token");
    const res = await fetch(`${API_BASE_URL}/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Failed to create employee: ${res.statusText}`);
    }
    return res.json();
  },
  
  removeEmployee: async (id: string) => {
    const token = localStorage.getItem("supervisor_token");
    const res = await fetch(`${API_BASE_URL}/employees/${id}`, {
      method: 'DELETE',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to remove employee: ${res.statusText}`);
    }
    return true;
  },

  markAbsent: async (data: { employee_id: string; attendance_date: string; reason?: string }) => {
    const token = localStorage.getItem("supervisor_token");
    const res = await fetch(`${API_BASE_URL}/attendance/absent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Failed to mark absent: ${res.statusText}`);
    }
    return res.json();
  }
};

