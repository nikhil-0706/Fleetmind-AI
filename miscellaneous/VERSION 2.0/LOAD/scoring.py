from datetime import datetime, timedelta

TRUCK_CAPACITY_TONS = 20
TRUCK_SPEED_KMPH = 50

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def feasibility_checks(truck, load):
    # Can reach pickup?
    travel_hours = truck.distance_to_pickup / TRUCK_SPEED_KMPH
    avail_time = parse_time(truck.available_from_time)
    pickup_time = parse_time(load.pickup_time)
    arrival = avail_time + timedelta(hours=travel_hours)
    if arrival > pickup_time:
        return False, "Cannot reach pickup on time"

    # Capacity
    remaining = TRUCK_CAPACITY_TONS - truck.current_load_weight
    if load.load_weight > remaining:
        return False, "Load weight exceeds capacity"

    # Driving hours
    total_dist = truck.distance_to_pickup + truck.distance_pickup_to_drop
    required_time = total_dist / TRUCK_SPEED_KMPH
    if required_time > truck.remaining_drive_hours:
        return False, "Insufficient drive hours"

    return True, "Feasible"

def calculate_pickup_reliability(truck, load):
    travel_hours = truck.distance_to_pickup / TRUCK_SPEED_KMPH
    avail_time = parse_time(truck.available_from_time)
    pickup_time = parse_time(load.pickup_time)
    arrival = avail_time + timedelta(hours=travel_hours)
    buffer_minutes = (pickup_time - arrival).total_seconds() / 60
    score = clamp((buffer_minutes / 60) * 100)
    return score

def calculate_earnings_compatibility(truck, load):
    diff = abs(truck.preferred_rs_per_km - load.offered_rs_per_km)
    score = clamp(100 - (diff / 20) * 100)
    return score

def calculate_capacity_utilization_match(truck, load):
    remaining = TRUCK_CAPACITY_TONS - truck.current_load_weight
    if remaining <= 0:
        return 0
    util = (load.load_weight / remaining) * 100
    if util >= 80:
        return 100
    elif util <= 20:
        return 20
    else:
        return util

def calculate_earliest_pickup_advantage(truck, load):
    travel_hours = truck.distance_to_pickup / TRUCK_SPEED_KMPH
    avail_time = parse_time(truck.available_from_time)
    arrival = avail_time + timedelta(hours=travel_hours)
    now = datetime.now()
    pickup_time = parse_time(load.pickup_time)
    total_window = (pickup_time - now).total_seconds()
    if total_window <= 0:
        return 0
    time_remaining = (pickup_time - arrival).total_seconds()
    if time_remaining < 0:
        return 0
    score = (time_remaining / total_window) * 100
    return clamp(score)

def get_decision(score: float) -> str:
    if score >= 80:
        return "HIGHLY_ATTRACTIVE"
    elif score >= 60:
        return "ACCEPTABLE"
    elif score >= 40:
        return "WEAK_MATCH"
    else:
        return "REJECT"

def calculate_utility_score(truck, load):
    feasible, reason = feasibility_checks(truck, load)
    if not feasible:
        return {
            "feasibility_score": 0,
            "pickup_reliability_score": 0,
            "earnings_compatibility_score": 0,
            "capacity_utilization_match_score": 0,
            "earliest_pickup_advantage_score": 0,
            "utility_score": 0,
            "decision": "REJECT"
        }
    pickup_rel = calculate_pickup_reliability(truck, load)
    earnings_comp = calculate_earnings_compatibility(truck, load)
    capacity_match = calculate_capacity_utilization_match(truck, load)
    earliest_adv = calculate_earliest_pickup_advantage(truck, load)

    utility = (0.35 * pickup_rel +
               0.25 * earnings_comp +
               0.25 * capacity_match +
               0.15 * earliest_adv)
    utility = clamp(utility)

    return {
        "feasibility_score": 100,
        "pickup_reliability_score": round(pickup_rel, 2),
        "earnings_compatibility_score": round(earnings_comp, 2),
        "capacity_utilization_match_score": round(capacity_match, 2),
        "earliest_pickup_advantage_score": round(earliest_adv, 2),
        "utility_score": round(utility, 2),
        "decision": get_decision(utility)
    }