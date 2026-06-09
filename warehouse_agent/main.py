from fastapi import FastAPI
from warehouse_agent import WarehouseAgent

app = FastAPI()

warehouse = WarehouseAgent()

@app.get("/")
def home():

    return {
        "agent": "Warehouse Agent",
        "status": "running"
    }

@app.post("/register-truck")
def register_truck(truck: dict):
    print(truck)
    return warehouse.register_truck(truck)

@app.post("/assign-dock/{truck_id}")
def assign_dock(truck_id: str):

    return warehouse.assign_dock(truck_id)

@app.get("/congestion")
def congestion():

    return warehouse.predict_congestion()

@app.get("/wait-time")
def wait_time():

    return warehouse.estimate_wait_time()

@app.get("/status")
def status():

    return warehouse.warehouse_status()

@app.get("/schedule")
def schedule():

    return warehouse.generate_slots()

@app.get("/recommendation")
def recommendation():

    return warehouse.recommend_schedule()