import requests

# Register load
resp = requests.post("http://localhost:8000/load/register", json={
    "load": {
        "load_id": "L999",
        "load_type": "Electronics",
        "load_weight": 4,
        "pickup_location": "Navi Mumbai",
        "drop_location": "Pune",
        "pickup_time": "10:30",
        "offered_rs_per_km": 50
    }
})
print("Register:", resp.json())

# Evaluate truck for this load
resp2 = requests.post("http://localhost:8000/load/evaluate", json={
    "load_id": "L999",
    "truck": {
        "truck_id": "T001",
        "available_from_time": "09:30",
        "current_location": "Mumbai",
        "remaining_drive_hours": 7,
        "preferred_rs_per_km": 45,
        "current_load_weight": 12,
        "distance_to_pickup": 15.2,
        "distance_pickup_to_drop": 120.5
    }
})
print("Evaluation:", resp2.json())