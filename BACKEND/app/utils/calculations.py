from app.utils.datetime import parse_time

def calculate_worked_minutes(entry_time: str, exit_time: str) -> int:
    t1 = parse_time(entry_time)
    t2 = parse_time(exit_time)
    if t2 < t1:
        # Crosses midnight
        from datetime import timedelta
        diff = timedelta(days=1, hours=t2.hour, minutes=t2.minute) - timedelta(hours=t1.hour, minutes=t1.minute)
    else:
        diff = t2 - t1
    return int(diff.total_seconds() / 60)

def calculate_late_minutes(entry_time: str) -> int:
    t1 = parse_time(entry_time)
    
    # Determine shift and expected start time
    if t1.hour < 16:
        expected = parse_time("09:00")
    else:
        expected = parse_time("18:00")
        
    if t1 > expected:
        diff = t1 - expected
        return int(diff.total_seconds() / 60)
    return 0
