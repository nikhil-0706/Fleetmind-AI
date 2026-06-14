import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from .models import Node, Edge
from .config import DEMO_MAP_FILE

# ---------- Graph utilities ----------
def load_map(map_file: str = DEMO_MAP_FILE):
    with open(map_file, 'r') as f:
        data = json.load(f)
    nodes = {n['node_id']: Node(**n) for n in data['nodes']}
    edges = {e['edge_id']: Edge(**e) for e in data['edges']}
    adj = {nid: [] for nid in nodes}
    for e in edges.values():
        adj[e.from_node].append(e)
    return nodes, edges, adj

def compute_distance_matrix(nodes: Dict[str, Node], edges: Dict[str, Edge]) -> Dict[Tuple[str, str], float]:
    node_ids = list(nodes.keys())
    idx = {nid: i for i, nid in enumerate(node_ids)}
    n = len(node_ids)
    INF = 1e9
    dist = [[INF]*n for _ in range(n)]
    for i in range(n):
        dist[i][i] = 0
    for e in edges.values():
        u = idx[e.from_node]
        v = idx[e.to_node]
        dist[u][v] = min(dist[u][v], e.distance_km)
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    result = {}
    for i, u in enumerate(node_ids):
        for j, v in enumerate(node_ids):
            if dist[i][j] < INF:
                result[(u, v)] = dist[i][j]
    return result

# ---------- Audit logging ----------
audit_log = []

def log_event(event_type: str, entity_id: str, details: dict):
    entry = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "entity_id": entity_id,
        "details": details
    }
    audit_log.append(entry)
    logging.info(f"AUDIT: {entry}")

def get_logs(from_time: Optional[str] = None, to_time: Optional[str] = None, entity: Optional[str] = None) -> List[dict]:
    # Simple filtering (can be extended)
    logs = audit_log
    if entity:
        logs = [l for l in logs if l['entity_id'] == entity]
    # time filtering omitted for brevity
    return logs