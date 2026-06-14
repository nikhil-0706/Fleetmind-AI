from fastapi import FastAPI, HTTPException
from .models import WarehouseState, EvaluationRequest, EvaluationResponse
from .scoring import calculate_utility_score
from common.config import WAREHOUSE_AGENT_PORT

app = FastAPI(title="Warehouse Agent")

@app.on_event("startup")
async def startup():
    print(f"✅ Warehouse Agent running on port {WAREHOUSE_AGENT_PORT}")

@app.get("/health")
async def health():
    return {"status": "up"}

warehouses_db = {}

@app.post("/warehouse/register")
async def register_warehouse(warehouse: WarehouseState):
    if warehouse.warehouse_id in warehouses_db:
        raise HTTPException(400, "Already registered")
    warehouses_db[warehouse.warehouse_id] = warehouse
    return {"status": "registered"}

@app.post("/warehouse/evaluate")
async def evaluate(request: EvaluationRequest):
    warehouse = warehouses_db.get(request.warehouse_id)
    if not warehouse:
        raise HTTPException(404, "Warehouse not found")
    result = calculate_utility_score(request, warehouse)
    return EvaluationResponse(**result)

@app.get("/warehouse/{warehouse_id}/schedule")
async def get_schedule(warehouse_id: str):
    wh = warehouses_db.get(warehouse_id)
    if not wh:
        raise HTTPException(404, "Not found")
    return {"scheduled_trucks": [st.dict() for st in wh.scheduled_trucks]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=WAREHOUSE_AGENT_PORT)