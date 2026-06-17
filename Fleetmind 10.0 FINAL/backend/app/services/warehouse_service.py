from typing import Optional, List
import asyncio
from datetime import datetime
from ..core.database import *
from ..core.graph import graph
from ..core.config import settings
from ..models.domain import Warehouse, ScheduledTruck, Load
from ..models.requests import RegisterWarehouseRequest, UpdateWarehouseRequest
from ..utils.helpers import parse_time_to_minutes
from ..utils.logger import log_event
from .scoring import warehouse_utility_score

def register_warehouse(data: RegisterWarehouseRequest) -> dict:
    warehouse_id = data.warehouse_id
    node_id = data.node_id
    if node_id not in graph.nodes:
        return {"success": False, "error": f"Node {node_id} does not exist"}
    if warehouse_id in warehouses_db:
        return {"success": False, "error": "Warehouse already exists"}
    warehouse = Warehouse(**data.dict())
    warehouses_db[warehouse_id] = warehouse
    node_to_warehouse[node_id] = warehouse_id
    log_event("WAREHOUSE_REGISTERED", warehouse_id, {"node": node_id})
    return {"success": True, "warehouse": warehouse.dict()}

def get_warehouse_details(warehouse_id: str) -> Optional[dict]:
    wh = warehouses_db.get(warehouse_id)
    return wh.dict() if wh else None

def update_warehouse(warehouse_id: str, compatible_load_types: List[str]) -> dict:
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        return {"success": False, "error": "Warehouse not found"}
    wh.compatible_load_types = compatible_load_types
    log_event("WAREHOUSE_UPDATED", warehouse_id, {"compatible_types": compatible_load_types})
    return {"success": True, "warehouse": wh.dict()}

def get_warehouse_schedule(warehouse_id: str) -> list:
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        return []
    return [st.dict() for st in wh.scheduled_trucks]

def get_warehouse_active_loads(warehouse_id: str) -> list:
    """
    Dynamically compute active loads for the warehouse.
    A load is considered active if its status is not DELIVERED or CANCELLED,
    and its pickup or drop node matches the warehouse's node.
    """
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        return []
    active = [
        l.dict() for l in loads_db.values()
        if l.status not in ["DELIVERED", "CANCELLED"]
        and (l.pickup_node_id == wh.node_id or l.drop_node_id == wh.node_id)
    ]
    return active

def free_dock(warehouse_id: str, dock_number: int) -> dict:
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        return {"success": False, "error": "Warehouse not found"}
    wh.scheduled_trucks = [st for st in wh.scheduled_trucks if st.dock_number != dock_number]
    log_event("DOCK_FREED", warehouse_id, {"dock": dock_number})
    return {"success": True}

def get_warehouse_history(warehouse_id: str) -> list:
    from ..utils.logger import get_logs
    return get_logs(entity_id=warehouse_id)

def get_warehouse_analytics(warehouse_id: str) -> dict:
    from ..utils.logger import get_logs
    logs = get_logs(entity_id=warehouse_id)
    arrivals = [l for l in logs if l.get('event_type') == 'TRUCK_ARRIVE']
    daily = {}
    for a in arrivals:
        ts = a.get('timestamp')
        if ts:
            day = ts[:10] if isinstance(ts, str) else ts.strftime("%Y-%m-%d")
            daily[day] = daily.get(day, 0) + 1
    return {"daily": daily, "total": len(arrivals)}

async def schedule_truck_at_warehouse(warehouse_id: str, truck_id: str, load: Load):
    """Called when a proposal is accepted to reserve a dock."""
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        return
    eta = datetime.now().strftime("%H:%M")
    unloading_duration = 30
    eta_minutes = parse_time_to_minutes(eta)
    deadline_minutes = parse_time_to_minutes(load.delivery_deadline)
    result = warehouse_utility_score(wh, load.type, eta_minutes, unloading_duration, deadline_minutes)
    if result["utility_score"] > 50 and result["assigned_dock"]:
        scheduled = ScheduledTruck(
            truck_id=truck_id,
            load_id=load.load_id,
            eta=eta,
            unloading_duration=unloading_duration,
            dock_number=result["assigned_dock"]
        )
        wh.scheduled_trucks.append(scheduled)
        log_event("DOCK_ASSIGNED", warehouse_id, {"truck": truck_id, "dock": result["assigned_dock"], "eta": eta})