from typing import List, Dict, Tuple
from ..models.domain import Truck, Load, Warehouse
from ..core.config import settings
from ..core.database import trucks_db

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def calculate_scarcity_boost(truck_id: str, load: dict, candidate_count: int) -> float:
    """
    Returns a scarcity boost score (0-100) for a load given the current truck and market.
    - truck_opportunity: higher when few candidate loads exist.
    - load_competition: higher when few other trucks can take this load.
    """
    # Truck opportunity: fewer candidate loads = higher urgency
    truck_opportunity = clamp(100 - (candidate_count - 1) * 25)

    # Count other trucks that could also take this load
    eligible_other_trucks = 0
    for other in trucks_db.values():
        if other.truck_id == truck_id:
            continue
        if other.status not in ["IDLE", "AT_NODE", "TRAVELING"]:
            continue
        if other.remaining_capacity < load.get('weight', 0):
            continue
        # For simplicity, we assume all other trucks are at a node (skip traveling)
        if other.status == "TRAVELING":
            continue
        if other.current_node_id is None:
            continue
        # Check distance (using graph.distance)
        from ..core.graph import graph
        dist = graph.distance(other.current_node_id, load.get('pickup_node_id'))
        if dist <= settings.NEARBY_RADIUS_KM * 2:
            eligible_other_trucks += 1

    load_competition = clamp(100 / (eligible_other_trucks + 1))
    return clamp((truck_opportunity + load_competition) / 2)

# ----- Truck Agent Scoring -----
def truck_utility_score(truck: Truck, load: Load, dist_to_pickup: float, dist_pickup_to_drop: float) -> float:
    earnings_margin = load.offered_rs_per_km - truck.preferred_rs_per_km
    earnings_score = clamp(50 + earnings_margin * 5)

    # More lenient capacity scoring
    remaining_capacity = truck.remaining_capacity
    if remaining_capacity <= 0:
        capacity_score = 0
    else:
        util = (load.weight / remaining_capacity) * 100
        # Score 0-100: 0% utilization → 0, 50% → 100, above 50% → 100
        capacity_score = clamp(util * 2) if util <= 50 else 100

    if dist_to_pickup > settings.DETOUR_THRESHOLD_KM:
        distance_score = 0
    else:
        distance_score = clamp(100 - (dist_to_pickup / settings.DETOUR_THRESHOLD_KM) * 100)

    score = 0.4 * earnings_score + 0.3 * capacity_score + 0.3 * distance_score
    return clamp(score)

# ----- Load Agent Scoring -----
def load_utility_score(truck: Truck, load: Load, dist_to_pickup: float, dist_pickup_to_drop: float) -> float:
    rate_diff = abs(truck.preferred_rs_per_km - load.offered_rs_per_km)
    rate_score = clamp(100 - (rate_diff / 20) * 100)

    # More lenient capacity scoring
    remaining_capacity = truck.remaining_capacity
    if remaining_capacity <= 0:
        capacity_score = 0
    else:
        util = (load.weight / remaining_capacity) * 100
        # Score 0-100: 0% utilization → 0, 50% → 100, above 50% → 100
        capacity_score = clamp(util * 2) if util <= 50 else 100

    if dist_to_pickup > settings.DETOUR_THRESHOLD_KM:
        reliability_score = 0
    else:
        reliability_score = clamp(100 - (dist_to_pickup / settings.DETOUR_THRESHOLD_KM) * 100)

    score = 0.35 * rate_score + 0.35 * capacity_score + 0.30 * reliability_score
    return clamp(score)

# ----- Warehouse Agent Scoring -----
def warehouse_utility_score(
    warehouse: Warehouse,
    load_type: str,
    eta_minutes: int,
    unloading_duration: int,
    deadline_minutes: int
) -> dict:
    if warehouse.status != "ACTIVE":
        return {"utility_score": 0, "dock_availability_score": 0, "waiting_time_score": 0,
                "utilization_score": 0, "compatibility_score": 0, "deadline_safety_score": 0,
                "expected_wait_minutes": 0, "assigned_dock": None}
    total_docks = settings.WAREHOUSE_DOCK_COUNT
    occupied = 0
    intervals = []
    for st in warehouse.scheduled_trucks:
        h, m = map(int, st.eta.split(':'))
        start = h * 60 + m
        end = start + st.unloading_duration
        intervals.append((start, end))
        if start <= eta_minutes < end:
            occupied += 1
    free = max(0, total_docks - occupied)
    if free == 0:
        future_ends = [end for start, end in intervals if end > eta_minutes]
        if future_ends:
            wait = min(future_ends) - eta_minutes
        else:
            wait = 30
    else:
        wait = 0
    dock_score = clamp((free / total_docks) * 100)
    wait_score = clamp(100 - (wait / 60) * 100)
    util_score = clamp((1 - (free / total_docks)) * 100)
    compatibility_score = 100 if (not warehouse.compatible_load_types or load_type in warehouse.compatible_load_types) else 0
    finish = eta_minutes + unloading_duration
    if finish > deadline_minutes:
        deadline_score = 0
    else:
        buffer = deadline_minutes - finish
        deadline_score = clamp((buffer / 60) * 100)
    utility = 0.25 * dock_score + 0.30 * wait_score + 0.15 * util_score + 0.10 * compatibility_score + 0.20 * deadline_score
    utility = clamp(utility)
    assigned_dock = None
    if utility > 50:
        used_docks = [st.dock_number for st in warehouse.scheduled_trucks]
        for d in range(1, total_docks + 1):
            if d not in used_docks:
                assigned_dock = d
                break
    return {
        "utility_score": utility,
        "dock_availability_score": round(dock_score, 2),
        "waiting_time_score": round(wait_score, 2),
        "utilization_score": round(util_score, 2),
        "compatibility_score": round(compatibility_score, 2),
        "deadline_safety_score": round(deadline_score, 2),
        "expected_wait_minutes": wait,
        "assigned_dock": assigned_dock
    }

