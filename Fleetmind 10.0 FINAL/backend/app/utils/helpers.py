import uuid
from datetime import datetime
from typing import Optional
from ..core.config import settings

def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def validate_rate(rate: float, config) -> bool:
    return config.min_rate <= rate <= config.max_rate

def parse_time_to_minutes(time_str: str) -> int:
    try:
        h, m = map(int, time_str.split(':'))
        return h * 60 + m
    except:
        return 0

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def now() -> datetime:
    return datetime.now()