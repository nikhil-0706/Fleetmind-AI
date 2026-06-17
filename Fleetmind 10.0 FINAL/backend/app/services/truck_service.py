from datetime import datetime, timedelta
from typing import Optional, List
import asyncio
from ..core.database import *
from ..core.graph import graph
from ..core.config import settings
from ..models.domain import Truck, TruckLoadPair, Proposal
from ..models.requests import RegisterTruckRequest
from ..utils.helpers import generate_id, validate_rate
from ..utils.logger import log_event
from .matching_service import match_for_truck
from .backhaul_service import update_next_action

def register_truck(data: RegisterTruckRequest) -> dict:
    truck_id = data.truck_id
    if truck_id in trucks_db:
        return {"success": False, "error": "Truck already exists"}
    if not validate_rate(data.preferred_rs_per_km, current_config):
        return {"success": False, "error": f"Rate must be between {current_config.min_rate} and {current_config.max_rate}"}
    if data.current_node_id not in graph.nodes:
        return {"success": False, "error": f"Node {data.current_node_id} does not exist"}
    truck = Truck(**data.dict())
    trucks_db[truck_id] = truck
    log_event("TRUCK_REGISTERED", truck_id, {"driver_id": truck.driver_id, "node": truck.current_node_id})
    return {"success": True, "truck": truck.dict()}

def get_truck_status(truck_id: str) -> Optional[dict]:
    truck = trucks_db.get(truck_id)
    if not truck:
        return None
    if truck.status == "TRAVELING" and truck.current_edge_id and truck.departure_time:
        edge = graph.edges.get(truck.current_edge_id)
        if edge:
            elapsed = (datetime.now() - truck.departure_time).total_seconds() / 3600.0
            progress = min(elapsed * edge.speed_kmph, edge.distance_km)
            truck.progress_km = progress
    return {
        "truck_id": truck.truck_id,
        "status": truck.status,
        "current_node_id": truck.current_node_id,
        "current_edge_id": truck.current_edge_id,
        "progress_km": truck.progress_km,
        "next_destination": truck.next_destination_node_id,
        "remaining_capacity": truck.remaining_capacity,
        "assigned_pairs": truck.assigned_pairs,
        "route": truck.route
    }

