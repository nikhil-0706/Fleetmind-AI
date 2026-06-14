# Agent ports
TRUCK_AGENT_PORT = 8000
LOAD_AGENT_PORT = 8001
WAREHOUSE_AGENT_PORT = 8002
BACKHAUL_AGENT_PORT = 8003
COORDINATOR_PORT = 8005

# Rate caps (can be overridden by admin)
MIN_RATE = 0
MAX_RATE = 200  # ₹ per km

# Map file path (relative to project root)
DEMO_MAP_FILE = "coordinator/demo_map.json"

# Intermediate pickup thresholds
DETOUR_THRESHOLD_KM = 20
NEARBY_RADIUS_KM = 50

# Default truck speed (km/h)
TRUCK_SPEED_KMPH = 50

# WebSocket heartbeat interval (seconds)
WS_HEARTBEAT = 30