from pydantic import BaseModel
from typing import List

class ScheduledTruck(BaseModel):
    truck_id: str
    eta: str
    unloading_duration: int

class WarehouseState(BaseModel):
    warehouse_id: str
    status: str = "ACTIVE"
    total_docks: int
    scheduled_trucks: List[ScheduledTruck] = []
    compatible_load_types: List[str] = []

class EvaluationRequest(BaseModel):
    truck_id: str
    warehouse_id: str
    load_type: str
    eta: str
    unloading_duration: int
    delivery_deadline: str

class EvaluationResponse(BaseModel):
    utility_score: float
    dock_availability_score: float
    waiting_time_score: float
    utilization_score: float
    compatibility_score: float
    deadline_safety_score: float
    expected_wait_minutes: int