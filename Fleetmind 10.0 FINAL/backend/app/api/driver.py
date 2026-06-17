from fastapi import APIRouter, HTTPException
from ..models.requests import RegisterTruckRequest
from ..services import truck_service

router = APIRouter(prefix="/driver", tags=["driver"])

@router.get("/{driver_id}/truck")
async def get_driver_truck(driver_id: str):
    truck_id = truck_service.get_truck_by_driver(driver_id)
    if not truck_id:
        raise HTTPException(404, "No truck found for this driver")
    return {"truck_id": truck_id}

@router.get("/{driver_id}/earnings")
async def get_earnings(driver_id: str, period: str = "monthly"):
    return truck_service.get_earnings(driver_id, period)

@router.get("/{driver_id}/earnings/breakdown")
async def get_earnings_breakdown(driver_id: str):
    return {"loads": truck_service.get_earnings_breakdown(driver_id)}

@router.post("/register/truck")
async def register_truck(data: RegisterTruckRequest):
    result = truck_service.register_truck(data)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result

@router.get("/truck/{truck_id}/status")
async def get_truck_status(truck_id: str):
    status = truck_service.get_truck_status(truck_id)
    if not status:
        raise HTTPException(404, "Truck not found")
    return status

@router.post("/truck/{truck_id}/session/start")
async def start_session(truck_id: str):
    result = truck_service.start_session(truck_id)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result

@router.post("/truck/{truck_id}/session/end")
async def end_session(truck_id: str):
    result = truck_service.end_session(truck_id)
    if not result["success"]:
        raise HTTPException(404, result["error"])
    return result

@router.get("/truck/{truck_id}/proposals")
async def get_proposals(truck_id: str):
    return {"proposals": truck_service.get_proposals(truck_id)}

@router.post("/truck/{truck_id}/proposals/{proposal_id}/accept")
async def accept_proposal(truck_id: str, proposal_id: str):
    result = truck_service.accept_proposal(truck_id, proposal_id)
    if not result["success"]:
        raise HTTPException(404, result["error"])
    return result

@router.post("/truck/{truck_id}/proposals/{proposal_id}/reject")
async def reject_proposal(truck_id: str, proposal_id: str):
    result = truck_service.reject_proposal(truck_id, proposal_id)
    if not result["success"]:
        raise HTTPException(404, result["error"])
    return result

@router.get("/truck/{truck_id}/pending")
async def get_pending_deliveries(truck_id: str):
    return {"pending": truck_service.get_pending_deliveries(truck_id)}

@router.get("/truck/{truck_id}/next-action")
async def get_next_action(truck_id: str):
    return truck_service.get_next_action(truck_id)

@router.post("/truck/{truck_id}/depart")
async def depart(truck_id: str, to_node_id: str):
    result = truck_service.depart_truck(truck_id, to_node_id)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result

@router.post("/truck/{truck_id}/arrive")
async def arrive(truck_id: str, node_id: str):
    result = truck_service.arrive_truck(truck_id, node_id)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result

@router.post("/delivery/complete")
async def complete_delivery(truck_id: str, pair_id: str):
    result = truck_service.complete_delivery(truck_id, pair_id)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result

@router.post("/truck/{truck_id}/pickup")
async def pickup_load(truck_id: str, pair_id: str):
    result = truck_service.pickup_load(truck_id, pair_id)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result

@router.post("/debug/match/{truck_id}")
async def debug_match(truck_id: str):
    from ..services.matching_service import match_for_truck
    await match_for_truck(truck_id)
    return {"status": "matching triggered", "truck_id": truck_id}

@router.post("/truck/{truck_id}/instant-arrive")
async def instant_arrive(truck_id: str):
    result = truck_service.instant_arrive(truck_id)
    if not result["success"]:
        raise HTTPException(400, result["error"])
    return result