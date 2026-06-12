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