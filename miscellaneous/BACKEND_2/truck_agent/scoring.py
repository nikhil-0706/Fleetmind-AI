from common.config import DEFAULT_TRUCK_SPEED_KMPH, DETOUR_THRESHOLD_KM

def clamp(value: float, min_val: float = 0, max_val: float = 100) -> float:
    return max(min_val, min(value, max_val))

def calculate_utility_score(truck: dict, load: dict, dist_to_pickup: float, dist_pickup_to_drop: float) -> float:
    """
    Truck‑side utility score (0‑100). Factors:
    - Earnings margin (offered_rate - preferred_rate)
    - Capacity utilization (load weight / remaining capacity)
    - Distance penalty (detour cost)
    """
    earnings_margin = load['offered_rs_per_km'] - truck['preferred_rs_per_km']
    earnings_score = clamp(50 + earnings_margin * 5)   # 0 if margin <= -10, 100 if >=10

    remaining_capacity = truck['remaining_capacity']
    if remaining_capacity <= 0:
        capacity_score = 0
    else:
        util = (load['weight'] / remaining_capacity) * 100
        capacity_score = clamp(util)

    # Distance penalty: assume ideal detour threshold = DETOUR_THRESHOLD_KM
    if dist_to_pickup > DETOUR_THRESHOLD_KM:
        distance_score = 0
    else:
        distance_score = clamp(100 - (dist_to_pickup / DETOUR_THRESHOLD_KM) * 100)

    # Weighted sum
    score = 0.4 * earnings_score + 0.3 * capacity_score + 0.3 * distance_score
    return clamp(score)