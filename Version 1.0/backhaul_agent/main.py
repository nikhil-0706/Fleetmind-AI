from fastapi import FastAPI, HTTPException
from models import BackhaulEvaluationRequest, BackhaulEvaluationResponse
from scoring import evaluate_next_stop

app = FastAPI(title="Backhaul Agent API")

@app.get("/")
def home():
    return {
        "message": "Backhaul Agent is running",
        "responsibility": "Evaluate next possible stops (deliveries or pickups) for a truck with multiple loads"
    }

@app.post("/backhaul/evaluate", response_model=BackhaulEvaluationResponse)
def evaluate(request: BackhaulEvaluationRequest):
    try:
        scores = evaluate_next_stop(request)
        return BackhaulEvaluationResponse(scores=scores)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/health")
def health():
    return {"status": "ok"}