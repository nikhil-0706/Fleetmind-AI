<<<<<<< HEAD
from fastapi import FastAPI, HTTPException
from models import UtilityRequest, UtilityResponse, TruckInput, LoadInput, DistanceData
from scoring import calculate_utility_score

app = FastAPI(title="Truck Agent API (Reactive)")

@app.get("/")
def home():
    return {"message": "Truck Agent (Reactive) running"}

@app.post("/truck/evaluate-load", response_model=UtilityResponse)
def evaluate_load(request: UtilityRequest):
    try:
        return calculate_utility_score(
            request.truck, request.load, request.distance_data
        )
    except Exception as error:
        raise HTTPException(status_code=400, detail=str(error))
=======
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from truck_agent import models, schemas
from truck_agent.database import engine, get_db
from truck_agent.service import truck_service

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Truck Agent API",
    description="Independent Truck Agent microservice for multi-agent logistics system",
    version="1.0.0"
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "agent": "Truck Agent"
    }


@app.post("/register-truck", response_model=schemas.TruckResponse)
def register_truck(
    truck: schemas.TruckCreate,
    db: Session = Depends(get_db)
):
    existing_truck = truck_service.get_truck_by_id(db, truck.truck_id)

    if existing_truck:
        raise HTTPException(
            status_code=400,
            detail="Truck with this ID already exists"
        )

    return truck_service.register_truck(db, truck)


@app.get("/trucks", response_model=list[schemas.TruckResponse])
def get_all_trucks(db: Session = Depends(get_db)):
    return truck_service.get_all_trucks(db)


@app.get("/truck/{truck_id}", response_model=schemas.TruckResponse)
def get_truck_by_id(
    truck_id: str,
    db: Session = Depends(get_db)
):
    truck = truck_service.get_truck_by_id(db, truck_id)

    if truck is None:
        raise HTTPException(
            status_code=404,
            detail="Truck not found"
        )

    return truck


@app.patch("/truck/{truck_id}/status", response_model=schemas.TruckResponse)
def update_truck_status(
    truck_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    allowed_status = ["available", "assigned", "maintenance"]

    if status not in allowed_status:
        raise HTTPException(
            status_code=400,
            detail="Invalid status. Use available, assigned, or maintenance"
        )

    truck = truck_service.update_status(db, truck_id, status)

    if truck is None:
        raise HTTPException(
            status_code=404,
            detail="Truck not found"
        )

    return truck


@app.post("/evaluate-truck")
def evaluate_truck(
    request: schemas.TruckEvaluationRequest,
    db: Session = Depends(get_db)
):
    result = truck_service.evaluate_truck(db, request)

    if "error" in result:
        raise HTTPException(
            status_code=404,
            detail=result["error"]
        )

    return result
>>>>>>> 6a11834514b2ea37f944e4572035c48da0a802f1
