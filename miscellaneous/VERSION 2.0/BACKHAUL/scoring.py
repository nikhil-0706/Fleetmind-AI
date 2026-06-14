from datetime import datetime, timedelta
from typing import Dict, List
from .models import TruckState, PendingDelivery, CandidatePickup, DistanceData

TRUCK_CAPACITY_TONS = 20
TRUCK_SPEED_KMPH = 50

def parse_time(time_str: str) -> datetime:
    return datetime.strptime(time_str, "%H:%M")

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def driving_hours_feasible(required_hours: float, truck: TruckState) -> bool:
    return required_hours <= truck.remaining_drive_hours

def score_delivery(delivery: PendingDelivery, truck: TruckState, distance_km: float) -> float:
    travel_hours = distance_km / TRUCK_SPEED_KMPH
    if not driving_hours_feasible(travel_hours, truck):
        return 0.0

    now = datetime.now()
    deadline = parse_time(delivery.delivery_deadline)
    remaining_sec = (deadline - now).total_seconds()
    if remaining_sec <= 0:
        return 0.0
    urgency = clamp((remaining_sec / 3600) / 8 * 100)

    max_distance = 500
    distance_score = clamp((1 - distance_km / max_distance) * 100)

    capacity_freed = clamp((delivery.load_weight / TRUCK_CAPACITY_TONS) * 100)

    score = 0.5 * urgency + 0.3 * distance_score + 0.2 * capacity_freed
    return clamp(score)

def score_pickup(pickup: CandidatePickup, truck: TruckState,
                 dist_to_pickup: float, pickup_to_drop: float) -> float:
    travel_to_pickup = dist_to_pickup / TRUCK_SPEED_KMPH
    travel_pickup_to_drop = pickup_to_drop / TRUCK_SPEED_KMPH
    total_travel = travel_to_pickup + travel_pickup_to_drop
    if not driving_hours_feasible(total_travel, truck):
        return 0.0

    now = datetime.now()
    pickup_deadline = parse_time(pickup.pickup_deadline)
    arrival = now + timedelta(hours=travel_to_pickup)
    if arrival > pickup_deadline:
        return 0.0

    earnings_diff = pickup.offered_rs_per_km - truck.preferred_rs_per_km
    earnings_score = clamp(50 + earnings_diff * 10)

    remaining_capacity = TRUCK_CAPACITY_TONS - truck.current_load_weight
    if remaining_capacity <= 0:
        return 0.0
    capacity_util = (pickup.load_weight / remaining_capacity) * 100
    capacity_score = clamp(capacity_util)

    max_distance = 200
    distance_penalty = clamp((1 - dist_to_pickup / max_distance) * 100)

    score = 0.4 * earnings_score + 0.3 * capacity_score + 0.3 * distance_penalty
    return clamp(score)

def score_wait() -> float:
    return 30.0

def score_return_empty() -> float:
    return 10.0

def score_relocate(distance_km: float, max_distance: float = 200) -> float:
    if distance_km <= 0:
        return 100
    return clamp((1 - distance_km / max_distance) * 100)

def evaluate_next_stop(request) -> Dict[str, float]:
    scores = {}
    truck = request.truck
    dist_data = request.distance_data

    # Score all pending deliveries
    for d in request.pending_deliveries:
        dist = dist_data.to_delivery_locations.get(d.drop_location)
        if dist is None:
            scores[f"deliver_{d.load_id}"] = 0.0
        else:
            scores[f"deliver_{d.load_id}"] = score_delivery(d, truck, dist)

    # Score all candidate pickups (even if pending deliveries exist)
    for p in request.candidate_pickups:
        dist_to_pickup = dist_data.to_pickup_locations.get(p.pickup_location)
        pickup_to_drop = dist_data.pickup_to_drop.get(p.pickup_location)
        if dist_to_pickup is None or pickup_to_drop is None:
            scores[f"pickup_{p.load_id}"] = 0.0
        else:
            scores[f"pickup_{p.load_id}"] = score_pickup(p, truck, dist_to_pickup, pickup_to_drop)

    # If no pending deliveries (truck empty), add wait, return_empty, and relocate actions
    if not request.pending_deliveries:
        scores["wait"] = score_wait()
        scores["return_empty"] = score_return_empty()
        for wh in request.candidate_relocation_warehouses:
            dist = dist_data.to_relocation_warehouses.get(wh, 999)
            scores[f"relocate_{wh}"] = score_relocate(dist)

    return scores