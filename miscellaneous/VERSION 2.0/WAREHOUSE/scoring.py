from datetime import datetime, timedelta
from typing import List, Tuple
from .models import ScheduledTruck, EvaluationRequest

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def predict_dock_occupancy(eta: datetime, scheduled_trucks: List[ScheduledTruck], total_docks: int):
    intervals = []
    for st in scheduled_trucks:
        start = parse_time(st.eta)
        end = start + timedelta(minutes=st.unloading_duration)
        intervals.append((start, end))
    occupied = 0
    for start, end in intervals:
        if start <= eta < end:
            occupied += 1
    free = max(0, total_docks - occupied)
    wait = 0
    if free == 0:
        future_ends = [end for start, end in intervals if end > eta]
        if future_ends:
            earliest_end = min(future_ends)
            wait = int((earliest_end - eta).total_seconds() / 60)
        else:
            wait = 30
    return occupied, free, wait

def calculate_dock_availability_score(free_docks: int, total_docks: int) -> float:
    if total_docks == 0:
        return 0
    return clamp((free_docks / total_docks) * 100)

def calculate_waiting_time_score(wait_minutes: int) -> float:
    if wait_minutes <= 0:
        return 100
    elif wait_minutes >= 60:
        return 0
    else:
        return clamp(100 - (wait_minutes / 60) * 100)

def calculate_utilization_score(occupied_docks: int, total_docks: int) -> float:
    if total_docks == 0:
        return 0
    util = (occupied_docks / total_docks) * 100
    if util <= 50:
        return clamp(50 + (util / 50) * 50)
    elif util <= 80:
        return clamp(100 - (util - 50) * (20/30))
    else:
        return clamp(80 - (util - 80) * 4)

def check_load_type_compatibility(load_type: str, compatible_types: List[str]) -> float:
    if not compatible_types:
        return 100
    return 100 if load_type in compatible_types else 0

def calculate_deadline_safety_score(eta: datetime, deadline: datetime, unload_duration: int) -> float:
    finish = eta + timedelta(minutes=unload_duration)
    if finish > deadline:
        return 0
    buffer_minutes = (deadline - finish).total_seconds() / 60
    if buffer_minutes >= 60:
        return 100
    elif buffer_minutes <= 0:
        return 0
    else:
        return clamp((buffer_minutes / 60) * 100)

def calculate_utility_score(request: EvaluationRequest, warehouse):
    if warehouse.status != "ACTIVE":
        return {
            "utility_score": 0,
            "dock_availability_score": 0,
            "waiting_time_score": 0,
            "utilization_score": 0,
            "compatibility_score": 0,
            "deadline_safety_score": 0,
            "expected_wait_minutes": 0
        }
    eta_dt = parse_time(request.eta)
    deadline_dt = parse_time(request.delivery_deadline)
    occupied, free, wait = predict_dock_occupancy(eta_dt, warehouse.scheduled_trucks, warehouse.total_docks)

    dock_score = calculate_dock_availability_score(free, warehouse.total_docks)
    wait_score = calculate_waiting_time_score(wait)
    util_score = calculate_utilization_score(occupied, warehouse.total_docks)
    compat_score = check_load_type_compatibility(request.load_type, warehouse.compatible_load_types)
    deadline_score = calculate_deadline_safety_score(eta_dt, deadline_dt, request.unloading_duration)

    utility = (0.25 * dock_score +
               0.30 * wait_score +
               0.15 * util_score +
               0.10 * compat_score +
               0.20 * deadline_score)
    utility = clamp(utility)

    return {
        "utility_score": utility,
        "dock_availability_score": round(dock_score, 2),
        "waiting_time_score": round(wait_score, 2),
        "utilization_score": round(util_score, 2),
        "compatibility_score": round(compat_score, 2),
        "deadline_safety_score": round(deadline_score, 2),
        "expected_wait_minutes": wait
    }