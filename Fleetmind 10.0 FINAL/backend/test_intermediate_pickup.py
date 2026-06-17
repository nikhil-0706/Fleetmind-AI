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

def test_intermediate():
    print("=" * 60)
    print("🧪 TEST: INTERMEDIATE PICKUP (Idle, Traveling, At Node)")
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

    # 3. Register two loads
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

    # 6. Accept only L1
    r = requests.get(f"{BASE}/driver/truck/T1/proposals")
    proposals = r.json().get("proposals", [])
    l1_proposal = next((p for p in proposals if p['load_id'] == 'L1'), None)
    if l1_proposal:
        prop_id = l1_proposal['proposal_id']
        print(f"\n✅ Accepting L1 (initial): {prop_id}")
        r = requests.post(f"{BASE}/driver/truck/T1/proposals/{prop_id}/accept")
        print(f"Accept response: {r.status_code} {r.text[:100]}")
        time.sleep(1)

    # 7. Check status and depart to N2
    r = requests.get(f"{BASE}/driver/truck/T1/status")
    status = r.json()
    print(f"\n🛻 Status after L1: capacity={status['remaining_capacity']}T, status={status['status']}")

    print("\n🚀 Departing to N2 (pickup for L1)")
    r = requests.post(f"{BASE}/driver/truck/T1/depart", params={"to_node_id": "N2"})
    print(f"Depart response: {r.status_code} {r.text[:100]}")
    time.sleep(2)

    # 8. Wait for background matching while traveling
    print("\n⏳ Waiting 35 seconds for background matching to run while traveling...")
    time.sleep(35)

    # 9. Check proposals while traveling
    r = requests.get(f"{BASE}/driver/truck/T1/proposals")
    proposals = r.json().get("proposals", [])
    print(f"\n📋 Proposals while TRAVELING: {len(proposals)}")
    for p in proposals:
        print(f"  - {p['load_id']} (type: {p['proposal_type']}, score: {p['score']})")

    # 10. Accept L2 while traveling
    l2_proposal = next((p for p in proposals if p['load_id'] == 'L2'), None)
    if l2_proposal:
        prop_id = l2_proposal['proposal_id']
        print(f"\n✅ Accepting L2 (intermediate) while TRAVELING: {prop_id}")
        r = requests.post(f"{BASE}/driver/truck/T1/proposals/{prop_id}/accept")
        print(f"Accept response: {r.status_code} {r.text[:100]}")
        time.sleep(1)

    # 11. Arrive at N2 (first pickup)
    print("\n📍 Arriving at N2")
    r = requests.post(f"{BASE}/driver/truck/T1/arrive", params={"node_id": "N2"})
    print(f"Arrive response: {r.status_code} {r.text[:100]}")
    time.sleep(2)

    # 12. Now the truck is at N2, we need to go to N5 (drop for L1). But the route might be multi-hop.
    # We'll depart to N5, and then handle intermediate arrivals.
    print("\n🔄 Departing to N5 (drop for L1)")
    r = requests.post(f"{BASE}/driver/truck/T1/depart", params={"to_node_id": "N5"})
    print(f"Depart response: {r.status_code} {r.text[:100]}")
    if r.status_code == 200:
        data = r.json()
        route = data.get('route', [])
        if route:
            print(f"Route: {route}")
            # Simulate arriving at each intermediate node
            for node in route:
                print(f"📍 Arriving at {node}")
                r = requests.post(f"{BASE}/driver/truck/T1/arrive", params={"node_id": node})
                print(f"Arrive response: {r.status_code} {r.text[:100]}")
                time.sleep(1)
                # After arrival, the truck will automatically depart to the next hop if route remains.
        else:
            # Direct edge, just arrive at N5
            print("📍 Arriving at N5")
            r = requests.post(f"{BASE}/driver/truck/T1/arrive", params={"node_id": "N5"})
            print(f"Arrive response: {r.status_code} {r.text[:100]}")
    time.sleep(1)

    # 13. Complete L1 delivery (should be at N5 now)
    r = requests.get(f"{BASE}/driver/truck/T1/pending")
    pending = r.json().get("pending", [])
    l1_pair = next((p for p in pending if p['load_id'] == 'L1'), None)
    if l1_pair:
        pair_id = l1_pair['pair_id']
        print(f"\n✅ Completing L1 delivery (pair {pair_id})")
        r = requests.post(f"{BASE}/driver/delivery/complete", params={"truck_id": "T1", "pair_id": pair_id})
        print(f"Complete response: {r.status_code} {r.text[:100]}")
        time.sleep(1)

    # 14. Now go to N7 for L2 drop
    print("\n🔄 Departing to N7 (drop for L2)")
    r = requests.post(f"{BASE}/driver/truck/T1/depart", params={"to_node_id": "N7"})
    print(f"Depart response: {r.status_code} {r.text[:100]}")
    if r.status_code == 200:
        data = r.json()
        route = data.get('route', [])
        if route:
            for node in route:
                print(f"📍 Arriving at {node}")
                r = requests.post(f"{BASE}/driver/truck/T1/arrive", params={"node_id": node})
                print(f"Arrive response: {r.status_code} {r.text[:100]}")
                time.sleep(1)
        else:
            print("📍 Arriving at N7")
            r = requests.post(f"{BASE}/driver/truck/T1/arrive", params={"node_id": "N7"})
            print(f"Arrive response: {r.status_code} {r.text[:100]}")
    time.sleep(1)

    # 15. Complete L2 delivery
    r = requests.get(f"{BASE}/driver/truck/T1/pending")
    pending = r.json().get("pending", [])
    l2_pair = next((p for p in pending if p['load_id'] == 'L2'), None)
    if l2_pair:
        pair_id = l2_pair['pair_id']
        print(f"\n✅ Completing L2 delivery (pair {pair_id})")
        r = requests.post(f"{BASE}/driver/delivery/complete", params={"truck_id": "T1", "pair_id": pair_id})
        print(f"Complete response: {r.status_code} {r.text[:100]}")
        time.sleep(1)

    # 16. Final state
    r = requests.get(f"{BASE}/driver/truck/T1/status")
    status = r.json()
    print(f"\n🛻 Final status: capacity={status['remaining_capacity']}T, status={status['status']}")

    # 17. Earnings (use driver ID, not truck)
    r = requests.get(f"{BASE}/driver/DR1/earnings", params={"period": "monthly"})
    print("\n💰 Earnings:")
    print_response("Earnings", r)

    print("\n" + "=" * 60)
    print("✅ TEST COMPLETE")
    print("=" * 60)

if __name__ == "__main__":
    test_intermediate()