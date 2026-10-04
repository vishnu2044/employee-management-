from datetime import datetime, date, timedelta
from typing import Tuple
import zoneinfo

def get_current_business_date(timezone: str) -> date:
    tz = zoneinfo.ZoneInfo(timezone)
    return datetime.now(tz).date()

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def get_week_range(target_date: date) -> Tuple[date, date]:
    # Monday is 0, Sunday is 6
    week_start = target_date - timedelta(days=target_date.weekday())
    week_end = week_start + timedelta(days=6)
    return week_start, week_end
