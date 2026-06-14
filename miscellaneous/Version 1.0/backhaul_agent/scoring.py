from datetime import datetime, timedelta
from typing import Dict, List
from models import TruckState, PendingDelivery, CandidatePickup, DistanceData

TRUCK_CAPACITY_TONS = 20
TRUCK_SPEED_KMPH = 50

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

# ----- Utility for driving hours feasibility
def driving_hours_feasible(required_hours: float, truck: TruckState) -> bool:
    return required_hours <= truck.remaining_drive_hours

# ----- Scoring for a delivery (existing load)
def score_delivery(delivery: PendingDelivery, truck: TruckState,
                   distance_km: float) -> float:
    # Feasibility: check if enough drive hours to reach drop
    travel_hours = distance_km / TRUCK_SPEED_KMPH
    if not driving_hours_feasible(travel_hours, truck):
        return 0.0

    # Urgency: time remaining to deadline
    now = datetime.now()
    deadline = parse_time(delivery.delivery_deadline)
    remaining_seconds = (deadline - now).total_seconds()
    if remaining_seconds <= 0:
        return 0.0
    urgency = clamp((remaining_seconds / 3600) / 8 * 100)  # 8 hours = 100

    # Distance efficiency: shorter distance = higher score
    max_distance = 500  # km considered worst
    distance_score = clamp((1 - distance_km / max_distance) * 100)

    # Capacity freed: larger load = more valuable to free space
    capacity_freed_score = clamp((delivery.load_weight / TRUCK_CAPACITY_TONS) * 100)

    # Weighted combination (urgency 0.4, distance 0.3, freed capacity 0.3)
    score = 0.4 * urgency + 0.3 * distance_score + 0.3 * capacity_freed_score
    return clamp(score)

# ----- Scoring for a candidate pickup
def score_pickup(pickup: CandidatePickup, truck: TruckState,
                 distance_to_pickup: float,
                 pickup_to_drop_distance: float) -> float:
    # Feasibility checks
    travel_to_pickup = distance_to_pickup / TRUCK_SPEED_KMPH
    travel_pickup_to_drop = pickup_to_drop_distance / TRUCK_SPEED_KMPH
    total_travel = travel_to_pickup + travel_pickup_to_drop
    if not driving_hours_feasible(total_travel, truck):
        return 0.0

    # Pickup deadline feasibility
    now = datetime.now()
    pickup_deadline = parse_time(pickup.pickup_deadline)
    arrival = now + timedelta(hours=travel_to_pickup)
    if arrival > pickup_deadline:
        return 0.0

    # Earnings: compare offered rate with preferred
    earnings_diff = pickup.offered_rs_per_km - truck.preferred_rs_per_km
    earnings_score = clamp(50 + earnings_diff * 10)

    # Capacity fit: how well load fits remaining capacity
    remaining_capacity = TRUCK_CAPACITY_TONS - truck.current_load_weight
    if remaining_capacity <= 0:
        return 0.0
    capacity_util = (pickup.load_weight / remaining_capacity) * 100
    capacity_score = clamp(capacity_util)

    # Distance penalty: longer detour vs ideal (ideal = 0 km detour)
    # For simplicity, use distance to pickup as penalty (shorter is better)
    max_distance = 200  # km
    distance_penalty = clamp((1 - distance_to_pickup / max_distance) * 100)

    # Weighted: earnings 0.4, capacity 0.3, distance 0.3
    score = 0.4 * earnings_score + 0.3 * capacity_score + 0.3 * distance_penalty
    return clamp(score)

# ----- Main evaluation function
def evaluate_next_stop(request) -> Dict[str, float]:
    scores = {}
    truck = request.truck
    dist_data = request.distance_data

    # Score each pending delivery
    for delivery in request.pending_deliveries:
        drop_loc = delivery.drop_location
        distance = dist_data.to_delivery_locations.get(drop_loc)
        if distance is None:
            # If distance not provided, assume infeasible
            scores[f"deliver_{delivery.load_id}"] = 0.0
        else:
            scores[f"deliver_{delivery.load_id}"] = score_delivery(delivery, truck, distance)

    # Score each candidate pickup
    for pickup in request.candidate_pickups:
        pickup_loc = pickup.pickup_location
        dist_to_pickup = dist_data.to_pickup_locations.get(pickup_loc)
        pickup_to_drop = dist_data.pickup_to_drop.get(pickup_loc)
        if dist_to_pickup is None or pickup_to_drop is None:
            scores[f"pickup_{pickup.load_id}"] = 0.0
        else:
            scores[f"pickup_{pickup.load_id}"] = score_pickup(pickup, truck,
                                                               dist_to_pickup,
                                                               pickup_to_drop)
    return scores