def start_session(truck_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    if not truck:
        return {"success": False, "error": "Truck not found"}
    if truck.status not in ["INACTIVE", "IDLE"]:
        return {"success": False, "error": f"Invalid status: {truck.status}"}
    truck.status = "IDLE"
    log_event("SESSION_START", truck_id, {})
    asyncio.create_task(match_for_truck(truck_id))
    return {"success": True, "status": "active", "truck_id": truck_id}

def end_session(truck_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    if not truck:
        return {"success": False, "error": "Truck not found"}
    truck.status = "INACTIVE"
    if truck_id in truck_next_action:
        del truck_next_action[truck_id]
    log_event("SESSION_END", truck_id, {})
    return {"success": True, "status": "ended"}

def depart_truck(truck_id: str, to_node_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    if not truck:
        return {"success": False, "error": "Truck not found"}
    if truck.status not in ["AT_NODE", "IDLE"] or truck.current_node_id is None:
        return {"success": False, "error": "Truck is not at a node"}

    # If direct edge exists, use it (fast path)
    edge = graph.get_edge(truck.current_node_id, to_node_id)
    if edge:
        truck.status = "TRAVELING"
        truck.current_edge_id = edge.edge_id
        truck.departure_time = datetime.now()
        truck.progress_km = 0.0
        truck.current_node_id = None
        truck.next_destination_node_id = to_node_id
        truck.route = []  # no multi-hop
        log_event("TRUCK_DEPART", truck_id, {"to": to_node_id, "edge": edge.edge_id})
        return {"success": True, "status": "traveling", "edge_id": edge.edge_id}

    # No direct edge – find a path
    path = graph.shortest_path(truck.current_node_id, to_node_id)
    if len(path) < 2:
        return {"success": False, "error": f"No route from {truck.current_node_id} to {to_node_id}"}

    # Store the entire path (excluding current node)
    truck.route = path[1:]  # nodes to visit in order
    # Start the first hop
    first_target = path[1]
    edge = graph.get_edge(truck.current_node_id, first_target)
    if not edge:
        return {"success": False, "error": "Internal error: no edge to first hop"}

    truck.status = "TRAVELING"
    truck.current_edge_id = edge.edge_id
    truck.departure_time = datetime.now()
    truck.progress_km = 0.0
    truck.current_node_id = None
    truck.next_destination_node_id = first_target
    log_event("TRUCK_DEPART", truck_id, {"to": first_target, "edge": edge.edge_id, "route": truck.route})
    return {"success": True, "status": "traveling", "edge_id": edge.edge_id, "route": truck.route}

def arrive_truck(truck_id: str, node_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    if not truck:
        return {"success": False, "error": "Truck not found"}
    if truck.status != "TRAVELING":
        return {"success": False, "error": "Truck is not traveling"}

    # If there's a route, the next destination is the first node in the route
    if truck.route and len(truck.route) > 0:
        next_node = truck.route[0]
        if node_id != next_node:
            return {"success": False, "error": f"Expected to arrive at {next_node}, not {node_id}"}
        # Advance to the next node
        truck.route.pop(0)
        # Update current node
        truck.current_node_id = node_id
        truck.current_edge_id = None
        truck.progress_km = 0.0
        truck.departure_time = None

        # If there are more nodes in the route, start the next hop
        if truck.route:
            next_target = truck.route[0]
            edge = graph.get_edge(node_id, next_target)
            if not edge:
                return {"success": False, "error": f"No edge from {node_id} to {next_target}"}
            truck.status = "TRAVELING"
            truck.current_edge_id = edge.edge_id
            truck.departure_time = datetime.now()
            truck.progress_km = 0.0
            truck.current_node_id = None
            truck.next_destination_node_id = next_target
            log_event("TRUCK_DEPART", truck_id, {"to": next_target, "edge": edge.edge_id, "remaining_route": truck.route})
            return {"success": True, "status": "traveling", "edge_id": edge.edge_id, "remaining_route": truck.route}
        else:
            # Reached final destination
            truck.status = "AT_NODE"
            truck.current_node_id = node_id
            truck.current_edge_id = None
            truck.progress_km = 0.0
            truck.departure_time = None
            truck.next_destination_node_id = None
            log_event("TRUCK_ARRIVE", truck_id, {"node": node_id})
            asyncio.create_task(update_next_action(truck_id))
            if truck.remaining_capacity > 0:
                asyncio.create_task(match_for_truck(truck_id))
            return {"success": True, "status": "arrived"}
    else:
        # Single-hop arrival
        if node_id != truck.next_destination_node_id:
            return {"success": False, "error": f"Expected to arrive at {truck.next_destination_node_id}, not {node_id}"}
        truck.status = "AT_NODE"
        truck.current_node_id = node_id
        truck.current_edge_id = None
        truck.progress_km = 0.0
        truck.departure_time = None
        truck.next_destination_node_id = None
        log_event("TRUCK_ARRIVE", truck_id, {"node": node_id})
        asyncio.create_task(update_next_action(truck_id))
        if truck.remaining_capacity > 0:
            asyncio.create_task(match_for_truck(truck_id))
        return {"success": True, "status": "arrived"}

def complete_delivery(truck_id: str, pair_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    pair = pairs_db.get(pair_id)
    if not truck or not pair:
        return {"success": False, "error": "Truck or pair not found"}
    if pair.status != "PENDING" and pair.status != "PICKED_UP":
        return {"success": False, "error": "Pair already completed"}
    pair.status = "DELIVERED"
    pair.completed_at = datetime.now()
    load = loads_db.get(pair.load_id)
    if load:
        distance = graph.distance(pair.pickup_node_id, pair.drop_node_id)
        earnings = distance * load.offered_rs_per_km
        pair.earnings = earnings
        earnings_record = EarningsRecord(
            driver_id=truck.driver_id,
            load_id=pair.load_id,
            pair_id=pair_id,
            earnings=earnings,
            distance_km=distance,
            rate_per_km=load.offered_rs_per_km,
            completed_at=datetime.now()
        )
        earnings_db.append(earnings_record)
        load.status = "DELIVERED"
    if pair_id in truck.assigned_pairs:
        truck.assigned_pairs.remove(pair_id)
    if load:
        truck.remaining_capacity += load.weight
    log_event("DELIVERY_COMPLETE", truck_id, {"pair_id": pair_id, "earnings": pair.earnings})
    asyncio.create_task(update_next_action(truck_id))
    if truck.status == "IDLE":
        asyncio.create_task(match_for_truck(truck_id))
    if truck.remaining_capacity > 0 and truck.status in ["AT_NODE", "IDLE"]:
        asyncio.create_task(match_for_truck(truck_id))
    return {"success": True, "status": "delivered", "earnings": pair.earnings}

def get_earnings(driver_id: str, period: str = "monthly") -> dict:
    driver_earnings = [e for e in earnings_db if e.driver_id == driver_id]
    if period == "today":
        today = datetime.now().date()
        filtered = [e for e in driver_earnings if e.completed_at.date() == today]
        return {"total": sum(e.earnings for e in filtered), "records": filtered}
    elif period == "monthly":
        monthly = {}
        for e in driver_earnings:
            key = e.completed_at.strftime("%Y-%m")
            monthly[key] = monthly.get(key, 0) + e.earnings
        return {"monthly": monthly, "total": sum(monthly.values())}
    elif period == "yearly":
        yearly = {}
        for e in driver_earnings:
            key = e.completed_at.strftime("%Y")
            yearly[key] = yearly.get(key, 0) + e.earnings
        return {"yearly": yearly, "total": sum(yearly.values())}
    return {"total": sum(e.earnings for e in driver_earnings)}

def get_earnings_breakdown(driver_id: str) -> list:
    return [e.dict() for e in earnings_db if e.driver_id == driver_id]

def get_proposals(truck_id: str) -> list:
    pending = [p.dict() for p in proposals_db.values() if p.truck_id == truck_id and p.status == "PENDING"]
    pending.sort(key=lambda x: x['score'], reverse=True)
    return pending[:settings.MAX_PROPOSALS_PER_TRUCK]

def accept_proposal(truck_id: str, proposal_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    if not truck:
        return {"success": False, "error": "Truck not found"}
    proposal = proposals_db.get(proposal_id)
    if not proposal or proposal.truck_id != truck_id or proposal.status != "PENDING":
        return {"success": False, "error": "Proposal not found or not pending"}

    proposal.status = "ACCEPTED"
    load = loads_db[proposal.load_id]
    load.status = "ASSIGNED"

    pair_id = generate_id("pair")
    pair = TruckLoadPair(
        pair_id=pair_id,
        truck_id=truck_id,
        load_id=proposal.load_id,
        pickup_node_id=load.pickup_node_id,
        drop_node_id=load.drop_node_id,
        delivery_deadline=load.delivery_deadline,
        delay_limit=load.delay_limit,
        status="PENDING"
    )
    pairs_db[pair_id] = pair
    truck.assigned_pairs.append(pair_id)
    truck.remaining_capacity -= load.weight

    if proposal.load_id in locked_loads:
        del locked_loads[proposal.load_id]

    for p in list(proposals_db.values()):
        if p.truck_id == truck_id and p.status == "PENDING" and p.proposal_id != proposal_id:
            p.status = "EXPIRED"
            if p.load_id in locked_loads and locked_loads[p.load_id].get("truck_id") == truck_id:
                del locked_loads[p.load_id]

    asyncio.create_task(match_for_truck(truck_id))

    warehouse_id = node_to_warehouse.get(load.pickup_node_id)
    if warehouse_id:
        from .warehouse_service import schedule_truck_at_warehouse
        asyncio.create_task(schedule_truck_at_warehouse(warehouse_id, truck_id, load))

    asyncio.create_task(update_next_action(truck_id))

    log_event("PROPOSAL_ACCEPTED", truck_id, {"proposal_id": proposal_id, "load_id": proposal.load_id}, is_notification=True, user_role="driver", user_id=truck.driver_id)

    return {"success": True, "status": "accepted", "pair_id": pair_id}

def reject_proposal(truck_id: str, proposal_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    if not truck:
        return {"success": False, "error": "Truck not found"}
    proposal = proposals_db.get(proposal_id)
    if not proposal or proposal.truck_id != truck_id or proposal.status != "PENDING":
        return {"success": False, "error": "Proposal not found or not pending"}
    proposal.status = "REJECTED"
    if proposal.load_id in locked_loads and locked_loads[proposal.load_id].get("truck_id") == truck_id:
        del locked_loads[proposal.load_id]
    log_event("PROPOSAL_REJECTED", truck_id, {"proposal_id": proposal_id}, is_notification=True, user_role="driver", user_id=truck.driver_id)
    return {"success": True, "status": "rejected"}

def pickup_load(truck_id: str, pair_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    pair = pairs_db.get(pair_id)
    if not truck or not pair:
        return {"success": False, "error": "Truck or pair not found"}
    if pair.status != "PENDING":
        return {"success": False, "error": "Pair already picked up or delivered"}
    if pair.truck_id != truck_id:
        return {"success": False, "error": "Pair does not belong to this truck"}

    load = loads_db.get(pair.load_id)
    if not load:
        return {"success": False, "error": "Load not found"}
    if truck.current_node_id != load.pickup_node_id:
        return {"success": False, "error": f"Truck is not at pickup node {load.pickup_node_id}"}

    # Mark as picked up
    pair.status = "PICKED_UP"
    load.status = "PICKED_UP"
    log_event("LOAD_PICKED_UP", truck_id, {"load_id": load.load_id, "node": truck.current_node_id})

    # Trigger backhaul update
    asyncio.create_task(update_next_action(truck_id))

    return {"success": True, "status": "picked_up", "pair_id": pair_id}

# --- FIX: Include PICKED_UP pairs in pending deliveries ---
def get_pending_deliveries(truck_id: str) -> list:
    truck = trucks_db.get(truck_id)
    if not truck:
        return []
    pending = []
    for pair_id in truck.assigned_pairs:
        pair = pairs_db.get(pair_id)
        # Include both PENDING and PICKED_UP (not DELIVERED)
        if pair and pair.status in ["PENDING", "PICKED_UP"]:
            pending.append(pair.dict())
    return pending

def get_next_action(truck_id: str) -> dict:
    return truck_next_action.get(truck_id, {"action": "wait", "target_node_id": None, "load_id": None, "score": 0})

def get_truck_by_driver(driver_id: str) -> Optional[str]:
    for truck in trucks_db.values():
        if truck.driver_id.lower().strip() == driver_id.lower().strip():
            return truck.truck_id
    return None

def instant_arrive(truck_id: str) -> dict:
    truck = trucks_db.get(truck_id)
    if not truck:
        return {"success": False, "error": "Truck not found"}
    if truck.status != "TRAVELING":
        return {"success": False, "error": "Truck is not traveling"}

    # Determine final destination
    if truck.route and len(truck.route) > 0:
        final_node = truck.route[-1]
    else:
        final_node = truck.next_destination_node_id

    if not final_node:
        return {"success": False, "error": "No destination to arrive at"}

    # Teleport to final_node
    truck.status = "AT_NODE"
    truck.current_node_id = final_node
    truck.current_edge_id = None
    truck.progress_km = 0.0
    truck.departure_time = None
    truck.next_destination_node_id = None
    truck.route = []

    log_event("TRUCK_INSTANT_ARRIVE", truck_id, {"node": final_node})

    # Trigger backhaul and matching (now same as normal arrive)
    asyncio.create_task(update_next_action(truck_id))
    if truck.remaining_capacity > 0:
        asyncio.create_task(match_for_truck(truck_id))

    return {"success": True, "status": "arrived", "node": final_node}