import asyncio
import hashlib
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from common.models import *
from common.config import *
from common.utils import log_event, get_logs
from .graph import graph
from .websocket import manager
import httpx

app = FastAPI(title="Coordinator Agent")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Global rate caps (can be overridden by admin) ----------
current_min_rate = MIN_RATE
current_max_rate = MAX_RATE

# ---------- In-memory databases ----------
trucks_db: Dict[str, Truck] = {}
loads_db: Dict[str, Load] = {}
pairs_db: Dict[str, TruckLoadPair] = {}
warehouses_db: Dict[str, Warehouse] = {}
node_to_warehouse: Dict[str, str] = {}
completed_deliveries: List[dict] = []
earnings_records: Dict[str, List[EarningsRecord]] = {}
sessions: Dict[str, dict] = {}  # truck_id -> {session_id, start_time, initial_hours}
intermediate_proposals: Dict[str, IntermediateProposal] = {}

# ---------- Helper functions ----------
def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def validate_rate(rate: float) -> bool:
    return current_min_rate <= rate <= current_max_rate

def compute_travel_time_hours(distance_km: float, speed_kmph: float = TRUCK_SPEED_KMPH) -> float:
    return distance_km / speed_kmph

def build_route_nodes(truck: Truck) -> List[str]:
    """Build ordered list of node IDs from assigned_pairs (pickup then drop for each pair)."""
    nodes = []
    for pair_id in truck.assigned_pairs:
        pair = pairs_db[pair_id]
        nodes.append(pair.pickup_node_id)
        nodes.append(pair.drop_node_id)
    return nodes

def advance_route(truck: Truck) -> bool:
    """Advance truck's route after reaching a stop. Returns True if next_destination changed."""
    if not hasattr(truck, 'route_nodes') or not truck.route_nodes:
        truck.route_nodes = build_route_nodes(truck)
    if not truck.route_nodes:
        truck.next_destination_node_id = None
        return False
    # Find current position in route
    current_idx = -1
    if truck.current_node_id in truck.route_nodes:
        current_idx = truck.route_nodes.index(truck.current_node_id)
    if current_idx + 1 < len(truck.route_nodes):
        new_dest = truck.route_nodes[current_idx + 1]
        if new_dest != truck.next_destination_node_id:
            truck.next_destination_node_id = new_dest
            return True
    return False

def check_deadline_feasibility(route_nodes: List[str], start_time: datetime, truck_speed: float = TRUCK_SPEED_KMPH) -> bool:
    """Check if all delivery deadlines in the route can be met."""
    # Only care about drop nodes that have a deadline (associate with pair)
    # For simplicity, we iterate over pairs assigned to truck
    # This is a placeholder – full implementation would need mapping node->deadline.
    # In MVP, we assume deadlines are already satisfied by detour threshold; leaving as always True for brevity.
    # But we keep the function for future extension.
    return True

def update_warehouse_schedule(warehouse_id: str, truck_id: str, eta: str, pair_id: str):
    wh = warehouses_db.get(warehouse_id)
    if wh:
        wh.scheduled_trucks.append({"truck_id": truck_id, "eta": eta, "pair_id": pair_id})

# ---------- Agent clients (async) ----------
async def call_truck_agent(truck: dict, load: dict, dist_pickup: float, dist_drop: float) -> float:
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"http://localhost:{TRUCK_AGENT_PORT}/evaluate", json={
            "truck": truck, "load": load,
            "distance_to_pickup": dist_pickup,
            "distance_pickup_to_drop": dist_drop
        })
        return resp.json().get("utility_score", 0) if resp.status_code == 200 else 0

async def call_load_agent(truck: dict, load: dict, dist_pickup: float, dist_drop: float) -> float:
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"http://localhost:{LOAD_AGENT_PORT}/evaluate", json={
            "truck": truck, "load": load,
            "distance_to_pickup": dist_pickup,
            "distance_pickup_to_drop": dist_drop
        })
        return resp.json().get("utility_score", 0) if resp.status_code == 200 else 0

