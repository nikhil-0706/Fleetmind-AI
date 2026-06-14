from datetime import datetime, timedelta
from common.config import TRUCK_SPEED_KMPH, TRUCK_CAPACITY_TONS

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def calculate_pickup_reachability(truck, load, dist_to_pickup):
    travel_hours = dist_to_pickup / TRUCK_SPEED_KMPH
    avail_time = parse_time(truck['available_from_time'])
    pickup_time = parse_time(load['pickup_time'])
    arrival = avail_time + timedelta(hours=travel_hours)
    return 100 if arrival <= pickup_time else 0

def calculate_earnings_score(truck, load):
    margin = load['offered_rs_per_km'] - truck['preferred_rs_per_km']
    return clamp(70 + margin * 2)

def calculate_capacity_utilization(truck, load):
    remaining = TRUCK_CAPACITY_TONS - truck['current_load_weight']
    if remaining <= 0:
        return 0
    return clamp((load['weight'] / remaining) * 100)

def calculate_driving_hours_feasibility(truck, dist_to_pickup, dist_pickup_to_drop):
    total_dist = dist_to_pickup + dist_pickup_to_drop
    required_time = total_dist / TRUCK_SPEED_KMPH
    if truck['remaining_drive_hours'] <= 0:
        return 0
    return clamp(((truck['remaining_drive_hours'] - required_time) / truck['remaining_drive_hours']) * 100)

def calculate_utility_score(truck, load, dist_to_pickup, dist_pickup_to_drop):
    reach = calculate_pickup_reachability(truck, load, dist_to_pickup)
    earn = calculate_earnings_score(truck, load)
    cap = calculate_capacity_utilization(truck, load)
    drive = calculate_driving_hours_feasibility(truck, dist_to_pickup, dist_pickup_to_drop)
    return clamp(0.35 * reach + 0.30 * earn + 0.20 * cap + 0.15 * drive)