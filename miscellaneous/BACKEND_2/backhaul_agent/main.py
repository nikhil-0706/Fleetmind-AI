from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List
from .scoring import evaluate_next_actions
from common.config import BACKHAUL_AGENT_PORT, DETOUR_THRESHOLD_KM

app = FastAPI(title="Backhaul Agent")

@app.on_event("startup")
async def startup():
    print(f"✅ Backhaul Agent running on port {BACKHAUL_AGENT_PORT}")

@app.get("/health")
async def health():
    return {"status": "up"}

class BackhaulRequest(BaseModel):
    truck_state: dict
    current_node_id: str
    next_destination_node_id: str
    candidate_loads: List[dict]
    distances: Dict[str, float]

@app.post("/plan")
async def plan(request: BackhaulRequest):
    try:
        distance_dict = {}
        for key, val in request.distances.items():
            nodes = key.split(',')
            if len(nodes) == 2:
                distance_dict[(nodes[0], nodes[1])] = val
        
        actions = evaluate_next_actions(
            request.truck_state,
            request.current_node_id,
            request.next_destination_node_id,
            request.candidate_loads,
            distance_dict,
            DETOUR_THRESHOLD_KM
        )
        # Select best action (highest score)
        best_action = max(actions, key=lambda x: x[3])
        action_type, target_node, load_id, score = best_action
        return {
            "action": action_type,
            "target_node_id": target_node,
            "load_id": load_id,
            "score": round(score, 2)
        }
    except Exception as e:
        raise HTTPException(400, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=BACKHAUL_AGENT_PORT)