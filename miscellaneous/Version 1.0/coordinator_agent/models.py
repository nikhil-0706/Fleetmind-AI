from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime

# ---------- Database Schemas ----------
class Location(BaseModel):
    lat: float
    lon: float

class Warehouse(BaseModel):
    warehouse_id: str
    name: str
    location: Location
    status: str = "ACTIVE"   # ACTIVE, CLOSED
    active_loads: List[str] = []
    scheduled_trucks: List[Dict] = []  # list of {"truck_id", "eta", "unload_time"}

class Truck(BaseModel):
    truck_id: str
    location: Location
    status: str = "IDLE"     # IDLE, ENROUTE, LOADED
    remaining_capacity: float   # tons
    available_from: str          # "HH:MM"
    remaining_drive_hours: float
    preferred_rs_per_km: float
    current_load_weight: float   # total weight onboard
    assigned_pairs: List[str] = []  # pair_ids

class Load(BaseModel):
    load_id: str
    type: str
    weight: float
    pickup_location: Location
    warehouse_id: str            # where it currently sits
    offered_rs_per_km: float
    delivery_deadline: str       # "HH:MM"
    delay_limit: int             # minutes

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
    status: str = "PENDING"      # PENDING, SCHEDULED, ENROUTE, DELIVERED

# ---------- Communication Models ----------
class TruckEvaluationRequest(BaseModel):
    truck: Truck
    load: Load
    distance_to_pickup: float
    distance_pickup_to_drop: float

class LoadEvaluationRequest(BaseModel):
    load_id: str
    truck: dict   # will contain truck details + distances

class WarehouseEvaluationRequest(BaseModel):
    truck_id: str
    warehouse_id: str
    load_type: str
    eta: str
    unloading_duration: int
    delivery_deadline: str

class BackhaulEvaluationRequest(BaseModel):
    truck: dict
    pending_deliveries: List[dict]
    candidate_pickups: List[dict]
    distance_data: dict