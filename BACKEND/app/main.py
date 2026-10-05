from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import attendance, employees, supervisor, reports
from app.core.config import settings

app = FastAPI(title="Employee Attendance API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(attendance.router, prefix="/api/v1/attendance", tags=["attendance"])
app.include_router(employees.router, prefix="/api/v1/employees", tags=["employees"])
app.include_router(supervisor.router, prefix="/api/v1/supervisor", tags=["supervisor"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["reports"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
#this is just for testing for push the new data 