from fastapi import FastAPI, HTTPException
from .models import BackhaulEvaluationRequest, BackhaulEvaluationResponse
from .scoring import evaluate_next_stop

app = FastAPI(title="Backhaul Agent")

@app.get("/")
def home():
    return {"message": "Backhaul Agent running (stateless)"}

@app.post("/backhaul/evaluate", response_model=BackhaulEvaluationResponse)
def evaluate(request: BackhaulEvaluationRequest):
    try:
        scores = evaluate_next_stop(request)
        return BackhaulEvaluationResponse(scores=scores)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))