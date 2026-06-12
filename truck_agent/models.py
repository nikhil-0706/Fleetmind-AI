from pydantic import BaseModel, Field
from typing import List, Dict

class TruckInput(BaseModel):
    truck_id: str
    available_from_time: str = Field(..., example="09:30")
    current_location: str = Field(..., example="WH_MUM_01")
    remaining_drive_hours: float
    preferred_rs_per_km: float
    current_load_weight: float

class LoadInput(BaseModel):
    load_id: str
    pickup_warehouse_id: str
    drop_warehouse_id: str
    pickup_time: str = Field(..., example="10:30")
    load_weight: float
    offered_rs_per_km: float

class DistanceData(BaseModel):
    distance_to_pickup: float
    distance_pickup_to_drop: float

class UtilityRequest(BaseModel):
    truck: TruckInput
    load: LoadInput
    distance_data: DistanceData

class UtilityResponse(BaseModel):
    truck_id: str
    load_id: str
    arrival_time_at_pickup: str
    pickup_reachability_score: float
    earnings_score: float
    capacity_utilization_score: float
    driving_hours_feasibility_score: float
    utility_score: float
    decision: str

# New models for Coordinator communication
class TruckStatusResponse(BaseModel):
    current_load_weight: float
    current_location: str
    remaining_drive_hours: float
    assigned_load_ids: List[str]

class NearbyLoadsRequest(BaseModel):
    truck_id: str
    current_location: str
    remaining_capacity: float

class NearbyLoadsResponse(BaseModel):
    candidate_loads: List[Dict]

class TruckRecommendationsRequest(BaseModel):
    truck_id: str
    recommended_loads: List[Dict]