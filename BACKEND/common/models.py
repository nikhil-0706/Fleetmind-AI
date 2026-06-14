from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from datetime import datetime
from .config import MIN_RATE, MAX_RATE

class Location(BaseModel):
    lat: float
    lon: float

class Node(BaseModel):
    node_id: str
    x: float
    y: float
    is_warehouse: bool = False
    warehouse_id: Optional[str] = None

class Edge(BaseModel):
    edge_id: str
    from_node: str
    to_node: str
    distance_km: float
    speed_kmph: float = 50.0

class Truck(BaseModel):
    truck_id: str
    driver_id: str
    status: str = "INACTIVE"
    current_node_id: Optional[str] = None
    current_edge_id: Optional[str] = None
    progress_km: float = 0.0
    next_destination_node_id: Optional[str] = None
    remaining_capacity: float
    remaining_drive_hours: float = 0.0
    preferred_rs_per_km: float = Field(..., ge=MIN_RATE, le=MAX_RATE)
    assigned_pairs: List[str] = []
    created_at: datetime = Field(default_factory=datetime.now)

    @validator('preferred_rs_per_km')
    def validate_rate(cls, v):
        if v < MIN_RATE or v > MAX_RATE:
            raise ValueError(f"Rate must be between {MIN_RATE} and {MAX_RATE}")
        return v

class Load(BaseModel):
    load_id: str
    shipper_id: str
    type: str
    weight: float
    pickup_node_id: str
    drop_node_id: str
    offered_rs_per_km: float = Field(..., ge=MIN_RATE, le=MAX_RATE)
    delivery_deadline: str
    delay_limit: int
    status: str = "PENDING"

class TruckLoadPair(BaseModel):
    pair_id: str
    truck_id: str
    load_id: str
    pickup_node_id: str
    drop_node_id: str
    assigned_warehouse: Optional[str] = None
    assigned_eta: Optional[str] = None
    delivery_deadline: str
    delay_limit: int
    status: str = "PENDING"
    earnings: Optional[float] = None
    completed_at: Optional[datetime] = None

class Warehouse(BaseModel):
    warehouse_id: str
    node_id: str
    total_docks: int
    compatible_load_types: List[str] = []
    active_loads: List[str] = []
    scheduled_trucks: List[Dict] = []

class IntermediateProposal(BaseModel):
    proposal_id: str
    truck_id: str
    load_id: str
    pickup_node_id: str
    detour_km: float
    extra_time_min: int
    offered_rate: float
    estimated_earnings: float
    deadline_impact: str
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: datetime

class EarningsRecord(BaseModel):
    driver_id: str
    session_id: str
    date: str
    total_earnings: float
    loads: List[dict]