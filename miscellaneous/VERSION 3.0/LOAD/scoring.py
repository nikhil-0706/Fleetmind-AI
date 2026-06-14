from datetime import datetime, timedelta
from common.config import TRUCK_SPEED_KMPH, MIN_RATE, MAX_RATE

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def calculate_feasibility_score(truck, load, dist_to_pickup, dist_pickup_to_drop):
    # Simplified: checks if truck can reach pickup on time
    travel_hours = dist_to_pickup / TRUCK_SPEED_KMPH
    avail_time = parse_time(truck['available_from_time'])
    pickup_time = parse_time(load['pickup_time'])
    arrival = avail_time + timedelta(hours=travel_hours)
    if arrival > pickup_time:
        return 0
    return 100

def calculate_earnings_compatibility(truck, load):
    diff = abs(truck['preferred_rs_per_km'] - load['offered_rs_per_km'])
    score = clamp(100 - (diff / 20) * 100)
    return score

def calculate_capacity_match(truck, load):
    remaining = truck['remaining_capacity']
    if remaining <= 0:
        return 0
    util = (load['weight'] / remaining) * 100
    if util >= 80:
        return 100
    elif util <= 20:
        return 20
    else:
        return util

def calculate_pickup_reliability(truck, load, dist_to_pickup):
    travel_hours = dist_to_pickup / TRUCK_SPEED_KMPH
    avail_time = parse_time(truck['available_from_time'])
    pickup_time = parse_time(load['pickup_time'])
    arrival = avail_time + timedelta(hours=travel_hours)
    buffer_minutes = (pickup_time - arrival).total_seconds() / 60
    return clamp((buffer_minutes / 60) * 100)

def calculate_utility_score(truck, load, dist_to_pickup, dist_pickup_to_drop):
    feas = calculate_feasibility_score(truck, load, dist_to_pickup, dist_pickup_to_drop)
    if feas == 0:
        return 0.0
    earnings = calculate_earnings_compatibility(truck, load)
    capacity = calculate_capacity_match(truck, load)
    reliability = calculate_pickup_reliability(truck, load, dist_to_pickup)
    utility = 0.25 * feas + 0.35 * earnings + 0.20 * capacity + 0.20 * reliability
    return clamp(utility)