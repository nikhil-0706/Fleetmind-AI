from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List
from .scoring import evaluate_next_actions
from common.config import BACKHAUL_AGENT_PORT

app = FastAPI(title="Backhaul Agent")

class BackhaulRequest(BaseModel):
    truck_state: dict
    current_node_id: str
    next_destination_node_id: str
    candidate_loads: List[dict]
    distances: Dict[str, float]

@app.post("/plan")
def plan(request: BackhaulRequest):
    try:
        distance_dict = {}
        for key, val in request.distances.items():
            nodes = key.split(',')
            if len(nodes) == 2:
                distance_dict[(nodes[0], nodes[1])] = val
        scores = evaluate_next_actions(
            request.truck_state,
            request.current_node_id,
            request.next_destination_node_id,
            request.candidate_loads,
            distance_dict
        )
        return {"scores": scores}
    except Exception as e:
        raise HTTPException(400, str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=BACKHAUL_AGENT_PORT)