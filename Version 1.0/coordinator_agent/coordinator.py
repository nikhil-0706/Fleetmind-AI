import hashlib
from fastapi import FastAPI, HTTPException
from typing import List, Dict, Optional
from models import *
import requests
import math

app = FastAPI(title="Coordinator Agent")

# ---------- Databases (in-memory for MVP) ----------
warehouses_db: Dict[str, Warehouse] = {}
trucks_db: Dict[str, Truck] = {}
loads_db: Dict[str, Load] = {}
pairs_db: Dict[str, TruckLoadPair] = {}

# Graph: adjacency list of warehouses with distances (km)
# For simplicity, we use a distance matrix precomputed. In real system, use graph.
# Here we'll maintain a dict of distances between warehouse IDs.
distance_matrix: Dict[tuple, float] = {}

# ---------- Helper Functions ----------
def get_distance(from_loc: str, to_loc: str) -> float:
    """Get distance between two location identifiers (warehouse IDs or coordinates)."""
    # For MVP, we assume from_loc and to_loc are warehouse IDs.
    # If not found, return a large number.
    return distance_matrix.get((from_loc, to_loc), 999.9)

def generate_pair_id(truck_id: str, load_id: str) -> str:
    return hashlib.md5(f"{truck_id}_{load_id}".encode()).hexdigest()[:8]

def create_truck_load_pair(truck_id: str, load_id: str) -> str:
    truck = trucks_db.get(truck_id)
    load = loads_db.get(load_id)
    if not truck or not load:
        raise ValueError("Truck or load not found")
    pair_id = generate_pair_id(truck_id, load_id)
    pair = TruckLoadPair(
        pair_id=pair_id,
        truck_id=truck_id,
        load_id=load_id,
        pickup_location=load.pickup_location,
        drop_location=load.pickup_location,  # placeholder, will be updated when warehouse chosen
        assigned_warehouse=None,
        assigned_eta=None,
        delivery_deadline=load.delivery_deadline,
        delay_limit=load.delay_limit,
        status="PENDING"
    )
    pairs_db[pair_id] = pair
    # Update truck's assigned pairs
    truck.assigned_pairs.append(pair_id)
    # Remove load from warehouse active_loads (reserved)
    wh = warehouses_db.get(load.warehouse_id)
    if wh and load.load_id in wh.active_loads:
        wh.active_loads.remove(load.load_id)
    return pair_id

def find_nearby_warehouses(location: Location, radius_km: float = 100) -> List[Warehouse]:
    """Simple Euclidean distance between coordinates (for MVP)."""
    nearby = []
    for wh in warehouses_db.values():
        dx = wh.location.lat - location.lat
        dy = wh.location.lon - location.lon
        dist = math.sqrt(dx*dx + dy*dy) * 111  # approximate km per degree
        if dist <= radius_km:
            nearby.append(wh)
    return nearby

def find_nearby_loads(truck: Truck) -> List[Load]:
    """Find loads in warehouses near truck's current location."""
    nearby_wh = find_nearby_warehouses(truck.location)
    loads = []
    for wh in nearby_wh:
        for load_id in wh.active_loads:
            load = loads_db.get(load_id)
            if load and load.weight <= truck.remaining_capacity:
                loads.append(load)
    return loads

def check_deadline_feasibility(pair: TruckLoadPair, additional_delay_minutes: int) -> bool:
    """Check if adding a detour will violate deadline+delay_limit."""
    # For MVP, assume current ETA is stored in pair.assigned_eta.
    # If not scheduled yet, return True.
    if not pair.assigned_eta:
        return True
    # Parse current ETA and add delay, compare to deadline+delay_limit.
    # Simplified: if additional_delay > delay_limit, reject.
    return additional_delay_minutes <= pair.delay_limit

# ---------- Endpoints for External Systems (e.g., UI) ----------
@app.post("/register/warehouse")
def register_warehouse(warehouse: Warehouse):
    warehouses_db[warehouse.warehouse_id] = warehouse
    return {"status": "ok"}

@app.post("/register/truck")
def register_truck(truck: Truck):
    trucks_db[truck.truck_id] = truck
    return {"status": "ok"}

@app.post("/register/load")
def register_load(load: Load):
    loads_db[load.load_id] = load
    # Also add to warehouse's active_loads
    wh = warehouses_db.get(load.warehouse_id)
    if wh:
        wh.active_loads.append(load.load_id)
    return {"status": "ok"}

@app.post("/distance/add")
def add_distance(from_id: str, to_id: str, km: float):
    distance_matrix[(from_id, to_id)] = km
    distance_matrix[(to_id, from_id)] = km  # symmetric
    return {"status": "ok"}

