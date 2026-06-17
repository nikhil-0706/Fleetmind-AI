from pydantic import BaseModel
from typing import List, Optional

class RegisterRequest(BaseModel):
    role: str
    id: str
    password: str

class LoginRequest(BaseModel):
    role: str
    id: str
    password: str

class LoginResponse(BaseModel):
    token: str
    role: str
    id: str

class RegisterTruckRequest(BaseModel):
    truck_id: str
    driver_id: str
    remaining_capacity: float
    preferred_rs_per_km: float
    current_node_id: str
    status: str = "INACTIVE"

class RegisterLoadRequest(BaseModel):
    load_id: str
    shipper_id: str
    type: str
    weight: float
    pickup_node_id: str
    drop_node_id: str
    offered_rs_per_km: float
    delivery_deadline: str
    pickup_time: str
    delay_limit: int = 30
    status: str = "PENDING"

class RegisterWarehouseRequest(BaseModel):
    warehouse_id: str
    node_id: str
    compatible_load_types: List[str] = []
    status: str = "ACTIVE"

class UpdateWarehouseRequest(BaseModel):
    compatible_load_types: Optional[List[str]] = None

class UpdateConfigRequest(BaseModel):
    min_rate: Optional[float] = None
    max_rate: Optional[float] = None
    detour_threshold_km: Optional[float] = None
    nearby_radius_km: Optional[float] = None
    default_speed_kmph: Optional[float] = None
    deadline_buffer_min: Optional[int] = None