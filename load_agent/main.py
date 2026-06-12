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