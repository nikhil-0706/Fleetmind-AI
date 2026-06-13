import uuid
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from common.models import *
from common.config import *
from common.utils import log_event, get_logs
from .graph import graph
from .websocket import manager
import httpx

app = FastAPI(title="Coordinator Agent")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

# ---------- In-memory stores ----------
trucks_db: Dict[str, Truck] = {}
loads_db: Dict[str, Load] = {}
pairs_db: Dict[str, TruckLoadPair] = {}
warehouses_db: Dict[str, Warehouse] = {}
node_to_warehouse: Dict[str, str] = {}
completed_deliveries: List[dict] = []
earnings_records: Dict[str, List[EarningsRecord]] = {}
sessions: Dict[str, dict] = {}
intermediate_proposals: Dict[str, IntermediateProposal] = {}
current_min_rate = MIN_RATE
current_max_rate = MAX_RATE

def gen_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:8]}"

def validate_rate(rate: float) -> bool:
    return current_min_rate <= rate <= current_max_rate

# ---------- Agent HTTP clients ----------
async def call_truck_agent(truck: dict, load: dict, d_pickup: float, d_drop: float) -> float:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"http://localhost:{TRUCK_AGENT_PORT}/evaluate",
                json={"truck": truck, "load": load, "distance_to_pickup": d_pickup, "distance_pickup_to_drop": d_drop})
            return r.json().get("utility_score", 0) if r.status_code == 200 else 0
        except: return 0

async def call_load_agent(truck: dict, load: dict, d_pickup: float, d_drop: float) -> float:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"http://localhost:{LOAD_AGENT_PORT}/evaluate",
                json={"truck": truck, "load": load, "distance_to_pickup": d_pickup, "distance_pickup_to_drop": d_drop})
            return r.json().get("utility_score", 0) if r.status_code == 200 else 0
        except: return 0

async def call_warehouse_agent(warehouse_id: str, truck_id: str, load_type: str, eta: str, duration: int, deadline: str) -> dict:
    async with httpx.AsyncClient() as client:
        try:
            r = await client.post(f"http://localhost:{WAREHOUSE_AGENT_PORT}/warehouse/evaluate",
                json={"truck_id": truck_id, "warehouse_id": warehouse_id, "load_type": load_type,
                      "eta": eta, "unloading_duration": duration, "delivery_deadline": deadline})
            return r.json() if r.status_code == 200 else {"utility_score": 0}
        except: return {"utility_score": 0}

# ---------- Helper functions ----------
def get_truck_status_response(truck: Truck) -> dict:
    return {
        "truck_id": truck.truck_id,
        "status": truck.status,
        "current_node_id": truck.current_node_id,
        "current_edge_id": truck.current_edge_id,
        "progress_km": truck.progress_km,
        "next_destination": truck.next_destination_node_id,
        "remaining_capacity": truck.remaining_capacity,
        "remaining_drive_hours": truck.remaining_drive_hours,
        "current_load_weight": truck.current_load_weight,
        "assigned_pairs": truck.assigned_pairs
    }

# ---------- Endpoints ----------

# Health
@app.get("/health")
async def health():
    return {"status": "ok"}

# Map
@app.get("/map")
async def get_map():
    nodes = []
    for node in graph.nodes.values():
        node_dict = node.dict()
        # A node is a warehouse if a warehouse is registered at that node
        node_dict["is_warehouse"] = node.node_id in node_to_warehouse
        nodes.append(node_dict)
    return {"nodes": nodes, "edges": [e.dict() for e in graph.edges.values()]}

# Register truck
@app.post("/register/truck")
async def register_truck(truck: Truck):
    if truck.truck_id in trucks_db:
        raise HTTPException(400, "Truck already exists")
    if not validate_rate(truck.preferred_rs_per_km):
        raise HTTPException(400, f"Rate must be between {current_min_rate} and {current_max_rate}")
    trucks_db[truck.truck_id] = truck
    log_event("TRUCK_REGISTERED", truck.truck_id, {"node": truck.current_node_id})
    return {"status": "registered"}

