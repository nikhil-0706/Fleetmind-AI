from datetime import datetime, timedelta
from typing import Tuple

TRUCK_CAPACITY_TONS = 20  # must match Truck Agent's constant
TRUCK_SPEED_KMPH = 50

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def feasibility_checks(truck, load, distance_to_pickup, distance_pickup_to_drop) -> Tuple[bool, str]:
    # 1. Can truck reach pickup on time?
    travel_hours = distance_to_pickup / TRUCK_SPEED_KMPH
    available_time = parse_time(truck.available_from_time)
    pickup_time = parse_time(load.pickup_time)
    arrival_time = available_time + timedelta(hours=travel_hours)
    if arrival_time > pickup_time:
        return False, "Cannot reach pickup before pickup_time"

    # 2. Can truck carry load weight?
    remaining_capacity = TRUCK_CAPACITY_TONS - truck.current_load_weight
    if load.load_weight > remaining_capacity:
        return False, "Load weight exceeds remaining truck capacity"

    # 3. Enough driving hours?
    total_distance = distance_to_pickup + distance_pickup_to_drop
    required_drive_time = total_distance / TRUCK_SPEED_KMPH
    if required_drive_time > truck.remaining_drive_hours:
        return False, "Not enough remaining drive hours"

    return True, "Feasible"

def calculate_pickup_reliability(truck, load, distance_to_pickup):
    """
    How comfortably can the truck reach pickup before deadline?
    Higher score for earlier arrival (more buffer).
    """
    travel_hours = distance_to_pickup / TRUCK_SPEED_KMPH
    available_time = parse_time(truck.available_from_time)
    pickup_time = parse_time(load.pickup_time)
    arrival_time = available_time + timedelta(hours=travel_hours)
    buffer_minutes = (pickup_time - arrival_time).total_seconds() / 60.0
    # Buffer > 60 minutes -> 100, buffer <= 0 -> 0, linear in between
    score = clamp((buffer_minutes / 60) * 100)
    return score

def calculate_earnings_compatibility(truck, load):
    """
    Closer preferred_rs_per_km to offered_rs_per_km gives higher score.
    """
    diff = abs(truck.preferred_rs_per_km - load.offered_rs_per_km)
    # Max diff considered 20 Rs/km -> score 0
    score = clamp(100 - (diff / 20) * 100)
    return score

def calculate_capacity_utilization_match(truck, load):
    """
    How well does load fill remaining capacity?
    Ideal fill is 80-100% -> score 100. Too low or too high penalized.
    """
    remaining = TRUCK_CAPACITY_TONS - truck.current_load_weight
    if remaining <= 0:
        return 0
    utilization = (load.load_weight / remaining) * 100
    if utilization >= 80:
        return 100
    elif utilization <= 20:
        return 20
    else:
        return utilization  # linear

def calculate_earliest_pickup_advantage(truck, load, distance_to_pickup):
    """
    Among feasible trucks, earlier pickup time gives higher score.
    Since this is a single evaluation, we need a reference.
    We'll use a baseline: ideal pickup is now + 2 hours. Score based on how close arrival is to ideal.
    Simpler: higher score for earlier arrival (less waiting for load).
    We'll use the inverse of arrival_time (earlier = higher).
    """
    travel_hours = distance_to_pickup / TRUCK_SPEED_KMPH
    available_time = parse_time(truck.available_from_time)
    arrival_time = available_time + timedelta(hours=travel_hours)
    # Reference: earliest possible arrival is now, latest is pickup_time.
    now = datetime.now()
    # Convert arrival_time to today's date for comparison
    arrival_today = arrival_time.replace(year=now.year, month=now.month, day=now.day)
    if arrival_today < now:
        arrival_today = now
    total_window = (parse_time(load.pickup_time) - now).total_seconds()
    if total_window <= 0:
        return 100  # already late? but feasibility should have prevented
    time_remaining = (parse_time(load.pickup_time) - arrival_today).total_seconds()
    if time_remaining < 0:
        return 0
    score = (time_remaining / total_window) * 100
    return clamp(score)

def get_decision(utility_score: float) -> str:
    if utility_score >= 80:
        return "HIGHLY_ATTRACTIVE"
    elif utility_score >= 60:
        return "ACCEPTABLE"
    elif utility_score >= 40:
        return "WEAK_MATCH"
    else:
        return "REJECT"

def calculate_utility_score(truck, load, distance_to_pickup, distance_pickup_to_drop):
    # Hard feasibility first
    feasible, reason = feasibility_checks(truck, load, distance_to_pickup, distance_pickup_to_drop)
    if not feasible:
        return {
            "feasibility_score": 0,
            "pickup_reliability_score": 0,
            "earnings_compatibility_score": 0,
            "capacity_utilization_match_score": 0,
            "earliest_pickup_advantage_score": 0,
            "utility_score": 0,
            "decision": "REJECT",
            "reason": reason
        }

    pickup_rel = calculate_pickup_reliability(truck, load, distance_to_pickup)
    earnings_comp = calculate_earnings_compatibility(truck, load)
    capacity_match = calculate_capacity_utilization_match(truck, load)
    earliest_adv = calculate_earliest_pickup_advantage(truck, load, distance_to_pickup)

    # Weights (tentative, can be adjusted)
    utility = (0.35 * pickup_rel +
               0.25 * earnings_comp +
               0.25 * capacity_match +
               0.15 * earliest_adv)
    utility = round(clamp(utility), 2)

    return {
        "feasibility_score": 100,
        "pickup_reliability_score": round(pickup_rel, 2),
        "earnings_compatibility_score": round(earnings_comp, 2),
        "capacity_utilization_match_score": round(capacity_match, 2),
        "earliest_pickup_advantage_score": round(earliest_adv, 2),
        "utility_score": utility,
        "decision": get_decision(utility),
        "reason": reason
    }