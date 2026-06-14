from fastapi import FastAPI, HTTPException
from .models import EvaluationRequest, EvaluationResponse
from .scoring import calculate_utility_score

app = FastAPI(title="Load Agent (Stateless)")

@app.get("/")
def home():
    return {"message": "Load Agent running (stateless)"}

@app.post("/load/evaluate", response_model=EvaluationResponse)
def evaluate(request: EvaluationRequest):
    try:
        result = calculate_utility_score(request.truck, request.load)
        return EvaluationResponse(
            load_id=request.load.load_id,
            truck_id=request.truck.truck_id,
            feasibility_score=result["feasibility_score"],
            pickup_reliability_score=result["pickup_reliability_score"],
            earnings_compatibility_score=result["earnings_compatibility_score"],
            capacity_utilization_match_score=result["capacity_utilization_match_score"],
            earliest_pickup_advantage_score=result["earliest_pickup_advantage_score"],
            utility_score=result["utility_score"],
            decision=result["decision"]
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))