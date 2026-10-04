# Employee Attendance System - Project Details

This document outlines the comprehensive features, functionalities, and architectural details for both the Frontend and Backend of the Employee Attendance System, incorporating the latest required improvements.

## 🎨 Design & UX Principles
* **Visual Style:** Warm cream/off-white, deep red, white, charcoal, and muted gray.
* **Simplicity:** Keep the application simple. No complex HR features (payroll, biometrics, etc.).
* **Data Truth:** The Backend is the authoritative source of truth.
* **Time Format:** 24-hour time everywhere.
* **Visibility:** Always show employee names clearly (e.g., Name, Role, ID).
* **Clear States:** Make Late/Absent states visually obvious.

---

## 🖥️ Frontend Details

### 1. Authentication & Authorization
* **Supervisor/HR Login:** JWT-based authentication for `/supervisor/login`.
* **Access Control:** Protected supervisor pages. Normal attendance entry remains unauthenticated.
* **Session Management:** Logout functionality and expired-token handling.

### 2. Dashboards & Views
* **Flexible 7-Day View:** Default view is Sunday → Saturday, but users can select any start date. Always displays exactly 7 consecutive dates.
* **Dynamic Today Summary:** Real-time counts (Present, Late, Absent) calculated from backend data based on the configured business timezone.
* **Visual States:**
  * **Present:** Clean positive state (e.g., `09:02 · 18:01 · 08h 59m · PRESENT`).
  * **Late:** Muted red/pink background highlighting the whole cell.
  * **Absent:** Clearly displayed `ABSENT`.
  * **Future:** Displayed as `UPCOMING`.
  * **Today:** Column header clearly marked as active.

### 3. Attendance Management (Time Tracking)
* **Time Entry UI:** Mobile-friendly time-picker (Date → From → To → Total Hours → Shift → Notes → Save).
* **Shift Detection:** Automatic determination of Day/Night shift (e.g., 22:00 → 06:00 = NIGHT SHIFT), handling midnight crossovers.
* **Smart Validation:** Validates entry/exit times, prevents duplicates, allows overnight shifts.
* **Supervisor Edits:** Full modal for editing attendance (recalculates hours, shift, status) and marking absent (including future dates).

### 4. Employee Management
* **CRUD Operations:** Add (Name, Role, Code, Photo) and Remove (Deactivation via `is_active = false` to preserve history).
* **Search:** Filter by name, code, or role.
* **Employee Details Shortcut:** Clickable names leading to detailed employee profiles.

### 5. Analytics & Reports
* **Employee Analytics (`/employees/[id]/analytics`):** Simple graphs (Present vs Absent vs Late, hours by day, monthly trend).
* **Employee Reports:** Daily, weekly, monthly, and custom-range reports (Print/Download PDF).
* **All-Employee Reports:** Combined PDF or ZIP of individual PDFs for all employees across selected date ranges.

---

## ⚙️ Backend Details

### 1. Core Architecture & Security
* **Authentication:** JWT generation and validation for Supervisors/HR.
* **Authorization:** Strict enforcement of role-based access for edits, absences, and management.
* **Password Security:** Secure password hashing (no plaintext).

### 2. Attendance Processing Engine
* **Dynamic Calculations:** Server-side calculation of total hours worked, late status, and shift types.
* **Validation:** Authoritative validation of dates, times, and employee status.
* **Audit Logging:** Tracking old/new values, changed by, time, and reason when supervisors edit records.

### 3. Reporting & Analytics System
* **Data Aggregation:** Queries for dynamic dashboard summaries and employee analytics.
* **PDF Generation:** Server-side or client-side generation of standardized reports with company branding.

---

## 🚀 Implementation Phases

### Phase 1 — Security/Data
1. JWT authentication.
2. Backend authorization.
3. Dynamic current date & Present/Late/Absent counts.
4. Fix employee name/data binding.

### Phase 2 — Attendance
5. Flexible 7-day range & Time picker.
6. Automatic hours calculation & Day/Night shift detection.
7. Smart validation & Visual states (Present/Late/Absent/Upcoming).
8. Simplified Home Attendance table with DAY/NIGHT indicators and no redundant totals.

### Phase 3 — Supervisor & Employees Management
9. Unified `/employees` page replacing separate `/supervisor` route.
10. Sticky columns (#, Employee, Week Total) for improved horizontal scrolling.
11. Functional Add Employee & Remove/Deactivate.
12. Functional Edit Attendance & Mark Absent (Global and cell-specific).
13. Employee search & filtering (ALL, PRESENT, LATE, ABSENT, DAY, NIGHT).

### Phase 4 — Employee Insights
14. Employee details & Analytics (Daily hours display).
15. Attendance graphs & Summaries.

### Phase 5 — Reports
16. Daily/Weekly/Monthly/Custom employee PDFs.
17. All-employee combined PDF & ZIP download.
