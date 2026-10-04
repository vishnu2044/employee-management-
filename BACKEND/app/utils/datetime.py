from datetime import datetime, date, timedelta
from typing import Tuple
import zoneinfo

def get_current_business_date(timezone: str) -> date:
    tz = zoneinfo.ZoneInfo(timezone)
    return datetime.now(tz).date()

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def get_week_range(target_date: date) -> Tuple[date, date]:
    # Sunday is start of week (weekday: Monday=0, ... Saturday=5, Sunday=6)
    days_since_sunday = (target_date.weekday() + 1) % 7
    week_start = target_date - timedelta(days=days_since_sunday)
    week_end = week_start + timedelta(days=6)
    return week_start, week_end
