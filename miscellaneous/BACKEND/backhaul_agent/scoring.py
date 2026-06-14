def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def score_continue() -> float:
    return 50.0

def score_pickup(load, truck, distance_from_current_node: float) -> float:
    rate_diff = load['offered_rs_per_km'] - truck['preferred_rs_per_km']
    earnings_score = clamp(50 + rate_diff * 5)
    capacity_score = clamp((load['weight'] / truck['remaining_capacity']) * 100) if truck['remaining_capacity'] > 0 else 0
    distance_penalty = clamp(100 - (distance_from_current_node / 50) * 100)
    return clamp(0.4 * earnings_score + 0.3 * capacity_score + 0.3 * distance_penalty)

def score_wait() -> float:
    return 30.0

def score_relocate(distance_to_warehouse_km: float) -> float:
    if distance_to_warehouse_km <= 0:
        return 100
    return clamp((1 - distance_to_warehouse_km / 100) * 100)

def score_return_empty() -> float:
    return 10.0

def evaluate_next_actions(truck_state: dict, current_node_id: str, next_destination_node_id: str,
                          candidate_loads: list, distances: dict) -> dict:
    scores = {}
    scores["continue"] = score_continue()
    scores["wait"] = score_wait()
    scores["return_empty"] = score_return_empty()
    scores["relocate"] = score_relocate(30.0)
    for load in candidate_loads:
        dist_to_pickup = distances.get((current_node_id, load['pickup_node_id']), 1e9)
        if dist_to_pickup > 100:
            continue
        scores[f"pickup_{load['load_id']}"] = score_pickup(load, truck_state, dist_to_pickup)
    return scores