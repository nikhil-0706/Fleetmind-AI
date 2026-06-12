from fastapi import FastAPI, HTTPException
from models import EvaluationRequest, EvaluationResponse, WarehouseState  # <-- removed dot
from scoring import calculate_utility_score  # <-- removed dot

app = FastAPI(title="Warehouse Agent API")

warehouses_db = {}

@app.get("/")
def home():
    return {"message": "Warehouse Agent is running"}

@app.post("/warehouse/register")
def register_warehouse(warehouse: WarehouseState):
    if warehouse.warehouse_id in warehouses_db:
        raise HTTPException(400, "Warehouse already registered")
    warehouses_db[warehouse.warehouse_id] = warehouse
    return {"status": "registered", "warehouse_id": warehouse.warehouse_id}

@app.post("/warehouse/evaluate", response_model=EvaluationResponse)
def evaluate_arrival(request: EvaluationRequest):
    warehouse = warehouses_db.get(request.warehouse_id)
    if not warehouse:
        raise HTTPException(404, f"Warehouse {request.warehouse_id} not found")
    result = calculate_utility_score(request, warehouse)
    return EvaluationResponse(**result)

@app.get("/warehouse/{warehouse_id}/schedule")
def get_schedule(warehouse_id: str):
    if warehouse_id not in warehouses_db:
        raise HTTPException(404, "Warehouse not found")
    return {"scheduled_trucks": warehouses_db[warehouse_id].scheduled_trucks}