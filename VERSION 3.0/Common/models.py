from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from datetime import datetime

# ---------- Rate caps (can be overridden by admin) ----------
MIN_RATE = 0
MAX_RATE = 200  # ₹ per km

# ---------- Location (kept for compatibility but not used in graph) ----------
class Location(BaseModel):
    lat: float
    lon: float

# ---------- Graph models ----------
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

# ---------- Truck model (includes session and graph position) ----------
class Truck(BaseModel):
    truck_id: str
    driver_id: str
    status: str = "INACTIVE"   # INACTIVE, IDLE, AT_NODE, TRAVELING, PAUSED
    current_node_id: Optional[str] = None
    current_edge_id: Optional[str] = None
    progress_km: float = 0.0
    next_destination_node_id: Optional[str] = None
    remaining_capacity: float
    remaining_drive_hours: float = 0.0   # from current session
    preferred_rs_per_km: float = Field(..., ge=MIN_RATE, le=MAX_RATE)
    assigned_pairs: List[str] = []       # list of pair_ids
    created_at: datetime = Field(default_factory=datetime.now)

    @validator('preferred_rs_per_km')
    def validate_rate(cls, v):
        if v < MIN_RATE or v > MAX_RATE:
            raise ValueError(f"Rate must be between {MIN_RATE} and {MAX_RATE}")
        return v

# ---------- Load model ----------
class Load(BaseModel):
    load_id: str
    shipper_id: str
    type: str
    weight: float
    pickup_node_id: str
    drop_node_id: str
    offered_rs_per_km: float = Field(..., ge=MIN_RATE, le=MAX_RATE)
    delivery_deadline: str   # HH:MM
    delay_limit: int          # minutes allowed delay
    status: str = "PENDING"   # PENDING, ASSIGNED, EN_ROUTE, DELIVERED

# ---------- Truck-Load pair (assignment) ----------
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
    status: str = "PENDING"   # PENDING, SCHEDULED, ENROUTE, DELIVERED
    earnings: Optional[float] = None
    completed_at: Optional[datetime] = None

# ---------- Warehouse model (link to graph node) ----------
class Warehouse(BaseModel):
    warehouse_id: str
    node_id: str
    total_docks: int
    compatible_load_types: List[str] = []
    active_loads: List[str] = []          # load IDs waiting at this warehouse
    scheduled_trucks: List[Dict] = []     # [{truck_id, eta, pair_id}]

# ---------- Intermediate pickup proposal ----------
class IntermediateProposal(BaseModel):
    proposal_id: str
    truck_id: str
    load_id: str
    pickup_node_id: str
    detour_km: float
    extra_time_min: int
    offered_rate: float
    estimated_earnings: float
    deadline_impact: str   # "none", "minor", "risky"
    created_at: datetime = Field(default_factory=datetime.now)
    expires_at: datetime   # e.g., 2 minutes after creation

# ---------- Driver earnings record ----------
class EarningsRecord(BaseModel):
    driver_id: str
    session_id: str
    date: str              # YYYY-MM-DD
    total_earnings: float
    loads: List[dict]      # [{load_id, earnings, distance_km, rate}]