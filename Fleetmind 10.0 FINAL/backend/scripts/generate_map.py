import json
import random
import math
import os

NUM_NODES = 100
GRID_SIZE = int(math.sqrt(NUM_NODES))   # 10x10
CELL_SIZE = 500 / GRID_SIZE             # 50
JITTER = 15                             # randomness within each cell
CONNECTION_RADIUS = 75                  # connect nodes within this distance

random.seed(42)
os.makedirs("data", exist_ok=True)

nodes = []
for i in range(1, NUM_NODES + 1):
    row = (i - 1) // GRID_SIZE
    col = (i - 1) % GRID_SIZE
    x = col * CELL_SIZE + random.uniform(-JITTER, JITTER)
    y = row * CELL_SIZE + random.uniform(-JITTER, JITTER)
    # Clamp to [0, 500]
    x = max(0, min(500, x))
    y = max(0, min(500, y))
    nodes.append({
        "node_id": f"N{i}",
        "x": x,
        "y": y,
        "is_warehouse": False
    })

edges = []
edge_counter = 1
for i in range(NUM_NODES):
    for j in range(i + 1, NUM_NODES):
        node_a = nodes[i]
        node_b = nodes[j]
        dx = node_a["x"] - node_b["x"]
        dy = node_a["y"] - node_b["y"]
        dist = math.hypot(dx, dy)
        if dist <= CONNECTION_RADIUS:
            distance_km = round(dist, 1)
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