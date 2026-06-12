from pydantic import BaseModel, Field
from typing import Optional

class LoadInput(BaseModel):
    load_id: str
    load_type: str = Field(..., example="Electronics")
    load_weight: float = Field(..., example=12000)  # in kg or tons? Keep consistent
    pickup_location: str = Field(..., example="Navi Mumbai")
    drop_location: str = Field(..., example="Pune")
    pickup_time: str = Field(..., example="10:30")
    offered_rs_per_km: float = Field(..., example=50)

class TruckDetails(BaseModel):
    truck_id: str
    available_from_time: str = Field(..., example="09:30")
    current_location: str = Field(..., example="Mumbai")
    remaining_drive_hours: float = Field(..., example=7)
    preferred_rs_per_km: float = Field(..., example=45)
    current_load_weight: float = Field(..., example=12)
    # Add distance data provided by Coordinator for this specific load-truck pair
    distance_to_pickup: float = Field(..., description="Km from truck current location to load pickup")
    distance_pickup_to_drop: float = Field(..., description="Km from load pickup to load drop")

class EvaluationRequest(BaseModel):
    load_id: str
    truck: TruckDetails

class EvaluationResponse(BaseModel):
    load_id: str
    truck_id: str
    feasibility_score: float  # 0 or 100 based on hard checks
    pickup_reliability_score: float
    earnings_compatibility_score: float
    capacity_utilization_match_score: float
    earliest_pickup_advantage_score: float  # will be computed relative to other trucks? For single evaluation, use a default or omit. We'll compute a relative score based on time difference from now.
    utility_score: float
    decision: str  # ACCEPTABLE, REJECT, etc.

class RegisterLoadRequest(BaseModel):
    load: LoadInput