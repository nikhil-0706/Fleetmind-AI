import json
import logging
from datetime import datetime
from typing import Dict, List, Tuple, Optional
from .models import Node, Edge, LogEntry
from .config import MAP_FILE_PATH

# In-memory audit log (will be stored in coordinator, but helper functions here)
audit_log: List[LogEntry] = []

def load_map(map_file: str = MAP_FILE_PATH):
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

def log_event(event_type: str, entity_id: str, details: dict, 
              is_notification: bool = False, user_role: str = None, user_id: str = None):
    entry = LogEntry(
        timestamp=datetime.now(),
        event_type=event_type,
        entity_id=entity_id,
        details=details,
        is_notification=is_notification,
        user_role=user_role,
        user_id=user_id
    )
    audit_log.append(entry)
    logging.info(f"LOG: {entry}")

def get_logs(entity_id: str = None, event_type: str = None, is_notification: bool = None) -> List[dict]:
    result = [log.dict() for log in audit_log]
    if entity_id:
        result = [l for l in result if l['entity_id'] == entity_id]
    if event_type:
        result = [l for l in result if l['event_type'] == event_type]
    if is_notification is not None:
        result = [l for l in result if l['is_notification'] == is_notification]
    return result