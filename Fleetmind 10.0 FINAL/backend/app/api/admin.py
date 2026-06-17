from fastapi import APIRouter, HTTPException
from typing import Optional
from ..core.database import *
from ..core.config import settings
from ..models.requests import UpdateConfigRequest
from ..services import truck_service
from ..utils.logger import get_logs
from ..core.graph import graph

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/state/trucks")
async def admin_trucks():
    return {"trucks": [t.dict() for t in trucks_db.values()]}

@router.get("/state/loads")
async def admin_loads():
    return {"loads": [l.dict() for l in loads_db.values()]}

@router.get("/state/warehouses")
async def admin_warehouses():
    return {"warehouses": [w.dict() for w in warehouses_db.values()]}

@router.get("/state/pairs")
async def admin_pairs():
    return {"pairs": [p.dict() for p in pairs_db.values()]}

@router.get("/state/proposals")
async def admin_proposals():
    return {"proposals": [p.dict() for p in proposals_db.values()]}

@router.get("/earnings/trucks")
async def admin_earnings():
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

@router.get("/logs")
async def admin_logs(entity_id: Optional[str] = None, event_type: Optional[str] = None, is_notification: Optional[bool] = None):
    return {"logs": get_logs(entity_id, event_type, is_notification)}

@router.get("/users")
async def admin_users():
    return {"users": [u.dict() for u in users_db.values()]}

@router.get("/agents/status")
async def agents_status():
    return {"truck": "up", "load": "up", "warehouse": "up", "backhaul": "up", "coordinator": "up"}

@router.get("/config")
async def get_config():
    return current_config.dict()

@router.post("/config")
async def update_config(request: UpdateConfigRequest):
    global current_config
    if request.min_rate is not None and request.max_rate is not None and request.min_rate > request.max_rate:
        raise HTTPException(400, "min_rate cannot be greater than max_rate")
    if request.min_rate is not None:
        current_config.min_rate = request.min_rate
    if request.max_rate is not None:
        current_config.max_rate = request.max_rate
    if request.detour_threshold_km is not None:
        current_config.detour_threshold_km = request.detour_threshold_km
    if request.nearby_radius_km is not None:
        current_config.nearby_radius_km = request.nearby_radius_km
    if request.default_speed_kmph is not None:
        current_config.default_speed_kmph = request.default_speed_kmph
    if request.deadline_buffer_min is not None:
        current_config.deadline_buffer_min = request.deadline_buffer_min
    return {"status": "updated"}

@router.get("/map")
async def get_map():
    nodes = []
    for node in graph.nodes.values():
        node_dict = node.dict()
        node_dict["is_warehouse"] = node.node_id in node_to_warehouse
        nodes.append(node_dict)
    return {"nodes": nodes, "edges": [e.dict() for e in graph.edges.values()]}