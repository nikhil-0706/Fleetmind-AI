from common.utils import load_map, compute_distance_matrix
from common.config import DEMO_MAP_FILE

class Graph:
    def __init__(self):
        self.nodes, self.edges, self.adj = load_map(DEMO_MAP_FILE)
        self.dist_matrix = compute_distance_matrix(self.nodes, self.edges)

    def distance(self, from_node: str, to_node: str) -> float:
        return self.dist_matrix.get((from_node, to_node), 1e9)

# Singleton
graph = Graph()