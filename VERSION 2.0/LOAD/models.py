from pydantic import BaseModel, Field

class LoadInput(BaseModel):
    load_id: str
    load_type: str
    load_weight: float
    pickup_location: str
    drop_location: str
    pickup_time: str
    offered_rs_per_km: float

class TruckDetails(BaseModel):
    truck_id: str
    available_from_time: str
    current_location: str
    remaining_drive_hours: float
    preferred_rs_per_km: float
    current_load_weight: float
    distance_to_pickup: float
    distance_pickup_to_drop: float

class EvaluationRequest(BaseModel):
    load: LoadInput
    truck: TruckDetails

class EvaluationResponse(BaseModel):
    load_id: str
    truck_id: str
    feasibility_score: float
    pickup_reliability_score: float
    earnings_compatibility_score: float
    capacity_utilization_match_score: float
    earliest_pickup_advantage_score: float
    utility_score: float
    decision: str