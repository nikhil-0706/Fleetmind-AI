from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from datetime import datetime
from .config import (
    MIN_RATE, MAX_RATE, WAREHOUSE_DOCK_COUNT,
    DETOUR_THRESHOLD_KM, NEARBY_RADIUS_KM, DEFAULT_TRUCK_SPEED_KMPH, DEADLINE_BUFFER_MIN
)

class User(BaseModel):
    role: str
    id: str
    password: str

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
    speed_kmph: float = DEFAULT_TRUCK_SPEED_KMPH

class Truck(BaseModel):
    truck_id: str
    driver_id: str
    status: str = "INACTIVE"
    current_node_id: Optional[str] = None
    current_edge_id: Optional[str] = None
    progress_km: float = 0.0
    departure_time: Optional[datetime] = None
    next_destination_node_id: Optional[str] = None
    remaining_capacity: float
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
    pickup_time: str
    delay_limit: int = 30
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

class ScheduledTruck(BaseModel):
    truck_id: str
    load_id: str
    eta: str
    unloading_duration: int
    dock_number: int

class Warehouse(BaseModel):
    warehouse_id: str
    node_id: str
    compatible_load_types: List[str] = []
    scheduled_trucks: List[ScheduledTruck] = []
    active_loads: List[str] = []

class Proposal(BaseModel):
    proposal_id: str
    truck_id: str
    load_id: str
    proposal_type: str
    pickup_node_id: str
    detour_km: float
    extra_time_min: int
    offered_rate: float
    estimated_earnings: float
    score: float
    status: str = "PENDING"
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: datetime

class EarningsRecord(BaseModel):
    driver_id: str
    load_id: str
    pair_id: str
    earnings: float
    distance_km: float
    rate_per_km: float
    completed_at: datetime

class LogEntry(BaseModel):
    timestamp: datetime
    event_type: str
    entity_id: str
    details: dict
    is_notification: bool = False
    user_role: Optional[str] = None
    user_id: Optional[str] = None

class SystemConfig(BaseModel):
    min_rate: float = MIN_RATE
    max_rate: float = MAX_RATE
    detour_threshold_km: float = DETOUR_THRESHOLD_KM
    nearby_radius_km: float = NEARBY_RADIUS_KM
    default_speed_kmph: float = DEFAULT_TRUCK_SPEED_KMPH
    deadline_buffer_min: int = DEADLINE_BUFFER_MIN