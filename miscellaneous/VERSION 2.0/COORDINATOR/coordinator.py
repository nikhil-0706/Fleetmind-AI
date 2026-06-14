import hashlib, math
from fastapi import FastAPI, HTTPException
from typing import List, Dict, Optional
from .models import *
import requests

app = FastAPI(title="Coordinator Agent")

# ---------- Databases ----------
warehouses_db: Dict[str, Warehouse] = {}
trucks_db: Dict[str, Truck] = {}
loads_db: Dict[str, Load] = {}
pairs_db: Dict[str, TruckLoadPair] = {}
distance_matrix: Dict[tuple, float] = {}   # (from_id, to_id) -> km

# Configuration
DETOUR_THRESHOLD_KM = 20   # max extra km for intermediate pickup
DEADLINE_BUFFER_MIN = 15    # extra buffer beyond delay_limit (optional)

# Helper: distance between two warehouse IDs or location strings
def get_distance(from_id: str, to_id: str) -> float:
    return distance_matrix.get((from_id, to_id), 999.9)

def generate_pair_id(truck_id: str, load_id: str) -> str:
    return hashlib.md5(f"{truck_id}_{load_id}".encode()).hexdigest()[:8]

def create_truck_load_pair(truck_id: str, load_id: str) -> str:
    truck = trucks_db[truck_id]
    load = loads_db[load_id]
    if not truck or not load:
        raise ValueError("Truck or load not found")
    pair_id = generate_pair_id(truck_id, load_id)
    # For simplicity, store pickup location as load's warehouse location; drop location will be set later.
    pair = TruckLoadPair(
        pair_id=pair_id,
        truck_id=truck_id,
        load_id=load_id,
        pickup_location=load.pickup_location,
        drop_location=load.pickup_location,  # placeholder
        assigned_warehouse=None,
        assigned_eta=None,
        delivery_deadline=load.delivery_deadline,
        delay_limit=load.delay_limit,
        status="PENDING"
    )
    pairs_db[pair_id] = pair
    truck.assigned_pairs.append(pair_id)
    # Remove load from warehouse active_loads
    wh = warehouses_db.get(load.warehouse_id)
    if wh and load.load_id in wh.active_loads:
        wh.active_loads.remove(load.load_id)
    return pair_id

def find_nearby_warehouses(location: Location, radius_km: float = 100) -> List[Warehouse]:
    nearby = []
    for wh in warehouses_db.values():
        dx = wh.location.lat - location.lat
        dy = wh.location.lon - location.lon
        dist = math.sqrt(dx*dx + dy*dy) * 111  # approximate km per degree
        if dist <= radius_km:
            nearby.append(wh)
    return nearby

def find_nearby_loads(truck: Truck) -> List[Load]:
    nearby_wh = find_nearby_warehouses(truck.location)
    loads = []
    for wh in nearby_wh:
        for lid in wh.active_loads:
            load = loads_db.get(lid)
            if load and load.weight <= truck.remaining_capacity:
                loads.append(load)
    return loads

def compute_detour_km(truck: Truck, candidate_warehouse_id: str, next_stop_id: str) -> float:
    direct = get_distance(truck.location.warehouse_id(), next_stop_id)  # need mapping
    via_wh = get_distance(truck.location.warehouse_id(), candidate_warehouse_id) + get_distance(candidate_warehouse_id, next_stop_id)
    return via_wh - direct

def check_deadline_safety(truck: Truck, candidate_load: Load, candidate_warehouse_id: str, eta_str: str) -> bool:
    # Simplified: simulate added time to all pending deliveries.
    # For MVP, assume only one pending delivery (the original). 
    # If multiple, need more complex simulation.
    # Here we just check that the candidate load's delivery deadline is feasible.
    # For intermediate, we also need to check that existing pending deliveries still meet deadlines.
    # We'll implement a basic version.
    # For now, we assume the candidate load's delivery deadline is already enforced by Warehouse Agent.
    # Return True if no violation.
    return True

