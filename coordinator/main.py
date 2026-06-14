import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from common.models import *
from common.config import *
from common.utils import log_event, get_logs
from common.graph import graph
from .websocket import manager
import httpx

app = FastAPI(title="Coordinator Agent")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# ---------- In-memory stores ----------
users_db: Dict[str, User] = {}            # key = f"{role}_{id}"
trucks_db: Dict[str, Truck] = {}
loads_db: Dict[str, Load] = {}
pairs_db: Dict[str, TruckLoadPair] = {}
warehouses_db: Dict[str, Warehouse] = {}
node_to_warehouse: Dict[str, str] = {}
proposals_db: Dict[str, Proposal] = {}
earnings_db: List[EarningsRecord] = []
current_config = SystemConfig()

# Additional state for backhaul suggestions
truck_next_action: Dict[str, dict] = {}   # truck_id -> {"action": str, "target_node": str, "load_id": str, "score": float}

# Proposal locking
locked_loads: Dict[str, dict] = {}  # load_id -> {"truck_id": str, "expires_at": datetime}

# ---------- Simple token validation (MVP) ----------
def verify_token(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(401, "Missing token")
    token = authorization.replace("Bearer ", "")
    parts = token.split("_")
    if len(parts) != 2:
        raise HTTPException(401, "Invalid token")
    role, uid = parts
    key = f"{role}_{uid}"
    if key not in users_db:
        raise HTTPException(401, "Invalid token")
    return {"role": role, "id": uid}

# ---------- Helper functions ----------
def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def validate_rate(rate: float) -> bool:
    return current_config.min_rate <= rate <= current_config.max_rate

async def call_truck_agent(truck: dict, load: dict, d_pickup: float, d_drop: float) -> float:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"http://localhost:{TRUCK_AGENT_PORT}/evaluate",
                json={"truck": truck, "load": load, "distance_to_pickup": d_pickup, "distance_pickup_to_drop": d_drop})
            return r.json().get("utility_score", 0) if r.status_code == 200 else 0
        except:
            return 0

async def call_load_agent(truck: dict, load: dict, d_pickup: float, d_drop: float) -> float:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"http://localhost:{LOAD_AGENT_PORT}/evaluate",
                json={"truck": truck, "load": load, "distance_to_pickup": d_pickup, "distance_pickup_to_drop": d_drop})
            return r.json().get("utility_score", 0) if r.status_code == 200 else 0
        except:
            return 0

async def call_warehouse_agent(warehouse_id: str, truck_id: str, load_type: str, eta: str, duration: int, deadline: str) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"http://localhost:{WAREHOUSE_AGENT_PORT}/warehouse/evaluate",
                json={"truck_id": truck_id, "warehouse_id": warehouse_id, "load_type": load_type,
                      "eta": eta, "unloading_duration": duration, "delivery_deadline": deadline})
            return r.json() if r.status_code == 200 else {"utility_score": 0}
        except:
            return {"utility_score": 0}

async def call_backhaul_agent(truck_state: dict, current_node: str, next_dest: str, candidates: list, distances: dict) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"http://localhost:{BACKHAUL_AGENT_PORT}/plan",
                json={"truck_state": truck_state, "current_node_id": current_node,
                      "next_destination_node_id": next_dest, "candidate_loads": candidates,
                      "distances": distances})
            return r.json() if r.status_code == 200 else {"action": "wait", "target_node_id": None, "load_id": None, "score": 0}
        except:
            return {"action": "wait", "target_node_id": None, "load_id": None, "score": 0}

def get_truck_status_response(truck: Truck) -> dict:
    # Compute live location if truck is traveling
    if truck.status == "TRAVELING" and truck.current_edge_id and truck.departure_time:
        edge = graph.edges.get(truck.current_edge_id)
        if edge:
            elapsed = (datetime.now() - truck.departure_time).total_seconds() / 3600.0
            progress = min(elapsed * edge.speed_kmph, edge.distance_km)
            if progress >= edge.distance_km:
                progress = edge.distance_km
            truck.progress_km = progress
    return {
        "truck_id": truck.truck_id,
        "status": truck.status,
        "current_node_id": truck.current_node_id,
        "current_edge_id": truck.current_edge_id,
        "progress_km": truck.progress_km,
        "next_destination": truck.next_destination_node_id,
        "remaining_capacity": truck.remaining_capacity,
        "assigned_pairs": truck.assigned_pairs
    }

