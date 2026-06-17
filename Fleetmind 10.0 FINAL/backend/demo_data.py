import requests
import time
import json

BASE = "http://localhost:8005"

def print_response(label, r):
    try:
        data = r.json()
        print(f"{label}: {r.status_code} {json.dumps(data, indent=2)[:500]}")
    except:
        print(f"{label}: {r.status_code} {r.text[:200]}")

def login(role, uid):
    r = requests.post(f"{BASE}/auth/login", json={"role": role, "id": uid, "password": "pass"})
    return r

def test_multi_load():
    print("=" * 60)
    print("🧪 FLEETMIND MULTI-LOAD TEST")
    print("=" * 60)

    # 1. Register users
    users = [
        ("warehouse", "WH1"), ("warehouse", "WH2"),
        ("warehouse", "WH3"), ("warehouse", "WH4"),
        ("shipper", "SHIP1"), ("driver", "DR1")
    ]
    for role, uid in users:
        r = requests.post(f"{BASE}/auth/register", json={"role": role, "id": uid, "password": "pass"})
        print(f"Register {role} {uid}: {r.status_code}")

    # 2. Register warehouses
    warehouse_map = {"WH1": "N2", "WH2": "N3", "WH3": "N5", "WH4": "N7"}
    for wid, node in warehouse_map.items():
        r = login("warehouse", wid)
        if r.status_code == 200:
            payload = {"warehouse_id": wid, "node_id": node, "compatible_load_types": ["general"], "status": "ACTIVE"}
            r = requests.post(f"{BASE}/warehouse/register", json=payload)
            print(f"Register warehouse {wid} at {node}: {r.status_code}")

    # 3. Register loads
    r = login("shipper", "SHIP1")
    loads = [
        {"load_id": "L1", "pickup": "N2", "drop": "N5", "weight": 5},
        {"load_id": "L2", "pickup": "N3", "drop": "N7", "weight": 6}
    ]
    for load in loads:
        payload = {
            "load_id": load["load_id"],
            "shipper_id": "SHIP1",
            "type": "general",
            "weight": load["weight"],
            "pickup_node_id": load["pickup"],
            "drop_node_id": load["drop"],
            "offered_rs_per_km": 60,
            "delivery_deadline": "16:00",
            "pickup_time": "10:00",
            "delay_limit": 30,
            "status": "PENDING"
        }
        r = requests.post(f"{BASE}/shipper/register/load", json=payload)
        print(f"Register load {load['load_id']}: {r.status_code}")

    # 4. Register truck
    r = login("driver", "DR1")
    truck_payload = {
        "truck_id": "T1",
        "driver_id": "DR1",
        "remaining_capacity": 20,
        "preferred_rs_per_km": 45,
        "current_node_id": "N1",
        "status": "INACTIVE"
    }
    r = requests.post(f"{BASE}/driver/register/truck", json=truck_payload)
    print(f"Register truck: {r.status_code}")

    # 5. Start session
    r = requests.post(f"{BASE}/driver/truck/T1/session/start")
    print(f"Start session: {r.status_code}")
    time.sleep(2)

    # 6. Accept proposals – only accept each load once
    accepted_loads = set()
    for attempt in range(5):  # max 5 attempts
        r = requests.get(f"{BASE}/driver/truck/T1/proposals")
        proposals = r.json().get("proposals", [])
        if not proposals:
            break

        # Find a proposal for a load not yet accepted
        for prop in proposals:
            load_id = prop["load_id"]
            if load_id in accepted_loads:
                continue
            prop_id = prop["proposal_id"]
            print(f"\n✅ Accepting proposal for {load_id}: {prop_id}")
            r = requests.post(f"{BASE}/driver/truck/T1/proposals/{prop_id}/accept")
            print(f"Accept response: {r.status_code} {r.text[:100]}")
            if r.status_code == 200:
                accepted_loads.add(load_id)
                r = requests.get(f"{BASE}/driver/truck/T1/status")
                status = r.json()
                print(f"Remaining capacity: {status.get('remaining_capacity', '?')} T")
                time.sleep(1)
                break  # accepted one, break inner loop to refresh proposals

    # 7. Final state
    r = requests.get(f"{BASE}/driver/truck/T1/pending")
    print("\n📦 Pending deliveries:")
    print_response("Pending", r)

    r = requests.get(f"{BASE}/driver/truck/T1/proposals")
    print("\n📋 Remaining proposals:")
    print_response("Proposals", r)

    print("\n" + "=" * 60)
    print(f"✅ Accepted loads: {accepted_loads}")
    print("=" * 60)

if __name__ == "__main__":
    test_multi_load()