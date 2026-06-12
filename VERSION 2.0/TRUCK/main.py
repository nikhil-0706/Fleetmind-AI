from fastapi import FastAPI, HTTPException
from .models import UtilityRequest, UtilityResponse
from .scoring import calculate_utility_score

app = FastAPI(title="Truck Agent (Stateless)")

@app.get("/")
def home():
    return {"message": "Truck Agent running (stateless)"}

@app.post("/truck/evaluate-load", response_model=UtilityResponse)
def evaluate_load(request: UtilityRequest):
    try:
        return calculate_utility_score(request.truck, request.load, request.distance_data)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))