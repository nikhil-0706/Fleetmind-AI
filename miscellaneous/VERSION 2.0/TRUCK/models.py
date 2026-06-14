from pydantic import BaseModel, Field

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
    pickup_time: str
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