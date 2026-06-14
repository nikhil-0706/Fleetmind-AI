from pydantic import BaseModel
from typing import List, Dict, Optional

class Location(BaseModel):
    lat: float
    lon: float

class Warehouse(BaseModel):
    warehouse_id: str
    name: str
    location: Location
    status: str = "ACTIVE"
    active_loads: List[str] = []
    scheduled_trucks: List[Dict] = []  # {truck_id, eta, unload_time}

class Truck(BaseModel):
    truck_id: str
    location: Location
    status: str = "IDLE"   # IDLE, ENROUTE
    remaining_capacity: float
    available_from: str
    remaining_drive_hours: float
    preferred_rs_per_km: float
    current_load_weight: float
    assigned_pairs: List[str] = []

class Load(BaseModel):
    load_id: str
    type: str
    weight: float
    pickup_location: Location
    warehouse_id: str
    offered_rs_per_km: float
    delivery_deadline: str
    delay_limit: int   # minutes

class TruckLoadPair(BaseModel):
    pair_id: str
    truck_id: str
    load_id: str
    pickup_location: Location
    drop_location: Location
    assigned_warehouse: Optional[str] = None
    assigned_eta: Optional[str] = None
    delivery_deadline: str
    delay_limit: int
    status: str = "PENDING"   # PENDING, SCHEDULED, ENROUTE, DELIVERED

class DistanceMatrix(BaseModel):
    # Simple dict: (from_id, to_id) -> km
    # IDs can be warehouse IDs or location names
    matrix: Dict[str, Dict[str, float]] = {}