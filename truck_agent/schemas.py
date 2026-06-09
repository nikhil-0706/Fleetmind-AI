from pydantic import BaseModel


class TruckCreate(BaseModel):
    truck_id: str
    truck_type: str
    current_location: str
    capacity_tons: float
    fuel_percent: float
    maintenance_percent: float
    driver_expected_rate_per_km: float
    status: str
    registration_number: str
    driver_name: str
    


class TruckResponse(BaseModel):
    truck_id: str
    truck_type: str
    current_location: str
    capacity_tons: float
    fuel_percent: float
    maintenance_percent: float
    driver_expected_rate_per_km: float
    status: str
    registration_number: str
    driver_name: str
    

    class Config:
        from_attributes = True


class TruckEvaluationRequest(BaseModel):
    truck_id: str
    load_capacity: float
    distance_km: float
    offered_money: float


class TruckEvaluationResponse(BaseModel):
    truck_id: str

    capacity_score: float

    money_score: float

    fuel_score: float

    maintenance_score: float

    utility_score: float

    decision: str