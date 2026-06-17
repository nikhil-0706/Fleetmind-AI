from fastapi import APIRouter, HTTPException
from ..models.requests import RegisterLoadRequest
from ..services import load_service

router = APIRouter(prefix="/shipper", tags=["shipper"])

@router.post("/register/load")
async def register_load(data: RegisterLoadRequest):
    result = load_service.register_load(data)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result

@router.get("/{shipper_id}/loads")
async def get_shipper_loads(shipper_id: str):
    return {"loads": load_service.get_shipper_loads(shipper_id)}

@router.get("/{shipper_id}/history")
async def get_shipper_history(shipper_id: str):
    return {"loads": load_service.get_shipper_history(shipper_id)}

@router.get("/{shipper_id}/analytics")
async def get_shipper_analytics(shipper_id: str):
    return load_service.get_shipper_analytics(shipper_id)

@router.get("/{shipper_id}/map-data")
async def get_shipper_map_data(shipper_id: str):
    return load_service.get_shipper_map_data(shipper_id)

@router.get("/load/{load_id}/status")
async def get_load_status(load_id: str):
    status = load_service.get_load_status(load_id)
    if not status:
        raise HTTPException(404, "Load not found")
    return status