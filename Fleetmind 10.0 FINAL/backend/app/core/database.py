from datetime import datetime
from typing import Dict, List, Optional
from ..models.domain import (
    User, Truck, Load, Warehouse, TruckLoadPair,
    Proposal, EarningsRecord, LogEntry, SystemConfig
)
from .config import settings

users_db: Dict[str, User] = {}
trucks_db: Dict[str, Truck] = {}
loads_db: Dict[str, Load] = {}
warehouses_db: Dict[str, Warehouse] = {}
pairs_db: Dict[str, TruckLoadPair] = {}
proposals_db: Dict[str, Proposal] = {}
earnings_db: List[EarningsRecord] = []
logs_db: List[LogEntry] = []

node_to_warehouse: Dict[str, str] = {}
locked_loads: Dict[str, dict] = {}
truck_next_action: Dict[str, dict] = {}

current_config = SystemConfig(
    min_rate=settings.MIN_RATE,
    max_rate=settings.MAX_RATE,
    detour_threshold_km=settings.DETOUR_THRESHOLD_KM,
    nearby_radius_km=settings.NEARBY_RADIUS_KM,
    default_speed_kmph=settings.DEFAULT_SPEED_KMPH,
    deadline_buffer_min=settings.DEADLINE_BUFFER_MIN
)

def reset_db():
    users_db.clear()
    trucks_db.clear()
    loads_db.clear()
    warehouses_db.clear()
    pairs_db.clear()
    proposals_db.clear()
    earnings_db.clear()
    logs_db.clear()
    node_to_warehouse.clear()
    locked_loads.clear()
    truck_next_action.clear()