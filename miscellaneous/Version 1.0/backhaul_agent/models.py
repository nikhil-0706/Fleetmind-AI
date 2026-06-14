from pydantic import BaseModel
from typing import List, Dict

class TruckState(BaseModel):
    truck_id: str
    current_location: str
    remaining_drive_hours: float
    preferred_rs_per_km: float
    current_load_weight: float

class PendingDelivery(BaseModel):
    load_id: str
    drop_location: str
    delivery_deadline: str   # "HH:MM"
    load_weight: float
    offered_rs_per_km: float   # rate already agreed for this load

class CandidatePickup(BaseModel):
    load_id: str
    pickup_location: str
    drop_location: str
    pickup_deadline: str       # "HH:MM"
    offered_rs_per_km: float
    load_weight: float

class DistanceData(BaseModel):
    # Distances from current location to each possible next stop
    to_delivery_locations: Dict[str, float]   # key = drop_location, value = km
    to_pickup_locations: Dict[str, float]     # key = pickup_location, value = km
    # For each pickup, distance from its pickup to its drop (to check delivery feasibility)
    pickup_to_drop: Dict[str, float]          # key = pickup_location, value = km

class BackhaulEvaluationRequest(BaseModel):
    truck: TruckState
    pending_deliveries: List[PendingDelivery]
    candidate_pickups: List[CandidatePickup]
    distance_data: DistanceData

class BackhaulEvaluationResponse(BaseModel):
    scores: Dict[str, float]   # keys like "deliver_L101", "pickup_L201"