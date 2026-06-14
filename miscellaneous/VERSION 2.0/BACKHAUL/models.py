from pydantic import BaseModel
from typing import List, Dict, Optional

class TruckState(BaseModel):
    truck_id: str
    current_location: str
    remaining_drive_hours: float
    preferred_rs_per_km: float
    current_load_weight: float

class PendingDelivery(BaseModel):
    load_id: str
    drop_location: str
    delivery_deadline: str
    load_weight: float
    offered_rs_per_km: float

class CandidatePickup(BaseModel):
    load_id: str
    pickup_location: str
    drop_location: str
    pickup_deadline: str
    offered_rs_per_km: float
    load_weight: float

class DistanceData(BaseModel):
    to_delivery_locations: Dict[str, float]
    to_pickup_locations: Dict[str, float]
    pickup_to_drop: Dict[str, float]
    to_relocation_warehouses: Dict[str, float] = {}   # optional

class BackhaulEvaluationRequest(BaseModel):
    truck: TruckState
    pending_deliveries: List[PendingDelivery]
    candidate_pickups: List[CandidatePickup]
    distance_data: DistanceData
    candidate_relocation_warehouses: List[str] = []   # optional

class BackhaulEvaluationResponse(BaseModel):
    scores: Dict[str, float]