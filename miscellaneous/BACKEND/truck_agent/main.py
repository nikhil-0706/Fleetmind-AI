from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from .scoring import calculate_utility_score
from common.config import TRUCK_AGENT_PORT

app = FastAPI(title="Truck Agent")

class TruckEvalRequest(BaseModel):
    truck: dict
    load: dict
    distance_to_pickup: float
    distance_pickup_to_drop: float

@app.post("/evaluate")
def evaluate(request: TruckEvalRequest):
    try:
        score = calculate_utility_score(
            request.truck,
            request.load,
            request.distance_to_pickup,
            request.distance_pickup_to_drop
        )
        return {"utility_score": score}
    except Exception as e:
        raise HTTPException(400, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=TRUCK_AGENT_PORT)