async def update_next_action(truck_id: str):
    """Call backhaul agent and store suggested next action."""
    truck = trucks_db.get(truck_id)
    if not truck or truck.status not in ["IDLE", "AT_NODE"]:
        return
    # Build truck state for backhaul agent
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
        "accepted_loads": accepted_loads
    }
    # Candidate loads: pending loads not locked
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
    # Build distances dict (simple, only needed keys)
    distances = {}
    nodes = set([truck.current_node_id] + [c["pickup_node_id"] for c in candidates] + [l["pickup_node_id"] for l in accepted_loads] + [l["drop_node_id"] for l in accepted_loads])
    for n1 in nodes:
        for n2 in nodes:
            if n1 and n2:
                dist = graph.distance(n1, n2)
                if dist < 1e9:
                    distances[f"{n1},{n2}"] = dist
    result = await call_backhaul_agent(truck_state, truck.current_node_id, truck.next_destination_node_id, candidates, distances)
    truck_next_action[truck_id] = result
    return result

# ---------- Health ----------
async def check_agent_status(port: int) -> str:
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(f"http://localhost:{port}/health", timeout=2)
            return "up" if r.status_code == 200 else "down"
    except:
        return "down"

@app.get("/health")
async def health():
    truck = await check_agent_status(TRUCK_AGENT_PORT)
    load = await check_agent_status(LOAD_AGENT_PORT)
    warehouse = await check_agent_status(WAREHOUSE_AGENT_PORT)
    backhaul = await check_agent_status(BACKHAUL_AGENT_PORT)
    return {
        "status": "ok",
        "agents": {
            "truck": truck,
            "load": load,
            "warehouse": warehouse,
            "backhaul": backhaul,
            "coordinator": "up"
        }
    }

# ---------- Map ----------
@app.get("/map")
async def get_map():
    nodes = []
    for node in graph.nodes.values():
        node_dict = node.dict()
        node_dict["is_warehouse"] = node.node_id in node_to_warehouse
        nodes.append(node_dict)
    return {"nodes": nodes, "edges": [e.dict() for e in graph.edges.values()]}

# ---------- User Auth ----------
@app.post("/auth/register")
async def register(user: User):
    key = f"{user.role}_{user.id}"
    if key in users_db:
        raise HTTPException(400, "User already exists")
    users_db[key] = user
    log_event("USER_REGISTERED", user.id, {"role": user.role})
    return {"status": "registered"}

@app.post("/auth/login")
async def login(role: str, id: str, password: str):
    key = f"{role}_{id}"
    user = users_db.get(key)
    if not user or user.password != password:
        raise HTTPException(401, "Invalid credentials")
    return {"token": f"{role}_{id}", "role": role, "id": id}

# ---------- Truck Registration ----------
@app.post("/register/truck")
async def register_truck(truck: Truck, user=Depends(verify_token)):
    if user["role"] != "driver":
        raise HTTPException(403, "Only drivers can register trucks")
    if truck.truck_id in trucks_db:
        raise HTTPException(400, "Truck already exists")
    if not validate_rate(truck.preferred_rs_per_km):
        raise HTTPException(400, f"Rate must be between {current_config.min_rate} and {current_config.max_rate}")
    if truck.current_node_id not in graph.nodes:
        raise HTTPException(400, f"Node {truck.current_node_id} does not exist")
    truck.driver_id = user["id"]
    trucks_db[truck.truck_id] = truck
    log_event("TRUCK_REGISTERED", truck.truck_id, {"driver_id": truck.driver_id, "node": truck.current_node_id})
    return {"status": "registered"}

# ---------- Load Registration ----------
@app.post("/register/load")
async def register_load(load: Load, user=Depends(verify_token)):
    if user["role"] != "shipper":
        raise HTTPException(403, "Only shippers can register loads")
    if load.load_id in loads_db:
        raise HTTPException(400, "Load already exists")
    if not validate_rate(load.offered_rs_per_km):
        raise HTTPException(400, f"Rate must be between {current_config.min_rate} and {current_config.max_rate}")
    if load.pickup_node_id not in graph.nodes or load.drop_node_id not in graph.nodes:
        raise HTTPException(400, "Invalid node ID")
    load.shipper_id = user["id"]
    loads_db[load.load_id] = load
    log_event("LOAD_REGISTERED", load.load_id, {"shipper": load.shipper_id, "pickup": load.pickup_node_id})
    # Trigger matching for idle trucks
    asyncio.create_task(match_idle_trucks())
    return {"status": "registered"}