# ---------- Endpoints for Registration ----------
@app.post("/register/warehouse")
def register_warehouse(wh: Warehouse):
    warehouses_db[wh.warehouse_id] = wh
    return {"status": "ok"}

@app.post("/register/truck")
def register_truck(truck: Truck):
    trucks_db[truck.truck_id] = truck
    return {"status": "ok"}

@app.post("/register/load")
def register_load(load: Load):
    loads_db[load.load_id] = load
    wh = warehouses_db.get(load.warehouse_id)
    if wh:
        wh.active_loads.append(load.load_id)
    # After new load registration, trigger intermediate pickup search for relevant trucks
    # (Optional: find trucks with free capacity near this load's warehouse)
    return {"status": "ok"}

@app.post("/distance/add")
def add_distance(from_id: str, to_id: str, km: float):
    distance_matrix[(from_id, to_id)] = km
    distance_matrix[(to_id, from_id)] = km
    return {"status": "ok"}

# ---------- Core Matching ----------
@app.post("/coordinator/match_truck")
def match_truck(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if truck.status != "IDLE" and truck.remaining_capacity <= 0:
        return {"message": "No capacity"}

    candidates = find_nearby_loads(truck)
    if not candidates:
        return {"message": "No nearby loads"}

    # For each candidate, call Truck Agent and Load Agent
    truck_agent_url = "http://localhost:8001"
    load_agent_url = "http://localhost:8000"
    scores = []
    for load in candidates:
        # Get distances
        dist_to_pickup = get_distance(truck.location.warehouse_id(), load.warehouse_id)  # need mapping
        dist_pickup_to_drop = get_distance(load.warehouse_id, "some_drop")  # placeholder
        # Call Truck Agent
        resp = requests.post(f"{truck_agent_url}/truck/evaluate-load", json={
            "truck": truck.dict(),
            "load": load.dict(),
            "distance_data": {"distance_to_pickup": dist_to_pickup, "distance_pickup_to_drop": dist_pickup_to_drop}
        })
        if resp.status_code == 200:
            truck_score = resp.json()["utility_score"]
            # Call Load Agent (stateless, send full load)
            load_resp = requests.post(f"{load_agent_url}/load/evaluate", json={
                "load": load.dict(),
                "truck": {
                    "truck_id": truck.truck_id,
                    "available_from_time": truck.available_from,
                    "current_location": truck.location.warehouse_id(),
                    "remaining_drive_hours": truck.remaining_drive_hours,
                    "preferred_rs_per_km": truck.preferred_rs_per_km,
                    "current_load_weight": truck.current_load_weight,
                    "distance_to_pickup": dist_to_pickup,
                    "distance_pickup_to_drop": dist_pickup_to_drop
                }
            })
            if load_resp.status_code == 200:
                load_score = load_resp.json()["utility_score"]
                combined = (truck_score + load_score) / 2
                scores.append((load, combined))

    if not scores:
        return {"message": "No mutual agreement"}
    best_load, best_score = max(scores, key=lambda x: x[1])
    pair_id = create_truck_load_pair(truck.truck_id, best_load.load_id)
    # Warehouse planning (simplified)
    warehouse_agent_url = "http://localhost:8003"
    # Pick first active warehouse near pickup
    nearby_wh = find_nearby_warehouses(best_load.pickup_location, 50)
    for wh in nearby_wh:
        eta = "15:00"  # compute realistically
        resp = requests.post(f"{warehouse_agent_url}/warehouse/evaluate", json={
            "truck_id": truck.truck_id,
            "warehouse_id": wh.warehouse_id,
            "load_type": best_load.type,
            "eta": eta,
            "unloading_duration": 30,
            "delivery_deadline": best_load.delivery_deadline
        })
        if resp.status_code == 200 and resp.json()["utility_score"] > 50:
            pair = pairs_db[pair_id]
            pair.assigned_warehouse = wh.warehouse_id
            pair.assigned_eta = eta
            pair.status = "SCHEDULED"
            # Update truck state
            truck.status = "ENROUTE"
            truck.current_load_weight += best_load.weight
            truck.remaining_capacity = 20 - truck.current_load_weight
            # Update warehouse schedule
            wh.scheduled_trucks.append({"truck_id": truck.truck_id, "eta": eta, "unload_time": 30})
            return {"pair_id": pair_id, "warehouse": wh.warehouse_id, "eta": eta}
    return {"message": "Warehouse not found"}

# ---------- Intermediate Pickup (Event‑Driven) ----------
@app.post("/coordinator/delivery_complete")
def delivery_complete(truck_id: str, delivered_pair_id: str):
    # Update truck state, remove delivered load
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    pair = pairs_db.get(delivered_pair_id)
    if not pair:
        raise HTTPException(404, "Pair not found")
    # Mark pair as delivered
    pair.status = "DELIVERED"
    # Remove from truck's assigned_pairs
    if delivered_pair_id in truck.assigned_pairs:
        truck.assigned_pairs.remove(delivered_pair_id)
    # Update truck load weight (need load details)
    load = loads_db.get(pair.load_id)
    if load:
        truck.current_load_weight -= load.weight
        truck.remaining_capacity = 20 - truck.current_load_weight
    # If remaining capacity > 0, trigger intermediate pickup search
    if truck.remaining_capacity > 0:
        # Simple: call a helper to search for a single best intermediate pickup
        result = try_intermediate_pickup(truck_id)
        return {"message": "Delivery completed", "intermediate_search": result}
    return {"message": "Delivery completed, no capacity"}

def try_intermediate_pickup(truck_id: str):
    truck = trucks_db[truck_id]
    # Find candidate loads near current location
    candidates = find_nearby_loads(truck)
    if not candidates:
        return {"message": "No nearby loads"}
    # For each candidate, evaluate (similar to match_truck) but also check route deviation
    # Simplified: iterate and pick first acceptable
    truck_agent_url = "http://localhost:8001"
    load_agent_url = "http://localhost:8000"
    warehouse_agent_url = "http://localhost:8003"
    best = None
    best_score = -1
    for load in candidates:
        # Compute distances (simplified)
        dist_to_pickup = get_distance(truck.location.warehouse_id(), load.warehouse_id)
        dist_pickup_to_drop = get_distance(load.warehouse_id, "some_drop")
        # Truck Agent
        resp_t = requests.post(f"{truck_agent_url}/truck/evaluate-load", json={
            "truck": truck.dict(),
            "load": load.dict(),
            "distance_data": {"distance_to_pickup": dist_to_pickup, "distance_pickup_to_drop": dist_pickup_to_drop}
        })
        if resp_t.status_code != 200:
            continue
        truck_score = resp_t.json()["utility_score"]
        # Load Agent
        resp_l = requests.post(f"{load_agent_url}/load/evaluate", json={
            "load": load.dict(),
            "truck": {
                "truck_id": truck.truck_id,
                "available_from_time": truck.available_from,
                "current_location": truck.location.warehouse_id(),
                "remaining_drive_hours": truck.remaining_drive_hours,
                "preferred_rs_per_km": truck.preferred_rs_per_km,
                "current_load_weight": truck.current_load_weight,
                "distance_to_pickup": dist_to_pickup,
                "distance_pickup_to_drop": dist_pickup_to_drop
            }
        })
        if resp_l.status_code != 200:
            continue
        load_score = resp_l.json()["utility_score"]
        combined = (truck_score + load_score) / 2
        # Warehouse evaluation
        # For simplicity, assume load's warehouse is the pickup warehouse
        wh_id = load.warehouse_id
        eta = "15:00"  # compute properly
        resp_w = requests.post(f"{warehouse_agent_url}/warehouse/evaluate", json={
            "truck_id": truck.truck_id,
            "warehouse_id": wh_id,
            "load_type": load.type,
            "eta": eta,
            "unloading_duration": 30,
            "delivery_deadline": load.delivery_deadline
        })
        if resp_w.status_code != 200:
            continue
        wh_score = resp_w.json()["utility_score"]
        if wh_score < 50:
            continue
        # Route deviation check: need the next stop (first pending delivery)
        # For MVP, if truck has any pending pair, take its drop location as next stop
        next_stop_id = None
        if truck.assigned_pairs:
            first_pair = pairs_db[truck.assigned_pairs[0]]
            # In reality, we need drop location. Hardcoded for now.
            next_stop_id = "some_destination"
        if next_stop_id:
            detour = compute_detour_km(truck, wh_id, next_stop_id)
            if detour > DETOUR_THRESHOLD_KM:
                continue
        # Deadline safety - simplified pass
        if check_deadline_safety(truck, load, wh_id, eta):
            if combined > best_score:
                best_score = combined
                best = (load, wh_id, eta)
    if best:
        load, wh_id, eta = best
        # Create new pair and schedule
        pair_id = create_truck_load_pair(truck.truck_id, load.load_id)
        pair = pairs_db[pair_id]
        pair.assigned_warehouse = wh_id
        pair.assigned_eta = eta
        pair.status = "SCHEDULED"
        # Update truck state
        truck.current_load_weight += load.weight
        truck.remaining_capacity = 20 - truck.current_load_weight
        # Update warehouse schedule
        wh = warehouses_db[wh_id]
        wh.scheduled_trucks.append({"truck_id": truck.truck_id, "eta": eta, "unload_time": 30})
        # Because destination changed, call Backhaul Agent
        backhaul_plan(truck_id)
        return {"pair_id": pair_id, "warehouse": wh_id, "eta": eta}
    return {"message": "No suitable intermediate pickup"}

@app.post("/coordinator/backhaul_plan")
def backhaul_plan(truck_id: str):
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    # Prepare pending deliveries from assigned pairs
    pending = []
    for pid in truck.assigned_pairs:
        pair = pairs_db[pid]
        if pair.status in ["SCHEDULED", "ENROUTE"]:
            load = loads_db[pair.load_id]
            pending.append({
                "load_id": load.load_id,
                "drop_location": load.pickup_location.warehouse_id(),  # placeholder
                "delivery_deadline": load.delivery_deadline,
                "load_weight": load.weight,
                "offered_rs_per_km": load.offered_rs_per_km
            })
    # Candidate pickups (nearby loads)
    candidates = find_nearby_loads(truck)
    candidate_pickups = []
    for l in candidates:
        candidate_pickups.append({
            "load_id": l.load_id,
            "pickup_location": l.warehouse_id,
            "drop_location": "some_drop",
            "pickup_deadline": l.delivery_deadline,  # simplified
            "offered_rs_per_km": l.offered_rs_per_km,
            "load_weight": l.weight
        })
    # Distance data (simplified)
    dist_data = {
        "to_delivery_locations": {},
        "to_pickup_locations": {},
        "pickup_to_drop": {},
        "to_relocation_warehouses": {}
    }
    # Call Backhaul Agent
    backhaul_url = "http://localhost:8004"
    resp = requests.post(f"{backhaul_url}/backhaul/evaluate", json={
        "truck": truck.dict(),
        "pending_deliveries": pending,
        "candidate_pickups": candidate_pickups,
        "distance_data": dist_data,
        "candidate_relocation_warehouses": []
    })
    if resp.status_code == 200:
        scores = resp.json()["scores"]
        # Choose best action
        best_action = max(scores, key=scores.get)
        return {"best_action": best_action, "scores": scores}
    return {"error": "Backhaul evaluation failed"}

@app.get("/")
def home():
    return {"message": "Coordinator running"}