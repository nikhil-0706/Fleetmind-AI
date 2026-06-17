def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def score_continue() -> tuple:
    return ("continue", None, None, 50.0)

def score_pickup(load, truck, distance_from_current_node: float, detour_threshold: float) -> tuple:
    rate_diff = load['offered_rs_per_km'] - truck['preferred_rs_per_km']
    earnings_score = clamp(50 + rate_diff * 5)
    capacity_score = clamp((load['weight'] / truck['remaining_capacity']) * 100) if truck['remaining_capacity'] > 0 else 0
    if distance_from_current_node <= detour_threshold:
        distance_penalty = clamp(100 - (distance_from_current_node / detour_threshold) * 100)
    else:
        distance_penalty = 0
    score = clamp(0.4 * earnings_score + 0.3 * capacity_score + 0.3 * distance_penalty)
    return ("pickup", load['pickup_node_id'], load['load_id'], score)

def score_wait() -> tuple:
    return ("wait", None, None, 30.0)

def score_relocate(distance_to_warehouse_km: float, max_relocate_km: float = 100) -> tuple:
    if distance_to_warehouse_km <= 0:
        score = 100
    else:
        score = clamp((1 - distance_to_warehouse_km / max_relocate_km) * 100)
    # For relocate, no load_id, target_node is a warehouse node (to be selected by coordinator)
    return ("relocate", None, None, score)

def score_return_empty() -> tuple:
    return ("return_empty", None, None, 10.0)

def evaluate_next_actions(truck_state: dict, current_node_id: str, next_destination_node_id: str,
                          candidate_loads: list, distances: dict, detour_threshold: float) -> list:
    """
    Returns a list of possible actions, each as a tuple:
    (action_type, target_node_id, load_id, score)
    """
    actions = []
    actions.append(score_continue())
    actions.append(score_wait())
    actions.append(score_return_empty())
    # For relocate, coordinator will select best warehouse; we just return a generic relocate action
    actions.append(score_relocate(30.0))   # assume 30km to nearest warehouse

    for load in candidate_loads:
        dist_to_pickup = distances.get((current_node_id, load['pickup_node_id']), 1e9)
        if dist_to_pickup > detour_threshold * 2:
            continue
        actions.append(score_pickup(load, truck_state, dist_to_pickup, detour_threshold))
    
    # Also consider drop actions for already picked loads
    for load in truck_state.get('accepted_loads', []):
        if load.get('status') == 'picked_up':
            dist_to_drop = distances.get((current_node_id, load['drop_node_id']), 1e9)
            # Score drop: similar to pickup but with urgency factor
            urgency = 1.0  # simplified
            score = clamp(100 - (dist_to_drop / 100) * 100) * urgency
            actions.append(("drop", load['drop_node_id'], load['load_id'], score))
    
    return actions