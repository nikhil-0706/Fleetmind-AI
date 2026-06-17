from typing import Optional, List
import asyncio
from ..core.database import *
from ..core.graph import graph
from ..core.config import settings
from ..models.domain import Load
from ..models.requests import RegisterLoadRequest
from ..utils.helpers import validate_rate
from ..utils.logger import log_event
from .matching_service import match_idle_trucks

def register_load(data: RegisterLoadRequest) -> dict:
    load_id = data.load_id
    if load_id in loads_db:
        return {"success": False, "error": "Load already exists"}

    if not validate_rate(data.offered_rs_per_km, current_config):
        return {"success": False, "error": f"Rate must be between {current_config.min_rate} and {current_config.max_rate}"}

    # -- NEW VALIDATION: pickup and drop nodes must be warehouses --
    if data.pickup_node_id not in node_to_warehouse:
        return {"success": False, "error": f"Pickup node {data.pickup_node_id} does not have a registered warehouse"}
    if data.drop_node_id not in node_to_warehouse:
        return {"success": False, "error": f"Drop node {data.drop_node_id} does not have a registered warehouse"}

    # Existing node existence check (still valid)
    if data.pickup_node_id not in graph.nodes or data.drop_node_id not in graph.nodes:
        return {"success": False, "error": "Invalid node ID"}

    load = Load(**data.dict())
    loads_db[load_id] = load
    log_event("LOAD_REGISTERED", load_id, {"shipper": load.shipper_id, "pickup": load.pickup_node_id})
    asyncio.create_task(match_idle_trucks())
    return {"success": True, "load": load.dict()}

def get_load_status(load_id: str) -> Optional[dict]:
    load = loads_db.get(load_id)
    return load.dict() if load else None

def get_shipper_loads(shipper_id: str) -> list:
    return [l.dict() for l in loads_db.values() if l.shipper_id == shipper_id]

def get_shipper_history(shipper_id: str) -> list:
    return [l.dict() for l in loads_db.values() if l.shipper_id == shipper_id and l.status == "DELIVERED"]

def get_shipper_analytics(shipper_id: str) -> dict:
    loads = [l for l in loads_db.values() if l.shipper_id == shipper_id]
    return {"total_loads": len(loads), "monthly": {}}

def get_shipper_map_data(shipper_id: str) -> dict:
    my_loads = [l for l in loads_db.values() if l.shipper_id == shipper_id]
    pickup_nodes = set()
    drop_nodes = set()
    for load in my_loads:
        pickup_nodes.add(load.pickup_node_id)
        drop_nodes.add(load.drop_node_id)

    trucks_positions = []
    for load in my_loads:
        pair = next((p for p in pairs_db.values() if p.load_id == load.load_id), None)
        if pair and pair.status in ["PENDING", "PICKED_UP"]:
            truck = trucks_db.get(pair.truck_id)
            if truck:
                from .truck_service import get_truck_status
                pos = get_truck_status(truck.truck_id)
                if pos:
                    trucks_positions.append({
                        "truck_id": truck.truck_id,
                        "load_id": load.load_id,
                        "current_node_id": pos.get("current_node_id"),
                        "current_edge_id": pos.get("current_edge_id"),
                        "progress_km": pos.get("progress_km", 0),
                        "status": truck.status
                    })

    return {"pickup_warehouses": list(pickup_nodes), "drop_warehouses": list(drop_nodes), "trucks": trucks_positions}