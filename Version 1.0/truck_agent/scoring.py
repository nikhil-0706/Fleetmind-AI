from datetime import datetime, timedelta

TRUCK_CAPACITY_TONS = 20
TRUCK_SPEED_KMPH = 50

def clamp(value: float, min_value: float = 0, max_value: float = 100) -> float:
    return max(min_value, min(value, max_value))

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def calculate_pickup_reachability_score(truck, load, distance_data):
    travel_time_hours = distance_data.distance_to_pickup / TRUCK_SPEED_KMPH
    available_time = parse_time(truck.available_from_time)
    pickup_time = parse_time(load.pickup_time)
    arrival_time = available_time + timedelta(hours=travel_time_hours)
    score = 100 if arrival_time <= pickup_time else 0
    return score, arrival_time.strftime("%H:%M")

def calculate_earnings_score(truck, load):
    margin = load.offered_rs_per_km - truck.preferred_rs_per_km
    score = 70 + (margin * 2)
    return clamp(score)

def calculate_capacity_utilization_score(truck, load):
    remaining_capacity = TRUCK_CAPACITY_TONS - truck.current_load_weight
    if remaining_capacity <= 0:
        return 0
    score = (load.load_weight / remaining_capacity) * 100
    return clamp(score)

def calculate_driving_hours_feasibility_score(truck, distance_data):
    total_distance = distance_data.distance_to_pickup + distance_data.distance_pickup_to_drop
    required_drive_time = total_distance / TRUCK_SPEED_KMPH
    if truck.remaining_drive_hours <= 0:
        return 0
    score = ((truck.remaining_drive_hours - required_drive_time) / truck.remaining_drive_hours) * 100
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

def calculate_utility_score(truck, load, distance_data):
    pickup_score, arrival_time = calculate_pickup_reachability_score(truck, load, distance_data)
    earnings_score = calculate_earnings_score(truck, load)
    capacity_score = calculate_capacity_utilization_score(truck, load)
    driving_score = calculate_driving_hours_feasibility_score(truck, distance_data)
    utility_score = 0.35 * pickup_score + 0.30 * earnings_score + 0.20 * capacity_score + 0.15 * driving_score
    utility_score = round(utility_score, 2)
    return {
        "truck_id": truck.truck_id,
        "load_id": load.load_id,
        "arrival_time_at_pickup": arrival_time,
        "pickup_reachability_score": round(pickup_score, 2),
        "earnings_score": round(earnings_score, 2),
        "capacity_utilization_score": round(capacity_score, 2),
        "driving_hours_feasibility_score": round(driving_score, 2),
        "utility_score": utility_score,
        "decision": get_decision(utility_score),
    }