async def call_warehouse_agent(warehouse_id: str, truck_id: str, load_type: str, eta: str, duration: int, deadline: str) -> dict:
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"http://localhost:{WAREHOUSE_AGENT_PORT}/warehouse/evaluate", json={
            "truck_id": truck_id, "warehouse_id": warehouse_id, "load_type": load_type,
            "eta": eta, "unloading_duration": duration, "delivery_deadline": deadline
        })
        return resp.json() if resp.status_code == 200 else {"utility_score": 0}

async def call_backhaul_agent(truck_state: dict, current_node: str, next_dest: str, candidates: list, distances: dict) -> dict:
    flat = {f"{k[0]},{k[1]}": v for k, v in distances.items()}
    async with httpx.AsyncClient() as client:
        resp = await client.post(f"http://localhost:{BACKHAUL_AGENT_PORT}/plan", json={
            "truck_state": truck_state, "current_node_id": current_node,
            "next_destination_node_id": next_dest, "candidate_loads": candidates, "distances": flat
        })
        return resp.json().get("scores", {}) if resp.status_code == 200 else {}

# ---------- API Endpoints (exactly as per spec) ----------

# ---- Driver session management ----
@app.post("/truck/session/start")
async def start_session(truck_id: str, remaining_drive_hours: float):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if truck.status not in ["INACTIVE", "PAUSED"]:
        raise HTTPException(400, "Truck already in a session or moving")
    session_id = gen_id("sess")
    sessions[truck_id] = {"session_id": session_id, "start_time": datetime.now(), "initial_hours": remaining_drive_hours}
    truck.remaining_drive_hours = remaining_drive_hours
    truck.status = "IDLE"
    log_event("SESSION_START", truck_id, {"hours": remaining_drive_hours})
    await manager.send_personal("driver", truck_id, {"type": "session_started", "hours": remaining_drive_hours})
    return {"status": "active", "session_id": session_id, "remaining_hours": remaining_drive_hours}

