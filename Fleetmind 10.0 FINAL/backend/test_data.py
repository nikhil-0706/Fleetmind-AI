import requests
import time

BASE = "http://localhost:8005"

def register_user(role, uid, password="1234"):
    r = requests.post(f"{BASE}/auth/register", json={"role": role, "id": uid, "password": password})
    print(f"Register {role} {uid}: {r.status_code} {r.json()}")
    return r

def login(role, uid, password="1234"):
    r = requests.post(f"{BASE}/auth/login", json={"role": role, "id": uid, "password": password})
    return r

def register_warehouse(wid, node):
    r = login("warehouse", wid)
    if r.status_code != 200:
        print(f"Login failed for {wid}")
        return
    payload = {"warehouse_id": wid, "node_id": node, "compatible_load_types": ["general"], "status": "ACTIVE"}
    r = requests.post(f"{BASE}/warehouse/register", json=payload)
    data = r.json()
    if data.get('success'):
        print(f"✅ Warehouse {wid} at {node}")
    else:
        print(f"❌ Warehouse {wid} failed: {data.get('error')}")

def register_load(load_id, shipper_id, pickup_node, drop_node, weight, rate):
    r = login("shipper", shipper_id)
    if r.status_code != 200:
        print(f"Login failed for shipper {shipper_id}")
        return
    payload = {
        "load_id": load_id,
        "shipper_id": shipper_id,
        "type": "general",
        "weight": weight,
        "pickup_node_id": pickup_node,
        "drop_node_id": drop_node,
        "offered_rs_per_km": rate,
        "delivery_deadline": "18:00",
        "pickup_time": "10:00",
        "delay_limit": 30,
        "status": "PENDING"
    }
    r = requests.post(f"{BASE}/shipper/register/load", json=payload)
    data = r.json()
    if data.get('success'):
        print(f"✅ Load {load_id} registered (pickup {pickup_node} → {drop_node})")
    else:
        print(f"❌ Load {load_id} failed: {data.get('error')}")

def register_truck(truck_id, driver_id, node, capacity=20, rate=45):
    r = login("driver", driver_id)
    if r.status_code != 200:
        print(f"Login failed for driver {driver_id}")
        return
    payload = {
        "truck_id": truck_id,
        "driver_id": driver_id,
        "remaining_capacity": capacity,
        "preferred_rs_per_km": rate,
        "current_node_id": node,
        "status": "INACTIVE"
    }
    r = requests.post(f"{BASE}/driver/register/truck", json=payload)
    data = r.json()
    if data.get('success'):
        print(f"✅ Truck {truck_id} at {node}")
    else:
        print(f"❌ Truck {truck_id} failed: {data.get('error')}")

def generate_test_data():
    print("=" * 60)
    print("🚀 Generating Test Data for FleetMind 7.0")
    print("=" * 60)

    # 1. Register users
    print("\n📝 Registering users...")
    register_user("admin", "a1")
    register_user("driver", "dr1")
    register_user("shipper", "sh1")
    # 4 warehouse managers
    for i in range(1, 5):
        register_user("warehouse", f"wh{i}")

    # 2. Register 4 warehouses
    print("\n🏢 Registering warehouses...")
    warehouse_map = {
        "wh1": "N2",
        "wh2": "N5",
        "wh3": "N8",
        "wh4": "N10"
    }
    for wid, node in warehouse_map.items():
        register_warehouse(wid, node)

    # 3. Register 4 loads (using only warehouse nodes as pickup and drop)
    print("\n📦 Registering loads...")
    loads = [
        ("L1", "N2", "N5", 5, 60),   # wh1 → wh2
        ("L2", "N2", "N8", 3, 55),   # wh1 → wh3
        ("L3", "N5", "N10", 4, 50),  # wh2 → wh4
        ("L4", "N8", "N2", 6, 65),   # wh3 → wh1
    ]
    for load_id, pickup, drop, weight, rate in loads:
        register_load(load_id, "sh1", pickup, drop, weight, rate)

    # 4. Register truck for dr1 at N1
    print("\n🚛 Registering truck...")
    register_truck("T1", "dr1", "N1", capacity=20, rate=45)

    print("\n" + "=" * 60)
    print("✅ Test data generation complete!")
    print("=" * 60)
    print("\n📌 Summary:")
    print("  - Users: admin/a1, driver/dr1, shipper/sh1, warehouse/wh1-wh4")
    print("  - Warehouses at N2, N5, N8, N10")
    print("  - Loads: L1 (N2→N5), L2 (N2→N8), L3 (N5→N10), L4 (N8→N2)")
    print("  - Truck: T1 at N1 (driver dr1)")
    print("  - All passwords: 1234")
    print("\nStart a session as dr1 to see proposals.\n")

if __name__ == "__main__":
    generate_test_data()