# Register load
@app.post("/register/load")
async def register_load(load: Load):
    if load.load_id in loads_db:
        raise HTTPException(400, "Load already exists")
    if not validate_rate(load.offered_rs_per_km):
        raise HTTPException(400, f"Rate must be between {current_min_rate} and {current_max_rate}")
    loads_db[load.load_id] = load
    wh_id = node_to_warehouse.get(load.pickup_node_id)
    if wh_id and wh_id in warehouses_db:
        warehouses_db[wh_id].active_loads.append(load.load_id)
    log_event("LOAD_REGISTERED", load.load_id, {"pickup": load.pickup_node_id})
    return {"status": "registered"}

# Register warehouse
@app.post("/register/warehouse")
async def register_warehouse(warehouse: Warehouse):
    if warehouse.node_id not in graph.nodes:
        raise HTTPException(400, f"Node {warehouse.node_id} does not exist in the map")
    warehouses_db[warehouse.warehouse_id] = warehouse
    node_to_warehouse[warehouse.node_id] = warehouse.warehouse_id
    return {"status": "registered"}

# Truck status
@app.get("/truck/{truck_id}/status")
async def get_truck_status(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        # Return mock for demo
        return {
            "truck_id": truck_id,
            "status": "IDLE",
            "current_node_id": "N1",
            "current_edge_id": None,
            "progress_km": 0,
            "next_destination": None,
            "remaining_capacity": 20,
            "remaining_drive_hours": 8,
            "current_load_weight": 0,
            "assigned_pairs": []
        }
    return get_truck_status_response(truck)

# Truck route
@app.get("/truck/{truck_id}/route")
async def get_truck_route(truck_id: str):
    # For demo, return mock
    return {
        "stops": [
            {"node_id": "N1", "type": "pickup", "load_id": "L1", "eta": "10:30", "status": "PENDING"},
            {"node_id": "N5", "type": "drop", "load_id": "L1", "eta": "12:00", "status": "PENDING"}
        ]
    }

# Session start/end
@app.post("/truck/session/start")
async def start_session(data: dict):
    truck_id = data.get("truck_id")
    hours = data.get("remaining_drive_hours")
    sessions[truck_id] = {"remaining_hours": hours, "start_time": datetime.now()}
    if truck_id in trucks_db:
        trucks_db[truck_id].remaining_drive_hours = hours
        trucks_db[truck_id].status = "IDLE"
    return {"status": "active", "session_id": f"sess_{truck_id}", "remaining_hours": hours}

@app.post("/truck/session/end")
async def end_session(data: dict):
    truck_id = data.get("truck_id")
    # calculate earnings (mock)
    earnings = 1250.0
    return {"status": "ended", "earnings": earnings}

@app.get("/truck/{truck_id}/session/status")
async def get_session_status(truck_id: str):
    ses = sessions.get(truck_id, {})
    return {"active": True, "remaining_hours": ses.get("remaining_hours", 8), "total_earnings_this_session": 0}

# Depart
@app.post("/truck/{truck_id}/depart")
async def depart(truck_id: str, to_node_id: str):
    # Find edge
    edge = next((e for e in graph.edges.values() if e.from_node == "N1" and e.to_node == to_node_id), None)
    if not edge:
        edge = next(iter(graph.edges.values()))  # fallback
    travel_hours = edge.distance_km / edge.speed_kmph
    eta = (datetime.now() + timedelta(hours=travel_hours)).strftime("%H:%M")
    # Update truck status if exists
    if truck_id in trucks_db:
        trucks_db[truck_id].status = "TRAVELING"
        trucks_db[truck_id].current_edge_id = edge.edge_id
        trucks_db[truck_id].progress_km = 0
        trucks_db[truck_id].current_node_id = None
    return {"status": "traveling", "edge_id": edge.edge_id, "eta": eta}

# Location update
@app.post("/truck/{truck_id}/location")
async def update_location(truck_id: str, edge_id: str, progress_km: float):
    # Check for intermediate pickup (mock)
    return {"status": "updated", "intermediate_proposal": None}

# Arrive
@app.post("/truck/{truck_id}/arrive")
async def arrive(truck_id: str, node_id: str):
    if truck_id in trucks_db:
        trucks_db[truck_id].status = "AT_NODE"
        trucks_db[truck_id].current_node_id = node_id
        trucks_db[truck_id].current_edge_id = None
        trucks_db[truck_id].progress_km = 0
    return {"status": "arrived", "destination_reached": True, "next_destination": "N5"}

# Delivery complete
@app.post("/delivery/complete")
async def complete_delivery(data: dict):
    truck_id = data.get("truck_id")
    pair_id = data.get("pair_id")
    # Store completion
    completed_deliveries.append({"truck_id": truck_id, "pair_id": pair_id, "earnings": 350, "completed_at": datetime.now().isoformat()})
    return {"status": "delivered", "earnings": 350, "remaining_pairs": 0}

# Intermediate proposal
@app.get("/truck/{truck_id}/pending_proposal")
async def get_pending_proposal(truck_id: str):
    return None

@app.post("/truck/{truck_id}/respond_proposal")
async def respond_proposal(truck_id: str, proposal_id: str, accepted: bool):
    return {"status": "accepted" if accepted else "rejected"}

# Earnings
@app.get("/driver/{driver_id}/earnings")
async def get_earnings(driver_id: str):
    return {"total": 19100, "daily": {"2025-01-15": 1250}, "weekly": {"Week 3": 5800}}

@app.get("/driver/{driver_id}/earnings/breakdown")
async def get_earnings_breakdown(driver_id: str):
    return {"loads": [{"load_id": "L1", "earnings": 7800, "distance_km": 150, "rate": 52}]}

@app.get("/driver/{driver_id}/deliveries/completed")
async def get_completed_deliveries(driver_id: str):
    return {"deliveries": completed_deliveries}

# Shipper endpoints
@app.get("/shipper/{shipper_id}/loads")
async def get_shipper_loads(shipper_id: str):
    loads = [l for l in loads_db.values() if l.shipper_id == shipper_id]
    return {"loads": [l.dict() for l in loads]}

@app.get("/load/{load_id}/status")
async def get_load_status(load_id: str):
    load = loads_db.get(load_id)
    if not load:
        return {"load_id": load_id, "status": "UNKNOWN"}
    return load.dict()

# Warehouse endpoints
@app.get("/warehouse/{warehouse_id}/schedule")
async def get_warehouse_schedule(warehouse_id: str):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        return {"scheduled_trucks": []}
    return {"scheduled_trucks": wh.scheduled_trucks}

@app.put("/warehouse/{warehouse_id}/docks")
async def update_docks(warehouse_id: str, total_docks: int):
    wh = warehouses_db.get(warehouse_id)
    if wh:
        wh.total_docks = total_docks
    return {"status": "updated"}

@app.get("/warehouse/{warehouse_id}/active_loads")
async def get_active_loads(warehouse_id: str):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        return {"loads": []}
    return {"loads": [{"load_id": lid} for lid in wh.active_loads]}

# Admin
@app.get("/admin/state")
async def admin_state():
    return {
        "trucks": [t.dict() for t in trucks_db.values()],
        "loads": [l.dict() for l in loads_db.values()],
        "warehouses": [w.dict() for w in warehouses_db.values()],
        "pairs": [p.dict() for p in pairs_db.values()]
    }

@app.post("/admin/override/rate_cap")
async def override_rate_cap(min_rate: float, max_rate: float):
    global current_min_rate, current_max_rate
    current_min_rate = min_rate
    current_max_rate = max_rate
    return {"status": "updated"}

@app.get("/admin/logs")
async def get_admin_logs(entity: str = None):
    logs = get_logs(entity=entity)
    return {"logs": logs}

# WebSockets (stubs)
@app.websocket("/ws/driver/{truck_id}")
async def ws_driver(websocket: WebSocket, truck_id: str):
    await manager.connect(websocket, "driver", truck_id)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "driver", truck_id)

# Run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=COORDINATOR_PORT)