# ---------- Warehouse Registration ----------
@app.post("/register/warehouse")
async def register_warehouse(warehouse: Warehouse, user=Depends(verify_token)):
    if user["role"] != "warehouse":
        raise HTTPException(403, "Only warehouse managers can register warehouses")
    if warehouse.node_id not in graph.nodes:
        raise HTTPException(400, f"Node {warehouse.node_id} does not exist")
    if warehouse.warehouse_id in warehouses_db:
        raise HTTPException(400, "Warehouse already exists")
    warehouses_db[warehouse.warehouse_id] = warehouse
    node_to_warehouse[warehouse.node_id] = warehouse.warehouse_id
    log_event("WAREHOUSE_REGISTERED", warehouse.warehouse_id, {"node": warehouse.node_id})
    return {"status": "registered"}

# ---------- Driver Endpoints ----------
@app.get("/driver/{driver_id}/truck")
async def get_truck_by_driver(driver_id: str, user=Depends(verify_token)):
    if user["role"] != "driver" or user["id"] != driver_id:
        raise HTTPException(403, "Unauthorized")
    for truck in trucks_db.values():
        if truck.driver_id == driver_id:
            return {"truck_id": truck.truck_id}
    raise HTTPException(404, "No truck found for this driver")

@app.get("/truck/{truck_id}/status")
async def get_truck_status(truck_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    # Optional: check that the user owns this truck
    if user["role"] == "driver" and truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    return get_truck_status_response(truck)

@app.post("/truck/session/start")
async def start_session(truck_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    truck.status = "IDLE"
    log_event("SESSION_START", truck_id, {})
    await match_for_truck(truck_id)
    return {"status": "active", "truck_id": truck_id}

@app.post("/truck/session/end")
async def end_session(truck_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    truck.status = "INACTIVE"
    truck_next_action.pop(truck_id, None)
    log_event("SESSION_END", truck_id, {})
    return {"status": "ended"}

@app.get("/truck/{truck_id}/proposals")
async def get_proposals(truck_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    pending = [p for p in proposals_db.values() if p.truck_id == truck_id and p.status == "PENDING"]
    pending.sort(key=lambda x: x.score, reverse=True)
    return {"proposals": [p.dict() for p in pending[:5]]}

@app.post("/truck/{truck_id}/proposals/{proposal_id}/accept")
async def accept_proposal(truck_id: str, proposal_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    proposal = proposals_db.get(proposal_id)
    if not proposal or proposal.truck_id != truck_id or proposal.status != "PENDING":
        raise HTTPException(404, "Proposal not found or not pending")
    proposal.status = "ACCEPTED"
    load = loads_db[proposal.load_id]
    # Create pair
    pair_id = gen_id("pair")
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
    # Unlock load
    if proposal.load_id in locked_loads:
        del locked_loads[proposal.load_id]
    # Remove other proposals for this truck
    for p in list(proposals_db.values()):
        if p.truck_id == truck_id and p.status == "PENDING" and p.proposal_id != proposal_id:
            p.status = "EXPIRED"
            if p.load_id in locked_loads and locked_loads[p.load_id].get("truck_id") == truck_id:
                del locked_loads[p.load_id]
    # --- Warehouse agent integration: reserve dock ---
    # Determine warehouse for pickup node (if any)
    warehouse_id = node_to_warehouse.get(load.pickup_node_id)
    if warehouse_id:
        eta = (datetime.now() + timedelta(hours=1)).strftime("%H:%M")  # simplistic
        unload_duration = 30  # default
        resp = await call_warehouse_agent(warehouse_id, truck_id, load.type, eta, unload_duration, load.delivery_deadline)
        if resp.get("utility_score", 0) > 0:
            # Assign dock (pick first available dock)
            wh = warehouses_db.get(warehouse_id)
            if wh:
                # Find free dock (simplified: assign dock number 1..5 not used at that eta)
                used_docks = [st.dock_number for st in wh.scheduled_trucks if st.eta == eta]
                assigned_dock = 1
                for d in range(1, 6):
                    if d not in used_docks:
                        assigned_dock = d
                        break
                wh.scheduled_trucks.append(ScheduledTruck(
                    truck_id=truck_id,
                    load_id=load.load_id,
                    eta=eta,
                    unloading_duration=unload_duration,
                    dock_number=assigned_dock
                ))
                log_event("DOCK_ASSIGNED", warehouse_id, {"truck": truck_id, "dock": assigned_dock, "eta": eta})
    # --- Update next action via backhaul agent ---
    await update_next_action(truck_id)
    log_event("PROPOSAL_ACCEPTED", truck_id, {"proposal_id": proposal_id, "load_id": proposal.load_id})
    return {"status": "accepted", "pair_id": pair_id}

@app.post("/truck/{truck_id}/proposals/{proposal_id}/reject")
async def reject_proposal(truck_id: str, proposal_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    proposal = proposals_db.get(proposal_id)
    if not proposal or proposal.truck_id != truck_id or proposal.status != "PENDING":
        raise HTTPException(404, "Proposal not found or not pending")
    proposal.status = "REJECTED"
    if proposal.load_id in locked_loads and locked_loads[proposal.load_id].get("truck_id") == truck_id:
        del locked_loads[proposal.load_id]
    log_event("PROPOSAL_REJECTED", truck_id, {"proposal_id": proposal_id})
    return {"status": "rejected"}

@app.get("/truck/{truck_id}/pending")
async def get_pending_deliveries(truck_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    pending = []
    for pair_id in truck.assigned_pairs:
        pair = pairs_db.get(pair_id)
        if pair and pair.status == "PENDING":
            pending.append(pair.dict())
    return {"pending": pending}

@app.get("/truck/{truck_id}/next-action")
async def get_next_action(truck_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    action = truck_next_action.get(truck_id, {"action": "wait", "target_node_id": None, "load_id": None, "score": 0})
    return action

@app.post("/truck/{truck_id}/depart")
async def depart(truck_id: str, to_node_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    # Find edge
    edge = None
    for e in graph.edges.values():
        if e.from_node == truck.current_node_id and e.to_node == to_node_id:
            edge = e
            break
    if not edge:
        raise HTTPException(400, f"No direct edge from {truck.current_node_id} to {to_node_id}")
    truck.status = "TRAVELING"
    truck.current_edge_id = edge.edge_id
    truck.departure_time = datetime.now()
    truck.progress_km = 0.0
    truck.current_node_id = None
    log_event("TRUCK_DEPART", truck_id, {"to": to_node_id, "edge": edge.edge_id})
    return {"status": "traveling", "edge_id": edge.edge_id}

@app.post("/truck/{truck_id}/arrive")
async def arrive(truck_id: str, node_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    truck.status = "AT_NODE"
    truck.current_node_id = node_id
    truck.current_edge_id = None
    truck.progress_km = 0.0
    truck.departure_time = None
    log_event("TRUCK_ARRIVE", truck_id, {"node": node_id})
    # Update next action via backhaul agent
    await update_next_action(truck_id)
    return {"status": "arrived"}

@app.post("/delivery/complete")
async def complete_delivery(truck_id: str, pair_id: str, user=Depends(verify_token)):
    truck = trucks_db.get(truck_id)
    pair = pairs_db.get(pair_id)
    if not truck or not pair:
        raise HTTPException(404, "Truck or pair not found")
    if user["role"] != "driver" or truck.driver_id != user["id"]:
        raise HTTPException(403, "Unauthorized")
    if pair.status != "PENDING":
        raise HTTPException(400, "Pair already completed")
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
    # Update next action after delivery
    await update_next_action(truck_id)
    log_event("DELIVERY_COMPLETE", truck_id, {"pair_id": pair_id, "earnings": pair.earnings})
    # Trigger matching for idle truck again
    if truck.status == "IDLE":
        await match_for_truck(truck_id)
    return {"status": "delivered", "earnings": pair.earnings}

# ---------- Earnings Endpoints ----------
@app.get("/driver/{driver_id}/earnings")
async def get_earnings(driver_id: str, period: str = "monthly", user=Depends(verify_token)):
    if user["role"] != "driver" or user["id"] != driver_id:
        raise HTTPException(403, "Unauthorized")
    driver_earnings = [e for e in earnings_db if e.driver_id == driver_id]
    if period == "today":
        today = datetime.now().date()
        filtered = [e for e in driver_earnings if e.completed_at.date() == today]
        total = sum(e.earnings for e in filtered)
        return {"total": total}
    elif period == "monthly":
        monthly = {}
        for e in driver_earnings:
            key = e.completed_at.strftime("%Y-%m")
            monthly[key] = monthly.get(key, 0) + e.earnings
        return {"monthly": monthly}
    elif period == "yearly":
        yearly = {}
        for e in driver_earnings:
            key = e.completed_at.strftime("%Y")
            yearly[key] = yearly.get(key, 0) + e.earnings
        return {"yearly": yearly}
    else:
        return {"total": sum(e.earnings for e in driver_earnings)}

@app.get("/driver/{driver_id}/earnings/breakdown")
async def earnings_breakdown(driver_id: str, user=Depends(verify_token)):
    if user["role"] != "driver" or user["id"] != driver_id:
        raise HTTPException(403, "Unauthorized")
    records = [e.dict() for e in earnings_db if e.driver_id == driver_id]
    return {"loads": records}

# ---------- Shipper Endpoints ----------
@app.get("/shipper/{shipper_id}/loads")
async def get_shipper_loads(shipper_id: str, user=Depends(verify_token)):
    if user["role"] != "shipper" or user["id"] != shipper_id:
        raise HTTPException(403, "Unauthorized")
    loads = [l.dict() for l in loads_db.values() if l.shipper_id == shipper_id]
    return {"loads": loads}

@app.get("/load/{load_id}/status")
async def get_load_status(load_id: str, user=Depends(verify_token)):
    load = loads_db.get(load_id)
    if not load:
        raise HTTPException(404, "Load not found")
    # Shipper can view own load; admin can view all
    if user["role"] not in ["shipper", "admin"] or (user["role"] == "shipper" and load.shipper_id != user["id"]):
        raise HTTPException(403, "Unauthorized")
    return load.dict()

@app.get("/shipper/{shipper_id}/history")
async def shipper_history(shipper_id: str, user=Depends(verify_token)):
    if user["role"] != "shipper" or user["id"] != shipper_id:
        raise HTTPException(403, "Unauthorized")
    completed = [l.dict() for l in loads_db.values() if l.shipper_id == shipper_id and l.status == "DELIVERED"]
    return {"loads": completed}

@app.get("/shipper/{shipper_id}/analytics")
async def shipper_analytics(shipper_id: str, user=Depends(verify_token)):
    if user["role"] != "shipper" or user["id"] != shipper_id:
        raise HTTPException(403, "Unauthorized")
    loads = [l for l in loads_db.values() if l.shipper_id == shipper_id]
    # Simple: total loads, monthly counts from creation date (if we had it) – placeholder
    return {"total_loads": len(loads), "monthly": {}}

@app.get("/shipper/{shipper_id}/map-data")
async def shipper_map_data(shipper_id: str, user=Depends(verify_token)):
    if user["role"] != "shipper" or user["id"] != shipper_id:
        raise HTTPException(403, "Unauthorized")
    # Get all loads for this shipper
    my_loads = [l for l in loads_db.values() if l.shipper_id == shipper_id]
    # Pickup and drop warehouse nodes (unique)
    pickup_nodes = set()
    drop_nodes = set()
    for load in my_loads:
        pickup_nodes.add(load.pickup_node_id)
        drop_nodes.add(load.drop_node_id)
    # Trucks carrying his loads (assigned pairs)
    trucks_positions = []
    for load in my_loads:
        # find pair for this load
        pair = next((p for p in pairs_db.values() if p.load_id == load.load_id), None)
        if pair and pair.status in ["PENDING", "PICKED_UP"]:
            truck = trucks_db.get(pair.truck_id)
            if truck:
                pos = get_truck_status_response(truck)
                trucks_positions.append({
                    "truck_id": truck.truck_id,
                    "load_id": load.load_id,
                    "current_node_id": pos["current_node_id"],
                    "current_edge_id": pos["current_edge_id"],
                    "progress_km": pos["progress_km"],
                    "status": truck.status
                })
    return {
        "pickup_warehouses": list(pickup_nodes),
        "drop_warehouses": list(drop_nodes),
        "trucks": trucks_positions
    }

# ---------- Warehouse Endpoints ----------
@app.get("/warehouse/{warehouse_id}/details")
async def get_warehouse(warehouse_id: str, user=Depends(verify_token)):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    if user["role"] != "warehouse" or user["id"] != warehouse_id:
        raise HTTPException(403, "Unauthorized")
    return wh.dict()

@app.put("/warehouse/{warehouse_id}/details")
async def update_warehouse(warehouse_id: str, compatible_load_types: List[str] = None, user=Depends(verify_token)):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    if user["role"] != "warehouse" or user["id"] != warehouse_id:
        raise HTTPException(403, "Unauthorized")
    if compatible_load_types is not None:
        wh.compatible_load_types = compatible_load_types
    return {"status": "updated"}

@app.get("/warehouse/{warehouse_id}/schedule")
async def get_warehouse_schedule(warehouse_id: str, user=Depends(verify_token)):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    if user["role"] != "warehouse" or user["id"] != warehouse_id:
        raise HTTPException(403, "Unauthorized")
    return {"scheduled_trucks": [st.dict() for st in wh.scheduled_trucks]}

@app.get("/warehouse/{warehouse_id}/active-loads")
async def get_active_loads(warehouse_id: str, user=Depends(verify_token)):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    if user["role"] != "warehouse" or user["id"] != warehouse_id:
        raise HTTPException(403, "Unauthorized")
    loads = []
    for load_id in wh.active_loads:
        load = loads_db.get(load_id)
        if load and load.status not in ["DELIVERED", "CANCELLED"]:
            loads.append(load.dict())
    return {"loads": loads}

@app.put("/warehouse/{warehouse_id}/dock/{dock_number}/free")
async def free_dock(warehouse_id: str, dock_number: int, user=Depends(verify_token)):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Warehouse not found")
    if user["role"] != "warehouse" or user["id"] != warehouse_id:
        raise HTTPException(403, "Unauthorized")
    wh.scheduled_trucks = [st for st in wh.scheduled_trucks if st.dock_number != dock_number]
    log_event("DOCK_FREED", warehouse_id, {"dock": dock_number})
    return {"status": "freed"}

@app.get("/warehouse/{warehouse_id}/history")
async def warehouse_history(warehouse_id: str, user=Depends(verify_token)):
    if user["role"] != "warehouse" or user["id"] != warehouse_id:
        raise HTTPException(403, "Unauthorized")
    logs = get_logs(entity_id=warehouse_id)
    completed = [l for l in logs if l['event_type'] == 'TRUCK_ARRIVE']
    return {"visits": completed}

@app.get("/warehouse/{warehouse_id}/analytics")
async def warehouse_analytics(warehouse_id: str, user=Depends(verify_token)):
    if user["role"] != "warehouse" or user["id"] != warehouse_id:
        raise HTTPException(403, "Unauthorized")
    logs = get_logs(entity_id=warehouse_id)
    arrivals = [l for l in logs if l['event_type'] == 'TRUCK_ARRIVE']
    daily = {}
    for a in arrivals:
        day = a['timestamp'][:10]
        daily[day] = daily.get(day, 0) + 1
    return {"daily": daily, "total": len(arrivals)}

# ---------- Admin Endpoints ----------
@app.get("/admin/state/trucks")
async def admin_trucks(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    return {"trucks": [t.dict() for t in trucks_db.values()]}

@app.get("/admin/state/loads")
async def admin_loads(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    return {"loads": [l.dict() for l in loads_db.values()]}

@app.get("/admin/state/warehouses")
async def admin_warehouses(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    return {"warehouses": [w.dict() for w in warehouses_db.values()]}

@app.get("/admin/state/pairs")
async def admin_pairs(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    return {"pairs": [p.dict() for p in pairs_db.values()]}

@app.get("/admin/state/proposals")
async def admin_proposals(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    return {"proposals": [p.dict() for p in proposals_db.values()]}

@app.get("/admin/earnings/trucks")
async def admin_earnings(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    truck_earnings = {}
    for e in earnings_db:
        driver = e.driver_id
        truck_id = None
        for t in trucks_db.values():
            if t.driver_id == driver:
                truck_id = t.truck_id
                break
        if truck_id:
            truck_earnings[truck_id] = truck_earnings.get(truck_id, 0) + e.earnings
    return {"earnings": truck_earnings}

@app.get("/admin/logs")
async def admin_logs(entity_id: str = None, event_type: str = None, is_notification: bool = None, user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    logs = get_logs(entity_id=entity_id, event_type=event_type, is_notification=is_notification)
    return {"logs": logs}

@app.get("/admin/users")
async def admin_users(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    return {"users": [u.dict() for u in users_db.values()]}

@app.get("/admin/agents/status")
async def agents_status(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    truck = await check_agent_status(TRUCK_AGENT_PORT)
    load = await check_agent_status(LOAD_AGENT_PORT)
    warehouse = await check_agent_status(WAREHOUSE_AGENT_PORT)
    backhaul = await check_agent_status(BACKHAUL_AGENT_PORT)
    return {
        "truck": truck,
        "load": load,
        "warehouse": warehouse,
        "backhaul": backhaul,
        "coordinator": "up"
    }

@app.get("/admin/config")
async def get_config(user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    return current_config.dict()

@app.post("/admin/config")
async def update_config(config: SystemConfig, user=Depends(verify_token)):
    if user["role"] != "admin":
        raise HTTPException(403, "Unauthorized")
    global current_config
    current_config = config
    log_event("CONFIG_UPDATED", "system", config.dict())
    return {"status": "updated"}

# ---------- Matching Logic ----------
async def match_for_truck(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck or truck.status != "IDLE":
        return
    candidates = []
    for load in loads_db.values():
        if load.status != "PENDING":
            continue
        if load.weight > truck.remaining_capacity:
            continue
        dist = graph.distance(truck.current_node_id, load.pickup_node_id)
        if dist > current_config.nearby_radius_km * 2:
            continue
        candidates.append(load)
    if not candidates:
        return
    scored = []
    for load in candidates:
        dist_pickup = graph.distance(truck.current_node_id, load.pickup_node_id)
        dist_drop = graph.distance(load.pickup_node_id, load.drop_node_id)
        truck_score = await call_truck_agent(truck.dict(), load.dict(), dist_pickup, dist_drop)
        load_score = await call_load_agent(truck.dict(), load.dict(), dist_pickup, dist_drop)
        avg_score = (truck_score + load_score) / 2
        scored.append((load, avg_score, dist_pickup))
    scored.sort(key=lambda x: x[1], reverse=True)
    for load, score, dist_pickup in scored[:5]:
        if load.load_id in locked_loads:
            continue
        locked_loads[load.load_id] = {"truck_id": truck_id, "expires_at": datetime.now() + timedelta(seconds=60)}
        proposal_id = gen_id("prop")
        detour = dist_pickup
        extra_time = detour / current_config.default_speed_kmph * 60
        earnings = detour * load.offered_rs_per_km
        proposal = Proposal(
            proposal_id=proposal_id,
            truck_id=truck_id,
            load_id=load.load_id,
            proposal_type="initial" if not truck.assigned_pairs else "intermediate",
            pickup_node_id=load.pickup_node_id,
            detour_km=detour,
            extra_time_min=int(extra_time),
            offered_rate=load.offered_rs_per_km,
            estimated_earnings=earnings,
            score=score,
            expires_at=datetime.now() + timedelta(minutes=5)
        )
        proposals_db[proposal_id] = proposal
        log_event("PROPOSAL_CREATED", truck_id, {"load_id": load.load_id, "score": score}, is_notification=True, user_role="driver", user_id=truck.driver_id)

async def match_idle_trucks():
    for truck in trucks_db.values():
        if truck.status == "IDLE":
            await match_for_truck(truck.truck_id)

# ---------- WebSocket ----------
@app.websocket("/ws/driver/{truck_id}")
async def ws_driver(websocket: WebSocket, truck_id: str):
    await manager.connect(websocket, "driver", truck_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "driver", truck_id)

# ---------- Run ----------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=COORDINATOR_PORT)