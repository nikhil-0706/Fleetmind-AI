import json
import math
from typing import Dict, Tuple, List, Optional
from ..models.domain import Node, Edge
from .config import settings
import os

class Graph:
    def __init__(self):
        self.nodes: Dict[str, Node] = {}
        self.edges: Dict[str, Edge] = {}
        self.adj: Dict[str, List[Edge]] = {}
        self.dist_matrix: Dict[Tuple[str, str], float] = {}
        self._load_map()

    def _load_map(self):
        if not os.path.exists(settings.MAP_FILE_PATH):
            raise FileNotFoundError(f"Map file not found: {settings.MAP_FILE_PATH}. Please run scripts/generate_map.py first.")
        with open(settings.MAP_FILE_PATH, 'r') as f:
            data = json.load(f)
        self.nodes = {n['node_id']: Node(**n) for n in data['nodes']}
        self.edges = {e['edge_id']: Edge(**e) for e in data['edges']}
        self.adj = {nid: [] for nid in self.nodes}
        # ---- FIX: Add edges in both directions ----
        for e in self.edges.values():
            self.adj[e.from_node].append(e)
            self.adj[e.to_node].append(e)   # <-- add reverse direction
        self._compute_distances()

    def _compute_distances(self):
        node_ids = list(self.nodes.keys())
        idx = {nid: i for i, nid in enumerate(node_ids)}
        n = len(node_ids)
        INF = 1e9
        dist = [[INF] * n for _ in range(n)]
        for i in range(n):
            dist[i][i] = 0
        for e in self.edges.values():
            u = idx[e.from_node]
            v = idx[e.to_node]
            dist[u][v] = min(dist[u][v], e.distance_km)
            dist[v][u] = min(dist[v][u], e.distance_km)
        for k in range(n):
            for i in range(n):
                for j in range(n):
                    if dist[i][k] + dist[k][j] < dist[i][j]:
                        dist[i][j] = dist[i][k] + dist[k][j]
        for i, u in enumerate(node_ids):
            for j, v in enumerate(node_ids):
                if dist[i][j] < INF:
                    self.dist_matrix[(u, v)] = dist[i][j]

    def distance(self, from_node: str, to_node: str) -> float:
        return self.dist_matrix.get((from_node, to_node), 1e9)

    def get_node(self, node_id: str) -> Optional[Node]:
        return self.nodes.get(node_id)

    def get_edge(self, from_node: str, to_node: str) -> Optional[Edge]:
        for e in self.adj.get(from_node, []):
            if (e.from_node == from_node and e.to_node == to_node) or (e.from_node == to_node and e.to_node == from_node):
                return e
        return None

    def get_coordinates(self, node_id: str) -> Tuple[float, float]:
        node = self.nodes.get(node_id)
        if node:
            return (node.x, node.y)
        return (0, 0)

    def get_node_coords(self, node_id: str) -> Tuple[float, float]:
        node = self.nodes.get(node_id)
        return (node.x, node.y) if node else (0, 0)

    def euclidean_distance_to_node(self, x: float, y: float, node_id: str) -> float:
        node = self.nodes.get(node_id)
        if not node:
            return 1e9
        dx = x - node.x
        dy = y - node.y
        return math.hypot(dx, dy)

    def shortest_path(self, from_node: str, to_node: str) -> List[str]:
        """Return list of node IDs from start to end (inclusive) using Dijkstra."""
        if from_node == to_node:
            return [from_node]
        import heapq
        distances = {nid: float('inf') for nid in self.nodes}
        previous = {nid: None for nid in self.nodes}
        distances[from_node] = 0
        pq = [(0, from_node)]
        while pq:
            dist, current = heapq.heappop(pq)
            if dist > distances[current]:
                continue
            if current == to_node:
                break
            for edge in self.adj.get(current, []):
                # Determine neighbor based on which side we are on
                if edge.from_node == current:
                    neighbor = edge.to_node
                elif edge.to_node == current:
                    neighbor = edge.from_node
                else:
                    continue
                new_dist = dist + edge.distance_km
                if new_dist < distances[neighbor]:
                    distances[neighbor] = new_dist
                    previous[neighbor] = current
                    heapq.heappush(pq, (new_dist, neighbor))
        # Reconstruct path
        path = []
        node = to_node
        while node is not None:
            path.append(node)
            node = previous[node]
        path.reverse()
        if path[0] != from_node:
            return []  # no path
        return path

graph = Graph()