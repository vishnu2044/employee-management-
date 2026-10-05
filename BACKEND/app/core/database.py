import os
import shutil
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

db_url = settings.DATABASE_URL

# Auto-convert standard postgres:// URLs to SQLAlchemy psycopg format
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg://", 1)
elif db_url.startswith("postgresql://") and not db_url.startswith("postgresql+"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

# Handle Vercel serverless environment for SQLite (Vercel filesystem is read-only except /tmp)
if db_url.startswith("sqlite") and (os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME")):
    import tempfile
    tmp_dir = tempfile.gettempdir()
    tmp_db_path = os.path.join(tmp_dir, "attendance.db").replace("\\", "/")
    if not os.path.exists(tmp_db_path):
        candidates = [
            Path("attendance.db"),
            Path("BACKEND/attendance.db"),
            Path(__file__).resolve().parent.parent.parent / "attendance.db",
        ]
        for candidate in candidates:
            if candidate.exists():
                shutil.copyfile(candidate, tmp_db_path)
                break
    db_url = f"sqlite:///{tmp_db_path}"

engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if db_url.startswith("sqlite") else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

