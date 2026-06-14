from common.config import DEFAULT_TRUCK_SPEED_KMPH, DETOUR_THRESHOLD_KM

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def calculate_utility_score(truck: dict, load: dict, dist_to_pickup: float, dist_pickup_to_drop: float) -> float:
    """
    Load‑side utility score (0‑100). Factors:
    - Rate compatibility (abs difference from preferred)
    - Capacity match (load fits well)
    - Reliability (distance based)
    """
    rate_diff = abs(truck['preferred_rs_per_km'] - load['offered_rs_per_km'])
    rate_score = clamp(100 - (rate_diff / 20) * 100)

    remaining_capacity = truck['remaining_capacity']
    if remaining_capacity <= 0:
        capacity_score = 0
    else:
        util = (load['weight'] / remaining_capacity) * 100
        # Ideal match when load uses 80‑100% of remaining capacity
        if util >= 80:
            capacity_score = 100
        elif util <= 20:
            capacity_score = 20
        else:
            capacity_score = util

    # Reliability: shorter pickup distance better
    reliability_score = clamp(100 - (dist_to_pickup / DETOUR_THRESHOLD_KM) * 100) if dist_to_pickup <= DETOUR_THRESHOLD_KM else 0

    score = 0.35 * rate_score + 0.35 * capacity_score + 0.30 * reliability_score
    return clamp(score)