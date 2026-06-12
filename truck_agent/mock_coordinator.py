from fastapi import FastAPI
from pydantic import BaseModel
from typing import Dict, List

app = FastAPI(title="Mock Coordinator for Truck Agent Testing")

trucks_db = {
    "T001": {
        "current_load_weight": 12,
        "current_location": "WH_MUM_01",
        "remaining_drive_hours": 7,
        "assigned_load_ids": ["L100"]
    }
}

class NearbyLoadsRequest(BaseModel):
    truck_id: str
    current_location: str
    remaining_capacity: float

@app.get("/coordinator/truck_status/{truck_id}")
def get_truck_status(truck_id: str):
    if truck_id not in trucks_db:
        return {"current_load_weight": 0, "current_location": "UNKNOWN", "remaining_drive_hours": 0, "assigned_load_ids": []}
    return trucks_db[truck_id]

@app.get("/coordinator/truck_assignments/{truck_id}")
def get_truck_assignments(truck_id: str):
    if truck_id not in trucks_db:
        return {"assigned_load_ids": []}
    return {"assigned_load_ids": trucks_db[truck_id].get("assigned_load_ids", [])}

@app.post("/coordinator/nearby_loads")
def nearby_loads(req: NearbyLoadsRequest):
    candidate_loads = [
        {
            "load": {
                "load_id": "L101",
                "pickup_warehouse_id": "WH_NAVI",
                "drop_warehouse_id": "WH_PUNE",
                "pickup_time": "10:30",
                "load_weight": 4,
                "offered_rs_per_km": 50
            },
            "distance_data": {
                "distance_to_pickup": 15.2,
                "distance_pickup_to_drop": 120.5
            }
        },
        {
            "load": {
                "load_id": "L102",
                "pickup_warehouse_id": "WH_THANE",
                "drop_warehouse_id": "WH_PUNE",
                "pickup_time": "11:00",
                "load_weight": 6,
                "offered_rs_per_km": 48
            },
            "distance_data": {
                "distance_to_pickup": 22.0,
                "distance_pickup_to_drop": 118.0
            }
        }
    ]
    return {"candidate_loads": candidate_loads}

@app.post("/coordinator/truck_recommendations")
def receive_recommendations(payload: Dict):
    print(f"[Mock Coordinator] Received recommendations: {payload}")
    return {"status": "received"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)