# ---------- Core Matching & Planning ----------
@app.post("/coordinator/match_truck")
def match_truck(truck_id: str):
    """Main entry: find best next load for a truck and schedule it."""
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    if truck.status != "IDLE" and truck.remaining_capacity <= 0:
        return {"message": "Truck has no capacity"}

    # 1. Find candidate loads
    candidates = find_nearby_loads(truck)
    if not candidates:
        return {"message": "No nearby loads"}

    # 2. Evaluate each candidate with Truck Agent
    truck_agent_url = "http://localhost:8001"  # configurable
    scores = []
    for load in candidates:
        dist_to_pickup = get_distance(truck.location.warehouse_id(), load.warehouse_id)  # need helper
        dist_pickup_to_drop = get_distance(load.warehouse_id, load.drop_location)  # placeholder
        # Call Truck Agent
        resp = requests.post(f"{truck_agent_url}/truck/evaluate-load", json={
            "truck": truck.dict(),
            "load": load.dict(),
            "distance_data": {
                "distance_to_pickup": dist_to_pickup,
                "distance_pickup_to_drop": dist_pickup_to_drop
            }
        })
        if resp.status_code == 200:
            result = resp.json()
            scores.append((load, result["utility_score"]))

    # 3. Sort by score descending
    scores.sort(key=lambda x: x[1], reverse=True)
    top_candidates = scores[:3]

    # 4. For each top candidate, ask Load Agent
    load_agent_url = "http://localhost:8000"
    final_matches = []
    for load, truck_score in top_candidates:
        # Prepare truck details for Load Agent
        truck_details = {
            "truck_id": truck.truck_id,
            "available_from_time": truck.available_from,
            "current_location": f"{truck.location.lat},{truck.location.lon}",
            "remaining_drive_hours": truck.remaining_drive_hours,
            "preferred_rs_per_km": truck.preferred_rs_per_km,
            "current_load_weight": truck.current_load_weight,
            "distance_to_pickup": get_distance(truck.location.warehouse_id(), load.warehouse_id),
            "distance_pickup_to_drop": get_distance(load.warehouse_id, load.drop_location)
        }
        resp = requests.post(f"{load_agent_url}/load/evaluate", json={
            "load_id": load.load_id,
            "truck": truck_details
        })
        if resp.status_code == 200:
            load_score = resp.json().get("utility_score", 0)
            combined = (truck_score + load_score) / 2
            final_matches.append((load, combined))

    if not final_matches:
        return {"message": "No mutual agreement"}

    # 5. Choose best combined score
    best_load, best_score = max(final_matches, key=lambda x: x[1])
    # Create pair
    pair_id = create_truck_load_pair(truck.truck_id, best_load.load_id)
    pair = pairs_db[pair_id]

    # 6. Warehouse Planning: try warehouses near pickup or along route
    warehouse_agent_url = "http://localhost:8003"
    best_wh_score = -1
    best_wh = None
    best_eta = None
    # For MVP, try all active warehouses within 50km of pickup
    nearby_wh = find_nearby_warehouses(best_load.pickup_location, radius_km=50)
    for wh in nearby_wh:
        # Try a few ETAs (current time + travel)
        eta = "15:00"  # simplified
        unload_duration = 30  # default
        resp = requests.post(f"{warehouse_agent_url}/warehouse/evaluate", json={
            "truck_id": truck.truck_id,
            "warehouse_id": wh.warehouse_id,
            "load_type": best_load.type,
            "eta": eta,
            "unloading_duration": unload_duration,
            "delivery_deadline": best_load.delivery_deadline
        })
        if resp.status_code == 200:
            wh_score = resp.json().get("utility_score", 0)
            if wh_score > best_wh_score:
                best_wh_score = wh_score
                best_wh = wh
                best_eta = eta
    if best_wh:
        pair.assigned_warehouse = best_wh.warehouse_id
        pair.assigned_eta = best_eta
        pair.status = "SCHEDULED"
        # Update warehouse schedule
        best_wh.scheduled_trucks.append({
            "truck_id": truck.truck_id,
            "eta": best_eta,
            "unload_time": unload_duration
        })
        # Update truck status
        truck.status = "ENROUTE"
        truck.current_load_weight += best_load.weight
        truck.remaining_capacity = 20 - truck.current_load_weight
        return {"pair_id": pair_id, "warehouse": best_wh.warehouse_id, "eta": best_eta}
    else:
        return {"message": "No suitable warehouse found"}

@app.post("/coordinator/intermediate_pickup")
def intermediate_pickup(truck_id: str):
    """Called when truck has free capacity during journey."""
    truck = trucks_db.get(truck_id)
    if not truck or truck.remaining_capacity <= 0:
        return {"message": "No capacity"}
    # Similar to match_truck but also checks deadline feasibility for existing pairs
    # For brevity, similar logic but includes deadline checks.
    # We'll reuse match_truck logic after filtering loads that won't break deadlines.
    # Implementation omitted for space, but follows same pattern.
    return {"message": "Intermediate pickup check"}

@app.post("/coordinator/backhaul_plan")
def backhaul_plan(truck_id: str):
    """Call Backhaul Agent to score next possible actions."""
    truck = trucks_db.get(truck_id)
    if not truck:
        raise HTTPException(404, "Truck not found")
    # Gather pending deliveries from truck's assigned pairs with status ENROUTE
    pending = []
    for pair_id in truck.assigned_pairs:
        pair = pairs_db[pair_id]
        if pair.status in ["SCHEDULED", "ENROUTE"]:
            pending.append({
                "load_id": pair.load_id,
                "drop_location": str(pair.drop_location),
                "delivery_deadline": pair.delivery_deadline,
                "load_weight": loads_db[pair.load_id].weight,
                "offered_rs_per_km": loads_db[pair.load_id].offered_rs_per_km
            })
    # Find candidate pickups (nearby loads)
    candidate_pickups = find_nearby_loads(truck)
    # Build distance data
    distance_data = {
        "to_delivery_locations": {},
        "to_pickup_locations": {},
        "pickup_to_drop": {}
    }
    # Populate distance_data (simplified)
    # Call Backhaul Agent
    backhaul_url = "http://localhost:8004"
    resp = requests.post(f"{backhaul_url}/backhaul/evaluate", json={
        "truck": truck.dict(),
        "pending_deliveries": pending,
        "candidate_pickups": [c.dict() for c in candidate_pickups],
        "distance_data": distance_data
    })
    if resp.status_code == 200:
        scores = resp.json().get("scores", {})
        # Choose highest score action
        best_action = max(scores, key=scores.get)
        # Execute action (e.g., if starts with "pickup_", call intermediate_pickup)
        return {"best_action": best_action, "scores": scores}
    return {"error": "Backhaul evaluation failed"}

@app.get("/")
def home():
    return {"message": "Coordinator Agent running"}