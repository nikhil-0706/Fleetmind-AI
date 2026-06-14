from pydantic import BaseModel


class LoadCreate(BaseModel):
    load_id: str
    cargo_type: str
    pickup_location: str
    drop_location: str
    load_weight_tons: float
    offered_money: float
    distance_km: float
    pickup_deadline_hours: float
    delivery_deadline_hours: float
    priority: str
    loading_time_hours: float
    special_handling_required: bool
    status: str


class LoadResponse(BaseModel):
    load_id: str
    cargo_type: str
    pickup_location: str
    drop_location: str
    load_weight_tons: float
    offered_money: float
    distance_km: float
    pickup_deadline_hours: float
    delivery_deadline_hours: float
    priority: str
    loading_time_hours: float
    special_handling_required: bool
    status: str

    class Config:
        from_attributes = True


class LoadEvaluationRequest(BaseModel):
    load_id: str