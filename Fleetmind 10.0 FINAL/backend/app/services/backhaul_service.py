from typing import Dict, List
from ..core.database import *
from ..core.config import settings
from ..core.graph import graph
from .scoring import backhaul_scoring

async def update_next_action(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck or truck.status not in ["IDLE", "AT_NODE"]:
        return
    accepted_loads = []
    for pair_id in truck.assigned_pairs:
        pair = pairs_db.get(pair_id)
        if pair:
            load = loads_db.get(pair.load_id)
            if load:
                accepted_loads.append({
                    "load_id": load.load_id,
                    "pickup_node_id": load.pickup_node_id,
                    "drop_node_id": load.drop_node_id,
                    "weight": load.weight,
                    "offered_rs_per_km": load.offered_rs_per_km,
                    "deadline": load.delivery_deadline,
                    "status": "picked_up" if pair.status == "PICKED_UP" else "pending"
                })
    truck_state = {
        "current_node_id": truck.current_node_id,
        "remaining_capacity": truck.remaining_capacity,
        "preferred_rs_per_km": truck.preferred_rs_per_km,
        "accepted_loads": accepted_loads,
        "distances": {}
    }
    candidates = []
    for load in loads_db.values():
        if load.status == "PENDING" and load.load_id not in locked_loads:
            if load.weight <= truck.remaining_capacity:
                candidates.append({
                    "load_id": load.load_id,
                    "pickup_node_id": load.pickup_node_id,
                    "weight": load.weight,
                    "offered_rs_per_km": load.offered_rs_per_km,
                    "delivery_deadline": load.delivery_deadline
                })
    nodes = set([truck.current_node_id] + [c["pickup_node_id"] for c in candidates] + [l["pickup_node_id"] for l in accepted_loads] + [l["drop_node_id"] for l in accepted_loads])
    for n1 in nodes:
        for n2 in nodes:
            if n1 and n2:
                dist = graph.distance(n1, n2)
                if dist < 1e9:
                    truck_state["distances"][(n1, n2)] = dist
    actions = backhaul_scoring(truck_state, truck.current_node_id, candidates)
    best_action = max(actions, key=lambda x: x[3])
    action_type, target_node, load_id, score = best_action
    truck_next_action[truck_id] = {"action": action_type, "target_node_id": target_node, "load_id": load_id, "score": round(score, 2)}