import requests
import time

TRUCK_AGENT_URL = "http://localhost:8001"
COORDINATOR_URL = "http://localhost:8000"

def test():
    # 1. Register a truck
    truck_data = {
        "truck_id": "T001",
        "available_from_time": "09:30",
        "current_location": "WH_MUM_01",
        "remaining_drive_hours": 7,
        "preferred_rs_per_km": 45,
        "current_load_weight": 12
    }
    resp = requests.post(f"{TRUCK_AGENT_URL}/truck/register", json=truck_data)
    print("Registration response:", resp.json())

    time.sleep(2)

    # 2. Force evaluation (backdoor)
    resp = requests.post(f"{TRUCK_AGENT_URL}/truck/T001/force-evaluate")
    print("Force evaluation response:", resp.json())

    # 3. List registered trucks
    resp = requests.get(f"{TRUCK_AGENT_URL}/truck/list")
    print("Registered trucks:", resp.json())

    print("\nCheck the Truck Agent console logs for scoring output and recommendation submission.")
    print("You should see: 'Submitted top 2 recommendations for truck T001'")

if __name__ == "__main__":
    test()