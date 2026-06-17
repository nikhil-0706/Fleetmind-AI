import math
from datetime import datetime, timedelta
import asyncio
from ..core.database import *
from ..core.graph import graph
from ..core.config import settings
from ..models.domain import Proposal
from ..utils.helpers import generate_id
from ..utils.logger import log_event
from .scoring import truck_utility_score, load_utility_score, calculate_scarcity_boost

def _get_current_position(truck):
    """Return (x, y) tuple for truck's interpolated position if traveling, else None."""
    if truck.status == "TRAVELING" and truck.current_edge_id and truck.progress_km is not None:
        edge = graph.edges.get(truck.current_edge_id)
        if edge:
            from_node = graph.nodes.get(edge.from_node)
            to_node = graph.nodes.get(edge.to_node)
            if from_node and to_node:
                fraction = min(truck.progress_km / edge.distance_km, 1)
                x = from_node.x + (to_node.x - from_node.x) * fraction
                y = from_node.y + (to_node.y - from_node.y) * fraction
                return (x, y)
    return None

async def match_for_truck(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        print(f"❌ match_for_truck: truck {truck_id} not found")
        return
    print(f"🔍 match_for_truck: truck {truck_id} status={truck.status}, current_node={truck.current_node_id}")

    # Allow IDLE, AT_NODE, and TRAVELING
    if truck.status not in ["IDLE", "AT_NODE", "TRAVELING"]:
        print(f"⏭️ Truck {truck_id} status {truck.status} not eligible")
        return

    # Get current position for distance calculation
    current_pos = _get_current_position(truck) if truck.status == "TRAVELING" else None
    current_node_id = truck.current_node_id if truck.status != "TRAVELING" else None

    candidates = []  # list of (load, distance)
    for load in loads_db.values():
        if load.status != "PENDING":
            continue
        if load.weight > truck.remaining_capacity:
            continue

        if current_pos:
            dist = graph.euclidean_distance_to_node(current_pos[0], current_pos[1], load.pickup_node_id)
        else:
            if current_node_id is None:
                continue
            dist = graph.distance(current_node_id, load.pickup_node_id)

        print(f"📏 Load {load.load_id} distance: {dist} km")
        if dist > settings.NEARBY_RADIUS_KM * 2:
            print(f"⏭️ Load {load.load_id} distance {dist} > {settings.NEARBY_RADIUS_KM * 2}")
            continue
        candidates.append((load, dist))

    print(f"✅ Found {len(candidates)} candidate loads")
    if not candidates:
        return

    scored = []
    num_candidates = len(candidates)

    for load, dist_pickup in candidates:
        # Original scoring
        dist_drop = graph.distance(load.pickup_node_id, load.drop_node_id)
        truck_score = truck_utility_score(truck, load, dist_pickup, dist_drop)
        load_score = load_utility_score(truck, load, dist_pickup, dist_drop)
        avg_score = (truck_score + load_score) / 2

        # Scarcity boost using the shared helper
        load_dict = {"load_id": load.load_id, "weight": load.weight, "pickup_node_id": load.pickup_node_id}
        scarcity_boost = calculate_scarcity_boost(truck_id, load_dict, num_candidates)

        # --- OPTIONAL: Increased scarcity weight (0.5/0.5 instead of 0.7/0.3) ---
        # Change this to 0.7 if you prefer less scarcity impact
        final_score = 0.5 * avg_score + 0.5 * scarcity_boost
        scored.append((load, final_score, dist_pickup, dist_drop))

    scored.sort(key=lambda x: x[1], reverse=True)

    for load, score, dist_pickup, dist_drop in scored[:settings.MAX_PROPOSALS_PER_TRUCK]:
        if load.load_id in locked_loads:
            continue

        locked_loads[load.load_id] = {"truck_id": truck_id, "expires_at": datetime.now() + timedelta(seconds=settings.PROPOSAL_LOCK_SECONDS)}
        proposal_id = generate_id("prop")

        detour = dist_pickup
        extra_time = detour / settings.DEFAULT_SPEED_KMPH * 60
        estimated_earnings = dist_drop * load.offered_rs_per_km

        proposal = Proposal(
            proposal_id=proposal_id,
            truck_id=truck_id,
            load_id=load.load_id,
            proposal_type="initial" if not truck.assigned_pairs else "intermediate",
            pickup_node_id=load.pickup_node_id,
            detour_km=detour,
            extra_time_min=int(extra_time),
            offered_rate=load.offered_rs_per_km,
            estimated_earnings=estimated_earnings,
            score=score,
            expires_at=datetime.now() + timedelta(minutes=5)
        )
        proposals_db[proposal_id] = proposal
        print(f"✅ PROPOSAL_CREATED for load {load.load_id} with score {score:.2f} (avg={avg_score:.2f}, scarcity={scarcity_boost:.2f})")
        log_event("PROPOSAL_CREATED", truck_id, {"load_id": load.load_id, "score": score}, is_notification=True, user_role="driver", user_id=truck.driver_id)

async def match_idle_trucks():
    tasks = []
    for truck in trucks_db.values():
        if truck.status in ["IDLE", "AT_NODE", "TRAVELING"]:
            tasks.append(match_for_truck(truck.truck_id))
    if tasks:
        await asyncio.gather(*tasks)