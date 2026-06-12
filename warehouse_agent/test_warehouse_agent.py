import requests

# Step 1: Register a warehouse
warehouse_data = {
    "warehouse_id": "WH12",
    "status": "ACTIVE",
    "total_docks": 5,
    "scheduled_trucks": [
        {"truck_id": "T005", "eta": "14:45", "unloading_duration": 30},
        {"truck_id": "T008", "eta": "15:10", "unloading_duration": 60}
    ],
    "compatible_load_types": ["Electronics", "Furniture"]
}

resp = requests.post("http://localhost:8003/warehouse/register", json=warehouse_data)
print("Register:", resp.json())

# Step 2: Evaluate a truck-load pair at a specific ETA
eval_data = {
    "truck_id": "T001",
    "warehouse_id": "WH12",
    "load_type": "Electronics",
    "eta": "15:00",
    "unloading_duration": 45,
    "delivery_deadline": "18:00"
}

resp2 = requests.post("http://localhost:8003/warehouse/evaluate", json=eval_data)
print("Evaluation:", resp2.json())