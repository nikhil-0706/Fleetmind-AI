## File 63 – `fleetmind_backend/README.md` (Corrected)

```markdown
# FleetMind Backend (Coordinator + Agents)

## Setup

1. Create virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   ```

2. Generate map data (100 random nodes, edges based on proximity):
   ```bash
   python scripts/generate_map.py
   ```

3. Run all five services (each in a separate terminal):
   ```bash
   # Terminal 1 – Coordinator (port 8005)
   cd coordinator
   python -m uvicorn main:app --reload --port 8005

   # Terminal 2 – Truck Agent (port 8000)
   cd truck_agent
   python -m uvicorn main:app --reload --port 8000

   # Terminal 3 – Load Agent (port 8001)
   cd load_agent
   python -m uvicorn main:app --reload --port 8001

   # Terminal 4 – Warehouse Agent (port 8002)
   cd warehouse_agent
   python -m uvicorn main:app --reload --port 8002

   # Terminal 5 – Backhaul Agent (port 8003)
   cd backhaul_agent
   python -m uvicorn main:app --reload --port 8003
   ```

## API Documentation

Once running, visit http://localhost:8005/docs for interactive Swagger documentation (Coordinator). Each agent also has its own `/docs`.

## Environment

No `.env` required – ports are hardcoded in `common/config.py` and can be changed there.

## Database

All data is stored in‑memory (dictionaries). For production, replace with a persistent database (PostgreSQL, etc.).

## Key Features

- Backend user accounts (no localStorage)
- Reactive matching (when truck becomes idle)
- Live location via time + speed
- Proposal locking (max 5 loads)
- Fixed 5 docks per warehouse
- Earnings aggregation from deliveries
- Combined logs & notifications
- Admin configuration
```

This is the corrected version. No further modifications.