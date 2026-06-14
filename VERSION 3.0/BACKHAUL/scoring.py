from typing import Dict, List, Optional
from common.config import TRUCK_SPEED_KMPH, DETOUR_THRESHOLD_KM

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def score_continue(current_plan_score: float = 50.0) -> float:
    # Baseline score for continuing as planned
    return 50.0

def score_pickup(load, truck, distance_from_current_node: float, graph_distance_to_next_dest: float) -> float:
    # Simplified: higher rate and good capacity match gives higher score
    rate_diff = load['offered_rs_per_km'] - truck['preferred_rs_per_km']
    earnings_score = clamp(50 + rate_diff * 5)
    capacity_score = clamp((load['weight'] / truck['remaining_capacity']) * 100) if truck['remaining_capacity'] > 0 else 0
    # Penalise if pickup is far from current node
    distance_penalty = clamp(100 - (distance_from_current_node / 50) * 100)
    # Also consider detour relative to next destination
    detour_penalty = clamp(100 - (graph_distance_to_next_dest / 20) * 100) if graph_distance_to_next_dest else 100
    utility = 0.3 * earnings_score + 0.2 * capacity_score + 0.25 * distance_penalty + 0.25 * detour_penalty
    return clamp(utility)

def score_wait() -> float:
    return 30.0

def score_relocate(distance_to_warehouse_km: float, max_distance: float = 100) -> float:
    if distance_to_warehouse_km <= 0:
        return 100
    return clamp((1 - distance_to_warehouse_km / max_distance) * 100)

def score_return_empty() -> float:
    return 10.0

def evaluate_next_actions(truck_state: dict, current_node_id: str, next_destination_node_id: str,
                          candidate_loads: List[dict], distances: Dict[tuple, float]) -> Dict[str, float]:
    scores = {}
    # Continue as planned
    scores["continue"] = score_continue()
    # Wait
    scores["wait"] = score_wait()
    # Return empty
    scores["return_empty"] = score_return_empty()
    # Relocate to nearby warehouses (simplified: just a placeholder)
    scores["relocate"] = score_relocate(30.0)  # example distance
    # Score each candidate pickup
    for load in candidate_loads:
        # distances: (current_node, pickup_node), (pickup_node, next_destination)
        dist_to_pickup = distances.get((current_node_id, load['pickup_node_id']), 1e9)
        dist_pickup_to_next = distances.get((load['pickup_node_id'], next_destination_node_id), 1e9)
        if dist_to_pickup > 100:  # too far, skip
            continue
        pickup_score = score_pickup(load, truck_state, dist_to_pickup, dist_pickup_to_next)
        scores[f"pickup_{load['load_id']}"] = pickup_score
    return scores