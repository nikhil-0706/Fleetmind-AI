## 📄 FleetMind 7.0 – README.md (Complete)

```markdown
# 🚛 FleetMind 7.0

**FleetMind** is a logistics intelligence platform that automates load matching, route planning, and delivery tracking for truck fleets. This version is a complete rewrite of the original microservice architecture into a **single monolithic backend** with a modern React frontend, designed for simplicity, speed, and ease of demonstration.

---

## ✨ Key Features

- **Role‑based dashboards** – Driver, Shipper, Warehouse Manager, Admin.
- **Automatic load matching** – Proposals generated based on capacity, distance, rate, and scarcity.
- **Intermediate pickups** – Accept multiple loads; the system will suggest the optimal order.
- **Multi‑hop routing** – Trucks can travel through intermediate nodes automatically.
- **Live map** – Custom canvas‑based map showing nodes, edges, trucks (with interpolation), warehouses, and loads.
- **No authentication tokens** – Simple role + ID stored in `localStorage`.
- **In‑memory database** – Fast development, data resets on restart.
- **Earnings tracking** – Per‑load earnings with period filters and CSV export.
- **Warehouse dock scheduling** – Fixed 5 docks with dot‑plot visualisation.
- **Admin system state** – Full visibility of trucks, loads, pairs, proposals, logs, and user accounts.

---

## 🏗️ Architecture

| Component | Technology |
|-----------|------------|
| Backend | Python 3.12+ / FastAPI (single monolithic server) |
| Frontend | React 18 / Tailwind CSS / Canvas (custom map) |
| Database | In‑memory (dictionaries) – no persistence required for demo |
| Communication | REST API (no tokens) |

All services run as one process – no separate agents. Scoring and matching are in‑process, making it **fast** and **reliable**.

---

## 📦 Project Structure

```
fleetmind-7.0/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, DB, Graph
│   │   ├── models/        # Pydantic models
│   │   ├── services/      # Business logic (scoring, matching, backhaul)
│   │   ├── api/           # FastAPI routers
│   │   ├── utils/         # Helpers, logging
│   │   └── main.py        # Entry point
│   ├── scripts/           # generate_map.py
│   ├── data/              # map_data.json (generated)
│   ├── requirements.txt
│   └── generate_test_data.py  # Script to create test data
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # UI components (map, layout, common)
│   │   ├── context/       # AppContext (global state)
│   │   ├── hooks/         # usePolling
│   │   ├── pages/         # Role‑based pages
│   │   ├── services/      # API client (no tokens)
│   │   ├── utils/         # Helpers, constants
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── tailwind.config.js
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Python 3.12+** (recommended)
- **Node.js 16+** and npm
- Git (optional)

### 1. Clone the repository

```bash
git clone <repository-url>
cd fleetmind-7.0
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
python scripts/generate_map.py    # Creates data/map_data.json
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### 4. Run the Services

**Backend (port 8005):**

```bash
cd backend
python -m app.main
```

**Frontend (port 3000):**

```bash
cd frontend
npm start
```

Open your browser at `http://localhost:3000`.

---

## 🧪 Quick Start – Test Data

We provide a script that creates all necessary test data in one go.

```bash
cd backend
python generate_test_data.py
```

This registers:

- Users: `dr1` (driver), `sh1` (shipper), `wh1`–`wh4` (warehouse managers), `a1` (admin)
- Warehouses at N2, N5, N8, N10
- 4 loads: L1 (N2→N5), L2 (N2→N8), L3 (N5→N10), L4 (N8→N2)
- Truck T1 at N1 for driver `dr1`

All passwords are `1234`.

---

## 👥 User Roles & Workflows

### Driver

1. Login as `dr1` / `1234`.
2. **Start a session** – triggers load matching.
3. View **Proposals** – accept initial and intermediate loads.
4. Use **Route Viewer** to:
   - **Depart** to pickup/drop nodes.
   - **Arrive** at nodes.
   - **Pickup** loads (button appears at pickup node).
   - **Complete** deliveries (button appears at drop node).
   - **Instant Arrive** (demo shortcut) – instantly travel to destination.
5. Check **Earnings** – view total and per‑load breakdown.

### Shipper

1. Login as `sh1` / `1234`.
2. **Register Load** – pickup and drop nodes must be warehouses.
3. View **Loads Database**, **History**, and **Analytics**.

### Warehouse Manager

1. Login as `wh1`–`wh4` / `1234`.
2. Register warehouse (if not already created).
3. Dashboard shows active loads, scheduled trucks, and a map of the warehouse.
4. **Dock Schedule** – dot‑plot with 5 docks, free docks manually.

### Admin

1. Login as `a1` / `1234`.
2. **Dashboard** – summary cards, global map, agent status.
3. **System State** – views for trucks, loads, warehouses, pairs, revenue, proposals, logs, users.
4. **Agent Status** – all agents show as "up" (monolithic).
5. **Configuration** – adjust global parameters (radius, speed, thresholds).

---

## 🗺️ Map Visualizer

- **Custom canvas** – no external libraries.
- **Zoom & pan** – scroll to zoom, drag to pan.
- **Live truck positions** – interpolated along edges when traveling.
- **Role‑based views**:
  - Driver: own truck + nearby loads + all warehouses.
  - Shipper: its loads + all warehouses.
  - Warehouse: only its own warehouse.
  - Admin: everything.

---

## 🧪 Testing

Several test scripts are available in the `backend/` folder:

- `test_load.py` – basic single‑load matching.
- `test_multi_load.py` – accepting multiple loads.
- `test_intermediate_pickup.py` – validates idle, at‑node, and en‑route intermediate pickups.
- `generate_test_data.py` – creates all test data quickly.

Run them after starting the backend:

```bash
python test_load.py
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| **ModuleNotFoundError: No module named 'fastapi'** | Activate your virtual environment and run `pip install -r requirements.txt`. |
| **Map file not found** | Run `python scripts/generate_map.py` first. |
| **Backend keeps reloading** | Use `uvicorn app.main:app --reload --reload-dir app --port 8005` instead of `python -m app.main`. |
| **No proposals appear** | Check that `NEARBY_RADIUS_KM` is large enough (default 80 km). Adjust in `backend/app/core/config.py`. |
| **"No route" error** | Ensure the graph is undirected – we fixed this in the latest version. If it persists, regenerate the map with a higher `CONNECTION_RADIUS`. |
| **"Pickup" button not showing** | The truck must be at the pickup node and the load must be `PENDING`. Also ensure `get_pending_deliveries` includes `PICKED_UP` pairs. |
| **Frontend blank page** | Check the browser console; likely a missing `React` import or a component error. We've added all necessary imports. |

---

## 📚 API Documentation

Once the backend is running, visit:

```
http://localhost:8005/docs
```

for the interactive Swagger UI.

---

## 🚢 Deployment

The current version uses in‑memory storage; for production you will need to add a persistent database (e.g., PostgreSQL). You can deploy the backend as a single FastAPI app on any cloud platform (Render, Railway, AWS). The frontend can be deployed as a static site on Vercel, Netlify, etc.

---

## 🤝 Contributing

This is a demo/proof‑of‑concept. Contributions and suggestions are welcome.

---

## 📄 License

MIT – feel free to use, modify, and distribute.

---

**FleetMind 7.0 – Built for speed, simplicity, and smart logistics.** 🚀
```