# ----- Backhaul Agent Scoring (with scarcity) -----
# ----- Backhaul Agent Scoring -----
# ----- Backhaul Agent Scoring -----
def backhaul_scoring(
    truck_state: dict,
    current_node_id: str,
    candidate_loads: List[dict]
) -> List[tuple]:
    actions = []
    detour_threshold = settings.DETOUR_THRESHOLD_KM

    # --- continue and wait are now negative so drops always win ---
    actions.append(("continue", None, None, -1.0))
    actions.append(("wait", None, None, -2.0))

    num_candidates = len(candidate_loads)

    # 1. Pickup actions for new candidate loads
    for load in candidate_loads:
        dist = truck_state.get('distances', {}).get((current_node_id, load['pickup_node_id']), 1e9)
        if dist > detour_threshold * 2:
            continue

        rate_diff = load['offered_rs_per_km'] - truck_state['preferred_rs_per_km']
        earnings_score = clamp(50 + rate_diff * 5)
        remaining = truck_state['remaining_capacity']
        if remaining > 0:
            util = (load['weight'] / remaining) * 100
            capacity_score = clamp(util * 2) if util <= 50 else 100
        else:
            capacity_score = 0
        distance_score = clamp(100 - (dist / detour_threshold) * 100) if dist <= detour_threshold else 0

        pickup_score = clamp(0.4 * earnings_score + 0.3 * capacity_score + 0.3 * distance_score)
        scarcity_boost = calculate_scarcity_boost(
            truck_state.get('truck_id', 'unknown'),
            load,
            num_candidates
        )
        final_score = 0.7 * pickup_score + 0.3 * scarcity_boost
        actions.append(("pickup", load['pickup_node_id'], load['load_id'], final_score))

    # 2. Pickup actions for already accepted loads (still pending)
    for load in truck_state.get('accepted_loads', []):
        if load.get('status') == 'pending':
            dist = truck_state.get('distances', {}).get((current_node_id, load['pickup_node_id']), 1e9)
            if dist > detour_threshold * 2:
                continue
            rate_diff = load['offered_rs_per_km'] - truck_state['preferred_rs_per_km']
            earnings_score = clamp(50 + rate_diff * 5)
            remaining = truck_state['remaining_capacity']
            if remaining > 0:
                util = (load['weight'] / (remaining + load['weight'])) * 100
                capacity_score = clamp(util * 2) if util <= 50 else 100
            else:
                capacity_score = 0
            distance_score = clamp(100 - (dist / detour_threshold) * 100) if dist <= detour_threshold else 0
            score = clamp(0.4 * earnings_score + 0.3 * capacity_score + 0.3 * distance_score)
            actions.append(("pickup", load['pickup_node_id'], load['load_id'], score))

    # 3. Drop actions for picked-up loads (with fallback distance)
    from ..core.graph import graph
    for load in truck_state.get('accepted_loads', []):
        if load.get('status') == 'picked_up':
            # Try to get distance from precomputed dict, fallback to graph.distance
            dist = truck_state.get('distances', {}).get((current_node_id, load['drop_node_id']))
            if dist is None or dist >= 1e9:
                dist = graph.distance(current_node_id, load['drop_node_id'])
            urgency = 1.0
            # Raw score: 100 - distance/100, clamped to 0-100
            score = clamp(100 - (dist / 100) * 100) * urgency
            # No artificial minimum – this score will be > -1, so it beats continue
            actions.append(("drop", load['drop_node_id'], load['load_id'], score))

    # Debug: print all actions with scores
    print(f"📊 Backhaul actions: {[(a[0], a[1], a[2], round(a[3], 2)) for a in actions]}")

    return actions