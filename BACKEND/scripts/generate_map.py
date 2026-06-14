import json
import random
import math

NUM_NODES = 100
MIN_DISTANCE = 10
MAX_DISTANCE = 200
CONNECTION_RADIUS = 120  # connect nodes within this distance

random.seed(42)  # for reproducibility

nodes = []
for i in range(1, NUM_NODES + 1):
    x = random.uniform(0, 500)
    y = random.uniform(0, 500)
    nodes.append({"node_id": f"N{i}", "x": x, "y": y, "is_warehouse": False})

edges = []
edge_counter = 1
for i, node_a in enumerate(nodes):
    for j, node_b in enumerate(nodes[i+1:], start=i+1):
        dx = node_a["x"] - node_b["x"]
        dy = node_a["y"] - node_b["y"]
        dist = math.hypot(dx, dy)
        if dist <= CONNECTION_RADIUS:
            distance_km = round(dist, 1)  # treat coordinate units as km
            edges.append({
                "edge_id": f"E{edge_counter}",
                "from_node": node_a["node_id"],
                "to_node": node_b["node_id"],
                "distance_km": distance_km,
                "speed_kmph": 50
            })
            edge_counter += 1

map_data = {"nodes": nodes, "edges": edges}
with open("data/map_data.json", "w") as f:
    json.dump(map_data, f, indent=2)

print(f"Generated {len(nodes)} nodes and {len(edges)} edges.")