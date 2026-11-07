# ⚡ FleetMind 10.0 – Backend Engine

High-throughput, in-memory monolithic FastAPI backend powering **FleetMind**. Provides sub-second multi-objective freight matching, en-route intermediate load consolidation, and 5-bay dock queue coordination.

---

## 🏗️ Architecture & Core Algorithms

| Component | Specification |
|-----------|---------------|
| **Framework** | FastAPI 0.115+ (Python 3.12+) |
| **Server** | Uvicorn ASGI with async background matching loops |
| **Routing Topology** | Undirected highway graph network with Dijkstra multi-hop shortest paths |
| **Scoring Heuristics** | Multi-objective utility index: Rate margin (40%), Capacity fit (30%), Detour penalty (30%), plus dynamic Market Scarcity boost |
| **Dock Management** | 5-bay concurrent reservation matrix preventing terminal bottlenecks |
| **Data Engine** | In-memory thread-safe state with instant reset capability |

---

## 🚀 Local Setup

### 1. Create Virtual Environment
```bash
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Generate Highway Graph Network
```bash
python scripts/generate_map.py
```

### 4. Run Server
```bash
python -m app.main
```
API Documentation (Interactive Swagger): `http://localhost:8005/docs`

---

## 🧪 Seeding Demo Test Data

To seed trucks, loads, warehouses, and user accounts in one step:
```bash
python test_data.py
```
Pre-registered test accounts (all passwords `1234`):
- **Driver:** `dr1`
- **Shipper:** `sh1`
- **Warehouse Managers:** `wh1`, `wh2`, `wh3`, `wh4`
- **Administrator:** `a1`

---

## 🐳 Docker Deployment

Build and run the containerized backend:
```bash
docker build -t fleetmind-backend .
docker run -p 8005:8005 fleetmind-backend
```

---

## ☁️ Cloud Deployment (Render / Railway)

The repository provides a `render.yaml` blueprint:
- **Build Command:** `pip install -r requirements.txt && python scripts/generate_map.py`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment:** Automatically reads dynamic `$PORT` injected by cloud providers.
