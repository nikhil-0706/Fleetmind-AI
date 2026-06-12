<<<<<<< HEAD
from fastapi import FastAPI, HTTPException
from models import (
    RegisterLoadRequest, EvaluationRequest, EvaluationResponse,
    LoadInput, TruckDetails
)
from scoring import calculate_utility_score

app = FastAPI(
    title="Load Agent API",
    description="Load Agent evaluates how suitable a truck is for a specific load. Reactive – only responds to Coordinator requests.",
    version="1.0.0"
)

# In-memory storage for loads (MVP)
loads_db = {}

@app.get("/")
def home():
    return {
        "message": "Load Agent API is running",
        "agent": "Load Agent",
        "responsibility": "Evaluate truck suitability from load owner's perspective",
        "activation": "Only when Coordinator sends an evaluation request"
    }

@app.post("/load/register")
def register_load(request: RegisterLoadRequest):
    """Store load data for future evaluations."""
    load = request.load
    if load.load_id in loads_db:
        raise HTTPException(status_code=400, detail="Load already registered")
    loads_db[load.load_id] = load
    return {"status": "registered", "load_id": load.load_id}

@app.post("/load/evaluate", response_model=EvaluationResponse)
def evaluate_truck(request: EvaluationRequest):
    """
    Coordinator calls this endpoint when a truck shows interest in this load.
    The request includes the truck details and distance data.
    """
    load = loads_db.get(request.load_id)
    if not load:
        raise HTTPException(status_code=404, detail="Load not found. Register load first.")
    
    truck = request.truck
    # Call scoring function
    result = calculate_utility_score(
        truck=truck,
        load=load,
        distance_to_pickup=truck.distance_to_pickup,
        distance_pickup_to_drop=truck.distance_pickup_to_drop
    )
    return EvaluationResponse(
        load_id=load.load_id,
        truck_id=truck.truck_id,
        feasibility_score=result["feasibility_score"],
        pickup_reliability_score=result["pickup_reliability_score"],
        earnings_compatibility_score=result["earnings_compatibility_score"],
        capacity_utilization_match_score=result["capacity_utilization_match_score"],
        earliest_pickup_advantage_score=result["earliest_pickup_advantage_score"],
        utility_score=result["utility_score"],
        decision=result["decision"]
    )

@app.get("/load/list")
def list_loads():
    return {"registered_loads": list(loads_db.keys())}
=======
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from load_agent import models, schemas
from load_agent.database import engine, get_db
from load_agent.service import load_service

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Load Agent API",
    description="Independent Load Agent microservice for multi-agent logistics system",
    version="1.0.0"
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "agent": "Load Agent"
    }


@app.post("/register-load", response_model=schemas.LoadResponse)
def register_load(
    load: schemas.LoadCreate,
    db: Session = Depends(get_db)
):
    existing_load = load_service.get_load_by_id(db, load.load_id)

    if existing_load:
        raise HTTPException(
            status_code=400,
            detail="Load with this ID already exists"
        )

    return load_service.register_load(db, load)


@app.get("/loads", response_model=list[schemas.LoadResponse])
def get_all_loads(db: Session = Depends(get_db)):
    return load_service.get_all_loads(db)


@app.get("/load/{load_id}", response_model=schemas.LoadResponse)
def get_load_by_id(
    load_id: str,
    db: Session = Depends(get_db)
):
    load = load_service.get_load_by_id(db, load_id)

    if load is None:
        raise HTTPException(
            status_code=404,
            detail="Load not found"
        )

    return load


@app.patch("/load/{load_id}/status", response_model=schemas.LoadResponse)
def update_load_status(
    load_id: str,
    status: str,
    db: Session = Depends(get_db)
):
    allowed_status = ["pending", "assigned", "in_transit", "delivered", "cancelled"]

    if status not in allowed_status:
        raise HTTPException(
            status_code=400,
            detail="Invalid status"
        )

    load = load_service.update_status(db, load_id, status)

    if load is None:
        raise HTTPException(
            status_code=404,
            detail="Load not found"
        )

    return load


@app.post("/evaluate-load")
def evaluate_load(
    request: schemas.LoadEvaluationRequest,
    db: Session = Depends(get_db)
):
    result = load_service.evaluate_load(db, request)

    if "error" in result:
        raise HTTPException(
            status_code=404,
            detail=result["error"]
        )

    return result
>>>>>>> 6a11834514b2ea37f944e4572035c48da0a802f1
