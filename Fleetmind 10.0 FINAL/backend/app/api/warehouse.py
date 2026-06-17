from fastapi import APIRouter, HTTPException
from typing import List
from ..models.requests import RegisterWarehouseRequest
from ..services import warehouse_service

router = APIRouter(prefix="/warehouse", tags=["warehouse"])

@router.post("/register")
async def register_warehouse(data: RegisterWarehouseRequest):
    result = warehouse_service.register_warehouse(data)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result

@router.get("/{warehouse_id}/details")
async def get_warehouse_details(warehouse_id: str):
    details = warehouse_service.get_warehouse_details(warehouse_id)
    if not details:
        raise HTTPException(404, "Warehouse not found")
    return details

@router.put("/{warehouse_id}/details")
async def update_warehouse(warehouse_id: str, compatible_load_types: List[str]):
    result = warehouse_service.update_warehouse(warehouse_id, compatible_load_types)
    if not result["success"]:
        raise HTTPException(404, result["error"])
    return result

@router.get("/{warehouse_id}/schedule")
async def get_warehouse_schedule(warehouse_id: str):
    return {"scheduled_trucks": warehouse_service.get_warehouse_schedule(warehouse_id)}

@router.get("/{warehouse_id}/active-loads")
async def get_warehouse_active_loads(warehouse_id: str):
    return {"loads": warehouse_service.get_warehouse_active_loads(warehouse_id)}

@router.put("/{warehouse_id}/dock/{dock_number}/free")
async def free_dock(warehouse_id: str, dock_number: int):
    result = warehouse_service.free_dock(warehouse_id, dock_number)
    if not result["success"]:
        raise HTTPException(404, result["error"])
    return result

@router.get("/{warehouse_id}/history")
async def get_warehouse_history(warehouse_id: str):
    return {"visits": warehouse_service.get_warehouse_history(warehouse_id)}

@router.get("/{warehouse_id}/analytics")
async def get_warehouse_analytics(warehouse_id: str):
    return warehouse_service.get_warehouse_analytics(warehouse_id)