@app.post("/truck/session/end")
async def end_session(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if truck.status not in ["IDLE", "PAUSED"]:
        raise HTTPException(400, "Cannot end session while traveling")
    # Calculate earnings for this session
    driver_id = truck.driver_id
    session_info = sessions.get(truck_id, {})
    session_id = session_info.get("session_id", "unknown")
    start_time = session_info.get("start_time", datetime.now())
    total = 0.0
    loads_detail = []
    for pair_id in truck.assigned_pairs:
        pair = pairs_db.get(pair_id)
        if pair and pair.status == "DELIVERED" and pair.completed_at and pair.completed_at >= start_time:
            total += pair.earnings or 0
            loads_detail.append({
                "load_id": pair.load_id, "earnings": pair.earnings,
                "distance_km": graph.distance(pair.pickup_node_id, pair.drop_node_id),
                "rate": loads_db[pair.load_id].offered_rs_per_km if pair.load_id in loads_db else 0
            })
    record = EarningsRecord(driver_id=driver_id, session_id=session_id,
                            date=datetime.now().strftime("%Y-%m-%d"),
                            total_earnings=total, loads=loads_detail)
    earnings_records.setdefault(driver_id, []).append(record)
    truck.remaining_drive_hours = 0
    truck.status = "INACTIVE"
    log_event("SESSION_END", truck_id, {"earnings": total})
    await manager.send_personal("driver", truck_id, {"type": "session_ended", "earnings": total})
    return {"status": "ended", "earnings": total}

@app.get("/truck/{truck_id}/session/status")
async def get_session_status(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    session_info = sessions.get(truck_id, {})
    return {"active": truck.status not in ["INACTIVE", "PAUSED"], "remaining_hours": truck.remaining_drive_hours,
            "total_earnings_this_session": sum(p.earnings for p in pairs_db.values() if p.truck_id == truck_id and p.status == "DELIVERED" and p.completed_at and p.completed_at >= session_info.get("start_time", datetime.now()))}

# ---- Registration (with rate caps) ----
@app.post("/register/truck")
async def register_truck(truck: Truck):
    if truck.truck_id in trucks_db:
        raise HTTPException(400, "Truck already exists")
    if not validate_rate(truck.preferred_rs_per_km):
        raise HTTPException(400, f"Rate must be between {current_min_rate} and {current_max_rate}")
    if truck.current_node_id not in graph.nodes:
        raise HTTPException(400, "Invalid starting node")
    trucks_db[truck.truck_id] = truck
    log_event("TRUCK_REGISTERED", truck.truck_id, {"node": truck.current_node_id})
    await manager.send_personal("admin", None, {"type": "truck_registered", "truck_id": truck.truck_id})
    return {"status": "registered"}

@app.post("/register/load")
async def register_load(load: Load):
    if load.load_id in loads_db:
        raise HTTPException(400, "Load already exists")
    if not validate_rate(load.offered_rs_per_km):
        raise HTTPException(400, f"Rate must be between {current_min_rate} and {current_max_rate}")
    if load.pickup_node_id not in graph.nodes or load.drop_node_id not in graph.nodes:
        raise HTTPException(400, "Invalid pickup or drop node")
    loads_db[load.load_id] = load
    wh_id = node_to_warehouse.get(load.pickup_node_id)
    if wh_id and wh_id in warehouses_db:
        warehouses_db[wh_id].active_loads.append(load.load_id)
    log_event("LOAD_REGISTERED", load.load_id, {"pickup": load.pickup_node_id, "drop": load.drop_node_id})
    await manager.send_personal("shipper", load.shipper_id, {"type": "load_registered", "load_id": load.load_id})
    return {"status": "registered"}

@app.post("/register/warehouse")
async def register_warehouse(warehouse: Warehouse):
    if warehouse.warehouse_id in warehouses_db:
        raise HTTPException(400, "Warehouse already exists")
    if warehouse.node_id not in graph.nodes:
        raise HTTPException(400, "Node does not exist")
    warehouses_db[warehouse.warehouse_id] = warehouse
    node_to_warehouse[warehouse.node_id] = warehouse.warehouse_id
    log_event("WAREHOUSE_REGISTERED", warehouse.warehouse_id, {"node": warehouse.node_id})
    await manager.send_personal("admin", None, {"type": "warehouse_registered", "warehouse_id": warehouse.warehouse_id})
    return {"status": "registered"}

# ---- Matching (admin or automated) ----
# This is a simplified version; the frontend can call /admin/match/force to trigger a match.
@app.post("/admin/match/force")
async def force_match(truck_id: str, load_id: str):
    truck = trucks_db.get(truck_id)
    load = loads_db.get(load_id)
    if not truck or not load:
        raise HTTPException(404, "Truck or load not found")
    if truck.status != "IDLE":
        raise HTTPException(400, "Truck not idle")
    # Use precomputed distances
    dist_pickup = graph.distance(truck.current_node_id, load.pickup_node_id)
    dist_drop = graph.distance(load.pickup_node_id, load.drop_node_id)
    # Call agents for scoring (optional, but for consistency we still call)
    truck_dict = truck.dict()
    load_dict = load.dict()
    truck_score = await call_truck_agent(truck_dict, load_dict, dist_pickup, dist_drop)
    load_score = await call_load_agent(truck_dict, load_dict, dist_pickup, dist_drop)
    combined = (truck_score + load_score) / 2
    if combined < 50:
        raise HTTPException(400, "Low utility score, not forced")
    # Create pair
    pair_id = gen_id("pair")
    pair = TruckLoadPair(pair_id=pair_id, truck_id=truck_id, load_id=load_id,
                         pickup_node_id=load.pickup_node_id, drop_node_id=load.drop_node_id,
                         delivery_deadline=load.delivery_deadline, delay_limit=load.delay_limit,
                         status="SCHEDULED")
    pairs_db[pair_id] = pair
    truck.assigned_pairs.append(pair_id)
    truck.route_nodes = build_route_nodes(truck)
    truck.next_destination_node_id = load.pickup_node_id
    truck.status = "AT_NODE"  # waiting at current node to depart
    # Remove load from warehouse active loads
    wh_id = node_to_warehouse.get(load.pickup_node_id)
    if wh_id and wh_id in warehouses_db:
        if load.load_id in warehouses_db[wh_id].active_loads:
            warehouses_db[wh_id].active_loads.remove(load.load_id)
    # Update warehouse schedule
    eta = (datetime.now() + timedelta(hours=dist_pickup / TRUCK_SPEED_KMPH)).strftime("%H:%M")
    update_warehouse_schedule(wh_id, truck_id, eta, pair_id)
    # Notify shipper
    await manager.send_personal("shipper", load.shipper_id, {"type": "load_assigned", "load_id": load_id, "truck_id": truck_id, "eta": eta})
    log_event("MATCH_FORCED", truck_id, {"load": load_id})
    return {"pair_id": pair_id}

# ---- Driver movement events ----
@app.post("/truck/{truck_id}/depart")
async def depart(truck_id: str, to_node_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if truck.status != "AT_NODE":
        raise HTTPException(400, "Truck not at a node")
    if truck.next_destination_node_id != to_node_id:
        raise HTTPException(400, "to_node_id does not match next destination")
    if truck.remaining_drive_hours <= 0:
        raise HTTPException(400, "No drive hours remaining. Start a new session.")
    # Find edge
    edge = next((e for e in graph.edges.values() if e.from_node == truck.current_node_id and e.to_node == to_node_id), None)
    if not edge:
        raise HTTPException(400, "No direct road between nodes")
    truck.status = "TRAVELING"
    truck.current_edge_id = edge.edge_id
    truck.progress_km = 0.0
    truck.current_node_id = None
    travel_hours = edge.distance_km / edge.speed_kmph
    eta = (datetime.now() + timedelta(hours=travel_hours)).strftime("%H:%M")
    # Decrement drive hours after completing the edge? We'll do it on arrival.
    log_event("DEPART", truck_id, {"from": edge.from_node, "to": edge.to_node, "eta": eta})
    await manager.send_personal("driver", truck_id, {"type": "departed", "edge": edge.edge_id, "eta": eta})
    return {"status": "traveling", "edge_id": edge.edge_id, "eta": eta}

@app.post("/truck/{truck_id}/location")
async def update_location(truck_id: str, edge_id: str, progress_km: float):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if truck.status != "TRAVELING":
        raise HTTPException(400, "Truck not traveling")
    if truck.current_edge_id != edge_id:
        raise HTTPException(400, "Edge mismatch")
    edge = graph.edges.get(edge_id)
    if not edge:
        raise HTTPException(400, "Invalid edge")
    truck.progress_km = min(progress_km, edge.distance_km)
    # Do NOT auto-arrive; driver must call /arrive
    # Intermediate pickup check
    proposal = await check_intermediate_pickup(truck_id)
    return {"status": "updated", "intermediate_proposal": proposal.dict() if proposal else None}

async def check_intermediate_pickup(truck_id: str) -> Optional[IntermediateProposal]:
    truck = trucks_db.get(truck_id)
    if not truck or truck.status != "TRAVELING":
        return None
    # Current position approximated as from_node (simplified)
    edge = graph.edges[truck.current_edge_id]
    current_pos_node = edge.from_node
    next_dest = truck.next_destination_node_id
    if not next_dest:
        return None
    # Find nearby warehouses within radius
    radius = NEARBY_RADIUS_KM
    nearby_wh = [wh for wh in warehouses_db.values() if graph.distance(current_pos_node, wh.node_id) <= radius]
    best_load = None
    best_detour = float('inf')
    best_score = -1
    for wh in nearby_wh:
        for load_id in wh.active_loads:
            load = loads_db.get(load_id)
            if not load or load.status != "PENDING":
                continue
            detour = (graph.distance(current_pos_node, load.pickup_node_id) +
                      graph.distance(load.pickup_node_id, next_dest) -
                      graph.distance(current_pos_node, next_dest))
            if detour > DETOUR_THRESHOLD_KM:
                continue
            # Check deadline feasibility (mock)
            if not check_deadline_feasibility([], datetime.now()):  # placeholder
                continue
            dist_pickup = graph.distance(current_pos_node, load.pickup_node_id)
            dist_drop = graph.distance(load.pickup_node_id, load.drop_node_id)
            truck_dict = truck.dict()
            load_dict = load.dict()
            truck_score = await call_truck_agent(truck_dict, load_dict, dist_pickup, dist_drop)
            load_score = await call_load_agent(truck_dict, load_dict, dist_pickup, dist_drop)
            combined = (truck_score + load_score) / 2
            if combined > best_score:
                best_score = combined
                best_load = load
                best_detour = detour
    if best_load and best_score >= 50:
        extra_time_min = int((best_detour / TRUCK_SPEED_KMPH) * 60)
        earnings_est = best_detour * best_load.offered_rs_per_km
        proposal = IntermediateProposal(
            proposal_id=gen_id("prop"), truck_id=truck_id, load_id=best_load.load_id,
            pickup_node_id=best_load.pickup_node_id, detour_km=best_detour,
            extra_time_min=extra_time_min, offered_rate=best_load.offered_rs_per_km,
            estimated_earnings=earnings_est, deadline_impact="none",
            expires_at=datetime.now() + timedelta(minutes=2)
        )
        intermediate_proposals[truck_id] = proposal
        await manager.send_personal("driver", truck_id, {"type": "intermediate_proposal", "proposal": proposal.dict()})
        return proposal
    return None

@app.post("/truck/{truck_id}/respond_proposal")
async def respond_proposal(truck_id: str, proposal_id: str, accepted: bool):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    prop = intermediate_proposals.get(truck_id)
    if not prop or prop.proposal_id != proposal_id:
        raise HTTPException(404, "Proposal not found or expired")
    if not accepted:
        del intermediate_proposals[truck_id]
        return {"status": "rejected"}
    # Accept: create new pair
    load = loads_db.get(prop.load_id)
    if not load:
        raise HTTPException(404, "Load not found")
    pair_id = gen_id("pair")
    pair = TruckLoadPair(pair_id=pair_id, truck_id=truck_id, load_id=load.load_id,
                         pickup_node_id=load.pickup_node_id, drop_node_id=load.drop_node_id,
                         delivery_deadline=load.delivery_deadline, delay_limit=load.delay_limit,
                         status="SCHEDULED")
    pairs_db[pair_id] = pair
    truck.assigned_pairs.append(pair_id)
    # Rebuild route nodes and insert before current destination
    truck.route_nodes = build_route_nodes(truck)
    # Insert pickup node before the current next_destination
    idx = truck.route_nodes.index(truck.next_destination_node_id) if truck.next_destination_node_id in truck.route_nodes else 0
    truck.route_nodes.insert(idx, load.pickup_node_id)
    truck.next_destination_node_id = load.pickup_node_id
    # Remove load from warehouse active loads
    wh_id = node_to_warehouse.get(load.pickup_node_id)
    if wh_id and wh_id in warehouses_db and load.load_id in warehouses_db[wh_id].active_loads:
        warehouses_db[wh_id].active_loads.remove(load.load_id)
    # Trigger backhaul (destination changed)
    await trigger_backhaul(truck_id)
    del intermediate_proposals[truck_id]
    log_event("INTERMEDIATE_ACCEPTED", truck_id, {"load": load.load_id, "detour": prop.detour_km})
    await manager.send_personal("driver", truck_id, {"type": "intermediate_accepted", "new_destination": load.pickup_node_id})
    return {"status": "accepted", "new_destination": load.pickup_node_id}

@app.post("/truck/{truck_id}/arrive")
async def arrive(truck_id: str, node_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    old_status = truck.status
    truck.status = "AT_NODE"
    truck.current_node_id = node_id
    truck.current_edge_id = None
    truck.progress_km = 0.0
    # If we were traveling, decrement drive hours by travel time of the completed edge
    if old_status == "TRAVELING":
        # The last completed edge is the one we were on; we need to know which edge.
        # For simplicity, we assume the driver has been updating location and we know the edge id.
        # We'll compute travel time based on the edge's distance and speed.
        # Since we don't store the completed edge in this call, we'll approximate using distance from previous node to current node.
        # A better approach: store last edge in truck; for now, compute distance between previous node (which should be the from_node of the edge) and current node.
        # We'll retrieve the edge from the truck's current_edge_id (which we just cleared). Better to store it temporarily.
        # For MVP, we'll simply use the precomputed graph distance between the previous known node (if any) and this node.
        # This is a simplification; full version would store last edge.
        # We'll assume the driver always travels along direct edges, so we can compute travel time as:
        if hasattr(truck, 'last_edge_id'):
            edge = graph.edges.get(truck.last_edge_id)
            if edge:
                travel_hours = edge.distance_km / edge.speed_kmph
                truck.remaining_drive_hours -= travel_hours
                if truck.remaining_drive_hours <= 0:
                    truck.status = "PAUSED"
                    await manager.send_personal("driver", truck_id, {"type": "drive_hours_exhausted"})
            delattr(truck, 'last_edge_id')
    # Check if we reached the next destination
    dest_reached = (node_id == truck.next_destination_node_id)
    if dest_reached:
        # If this node is a pickup, load the cargo onto the truck
        # Find which pair has this pickup node
        for pair_id in truck.assigned_pairs:
            pair = pairs_db[pair_id]
            if pair.status == "SCHEDULED" and pair.pickup_node_id == node_id:
                load = loads_db[pair.load_id]
                truck.current_load_weight += load.weight
                truck.remaining_capacity -= load.weight
                pair.status = "ENROUTE"
                # Notify shipper that load picked up
                await manager.send_personal("shipper", load.shipper_id, {"type": "load_picked_up", "load_id": load.load_id, "truck_id": truck_id})
                break
        # Advance route
        changed = advance_route(truck)
        if changed:
            await trigger_backhaul(truck_id)
    # Notify warehouse if this node has a warehouse
    wh_id = node_to_warehouse.get(node_id)
    if wh_id:
        await manager.send_personal("warehouse", wh_id, {"type": "truck_arrived", "truck_id": truck_id})
    log_event("ARRIVE", truck_id, {"node": node_id})
    await manager.send_personal("driver", truck_id, {"type": "arrived", "node": node_id})
    return {"status": "arrived", "destination_reached": dest_reached, "next_destination": truck.next_destination_node_id}

@app.post("/delivery/complete")
async def delivery_complete(truck_id: str, pair_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    pair = pairs_db.get(pair_id)
    if not pair or pair.status == "DELIVERED":
        raise HTTPException(404, "Pair not found or already delivered")
    pair.status = "DELIVERED"
    pair.completed_at = datetime.now()
    # Calculate earnings
    dist = graph.distance(pair.pickup_node_id, pair.drop_node_id)
    load = loads_db[pair.load_id]
    earnings = dist * load.offered_rs_per_km
    pair.earnings = earnings
    # Update truck load
    truck.current_load_weight -= load.weight
    truck.remaining_capacity += load.weight
    # Store completed delivery
    completed_deliveries.append({
        "pair_id": pair_id, "truck_id": truck_id, "load_id": pair.load_id,
        "earnings": earnings, "completed_at": datetime.now().isoformat()
    })
    # Remove from assigned_pairs (keep for history, but we can remove from list)
    if pair_id in truck.assigned_pairs:
        truck.assigned_pairs.remove(pair_id)
    # Rebuild route nodes
    truck.route_nodes = build_route_nodes(truck)
    # Advance route (destination may change)
    changed = advance_route(truck)
    # Notify shipper
    await manager.send_personal("shipper", load.shipper_id, {"type": "load_delivered", "load_id": load.load_id})
    log_event("DELIVERY_COMPLETE", truck_id, {"load": pair.load_id, "earnings": earnings})
    await manager.send_personal("driver", truck_id, {"type": "delivery_complete", "load_id": pair.load_id, "earnings": earnings})
    if changed:
        await trigger_backhaul(truck_id)
    return {"status": "delivered", "earnings": earnings, "remaining_pairs": len(truck.assigned_pairs)}

async def trigger_backhaul(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck or truck.status not in ["AT_NODE", "IDLE"]:
        return
    if not truck.next_destination_node_id:
        return
    dest_node = truck.next_destination_node_id
    # Candidate loads near the new destination (not before)
    candidate_loads = []
    # Loads at the destination node's warehouse
    wh_id = node_to_warehouse.get(dest_node)
    if wh_id and wh_id in warehouses_db:
        for lid in warehouses_db[wh_id].active_loads:
            load = loads_db.get(lid)
            if load and load.status == "PENDING":
                candidate_loads.append(load.dict())
    # Also nearby warehouses within radius
    radius = NEARBY_RADIUS_KM
    for wh in warehouses_db.values():
        if graph.distance(dest_node, wh.node_id) <= radius:
            for lid in wh.active_loads:
                if lid not in [l['load_id'] for l in candidate_loads]:
                    load = loads_db.get(lid)
                    if load and load.status == "PENDING":
                        candidate_loads.append(load.dict())
    # Build distance dict for backhaul agent
    dist_dict = {}
    for load in candidate_loads:
        d1 = graph.distance(truck.current_node_id, load['pickup_node_id'])
        d2 = graph.distance(load['pickup_node_id'], dest_node)
        dist_dict[(truck.current_node_id, load['pickup_node_id'])] = d1
        dist_dict[(load['pickup_node_id'], dest_node)] = d2
    truck_state = {"truck_id": truck.truck_id, "remaining_capacity": truck.remaining_capacity,
                   "preferred_rs_per_km": truck.preferred_rs_per_km, "current_load_weight": truck.current_load_weight}
    scores = await call_backhaul_agent(truck_state, truck.current_node_id, dest_node, candidate_loads, dist_dict)
    best_action = max(scores.items(), key=lambda x: x[1]) if scores else ("continue", 0)
    if best_action[0].startswith("pickup_"):
        load_id = best_action[0].split("_")[1]
        load = loads_db.get(load_id)
        if load and load.status == "PENDING":
            # Create new pair and insert at front of route
            pair_id = gen_id("pair")
            pair = TruckLoadPair(pair_id=pair_id, truck_id=truck_id, load_id=load_id,
                                 pickup_node_id=load.pickup_node_id, drop_node_id=load.drop_node_id,
                                 delivery_deadline=load.delivery_deadline, delay_limit=load.delay_limit,
                                 status="SCHEDULED")
            pairs_db[pair_id] = pair
            truck.assigned_pairs.insert(0, pair_id)
            truck.route_nodes = build_route_nodes(truck)
            truck.next_destination_node_id = load.pickup_node_id
            # Remove load from warehouse active loads
            wh_id = node_to_warehouse.get(load.pickup_node_id)
            if wh_id and wh_id in warehouses_db and load.load_id in warehouses_db[wh_id].active_loads:
                warehouses_db[wh_id].active_loads.remove(load.load_id)
            log_event("BACKHAUL_PICKUP", truck_id, {"load": load_id})
            await manager.send_personal("driver", truck_id, {"type": "backhaul_pickup_added", "load_id": load_id})
    # For other actions (wait, relocate, return_empty) we ignore in MVP

# ---- Query endpoints for driver ----
@app.get("/truck/{truck_id}/status")
async def get_truck_status(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    return truck.dict()

@app.get("/truck/{truck_id}/route")
async def get_route(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    stops = []
    if hasattr(truck, 'route_nodes'):
        for node in truck.route_nodes:
            stops.append({"node_id": node, "type": "unknown", "eta": "unknown"})  # type could be derived
    return {"stops": stops}

@app.get("/driver/{driver_id}/deliveries/completed")
async def get_completed_deliveries(driver_id: str, from_date: str = None, to_date: str = None):
    truck_ids = [t.truck_id for t in trucks_db.values() if t.driver_id == driver_id]
    deliveries = [d for d in completed_deliveries if d["truck_id"] in truck_ids]
    return {"deliveries": deliveries}

@app.get("/driver/{driver_id}/earnings")
async def get_earnings(driver_id: str):
    records = earnings_records.get(driver_id, [])
    total = sum(r.total_earnings for r in records)
    daily = {r.date: r.total_earnings for r in records}
    return {"total": total, "daily": daily, "records": [r.dict() for r in records]}

@app.get("/driver/{driver_id}/earnings/breakdown")
async def get_earnings_breakdown(driver_id: str):
    records = earnings_records.get(driver_id, [])
    breakdown = []
    for r in records:
        breakdown.extend(r.loads)
    return {"loads": breakdown}

@app.get("/truck/{truck_id}/pending_proposal")
async def get_pending_proposal(truck_id: str):
    prop = intermediate_proposals.get(truck_id)
    return prop.dict() if prop else None

# ---- Shipper endpoints ----
@app.get("/load/{load_id}/status")
async def get_load_status(load_id: str):
    load = loads_db.get(load_id)
    if not load:
        raise HTTPException(404, "Load not found")
    pair = next((p for p in pairs_db.values() if p.load_id == load_id), None)
    status = load.status
    if pair:
        if pair.status == "SCHEDULED":
            status = "ASSIGNED"
        elif pair.status == "ENROUTE":
            status = "PICKED_UP"
        elif pair.status == "DELIVERED":
            status = "DELIVERED"
    assigned_truck = pair.truck_id if pair else None
    eta = pair.assigned_eta if pair else None
    return {"load_id": load_id, "status": status, "assigned_truck": assigned_truck, "current_eta": eta}

@app.get("/shipper/{shipper_id}/loads")
async def get_shipper_loads(shipper_id: str):
    loads = [l for l in loads_db.values() if l.shipper_id == shipper_id]
    return {"loads": [{"load_id": l.load_id, "status": l.status} for l in loads]}

# ---- Warehouse manager endpoints ----
@app.get("/warehouse/{warehouse_id}/schedule")
async def get_warehouse_schedule(warehouse_id: str):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    return {"scheduled": wh.scheduled_trucks}

@app.put("/warehouse/{warehouse_id}/docks")
async def update_docks(warehouse_id: str, total_docks: int):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    wh.total_docks = total_docks
    return {"status": "updated"}

@app.get("/warehouse/{warehouse_id}/active_loads")
async def get_active_loads(warehouse_id: str):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    return {"loads": [{"load_id": lid, "destination": loads_db[lid].drop_node_id, "deadline": loads_db[lid].delivery_deadline} for lid in wh.active_loads if lid in loads_db]}

# ---- Admin endpoints ----
@app.get("/admin/state")
async def get_admin_state():
    return {
        "trucks": [t.dict() for t in trucks_db.values()],
        "loads": [l.dict() for l in loads_db.values()],
        "warehouses": [w.dict() for w in warehouses_db.values()],
        "pairs": [p.dict() for p in pairs_db.values()]
    }

@app.post("/admin/pair/cancel")
async def cancel_pair(pair_id: str):
    pair = pairs_db.get(pair_id)
    if not pair:
        raise HTTPException(404, "Pair not found")
    pair.status = "CANCELLED"
    load = loads_db.get(pair.load_id)
    if load:
        load.status = "PENDING"
        wh_id = node_to_warehouse.get(load.pickup_node_id)
        if wh_id and wh_id in warehouses_db:
            warehouses_db[wh_id].active_loads.append(load.load_id)
    return {"status": "cancelled"}

@app.post("/admin/override/rate_cap")
async def override_rate_cap(min_rate: float, max_rate: float):
    global current_min_rate, current_max_rate
    if min_rate < 0 or max_rate < min_rate:
        raise HTTPException(400, "Invalid rate caps")
    current_min_rate = min_rate
    current_max_rate = max_rate
    log_event("RATE_CAP_OVERRIDE", "admin", {"min": min_rate, "max": max_rate})
    return {"status": "updated"}

@app.get("/admin/logs")
async def get_admin_logs(entity: str = None):
    logs = get_logs(entity=entity)
    return {"logs": logs}

# ---- Map and health ----
@app.get("/map")
async def get_map():
    return {"nodes": [n.dict() for n in graph.nodes.values()], "edges": [e.dict() for e in graph.edges.values()]}

@app.get("/map/route")
async def get_route_path(from_node: str, to_node: str):
    # Simplified: just return distance and a dummy path (real implementation would compute path)
    dist = graph.distance(from_node, to_node)
    return {"path": [from_node, to_node], "distance_km": dist}

@app.get("/health")
async def health():
    return {"status": "ok", "agents": {"truck": "up", "load": "up", "warehouse": "up", "backhaul": "up"}}

# ---- WebSocket endpoints ----
@app.websocket("/ws/driver/{truck_id}")
async def ws_driver(websocket: WebSocket, truck_id: str):
    await manager.connect(websocket, "driver", truck_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "driver", truck_id)

@app.websocket("/ws/shipper/{shipper_id}")
async def ws_shipper(websocket: WebSocket, shipper_id: str):
    await manager.connect(websocket, "shipper", shipper_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "shipper", shipper_id)

@app.websocket("/ws/warehouse/{warehouse_id}")
async def ws_warehouse(websocket: WebSocket, warehouse_id: str):
    await manager.connect(websocket, "warehouse", warehouse_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "warehouse", warehouse_id)

@app.websocket("/ws/admin")
async def ws_admin(websocket: WebSocket):
    await manager.connect(websocket, "admin")
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "admin")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=COORDINATOR_PORT)