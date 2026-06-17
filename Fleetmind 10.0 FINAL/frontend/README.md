## 📄 FleetMind 7.0 – Frontend README.md

```markdown
# FleetMind 7.0 – Frontend

React-based user interface for the FleetMind logistics platform.

---

## ✨ Features

- **Role‑based dashboards** – Driver, Shipper, Warehouse Manager, Admin.
- **Custom canvas map** – Zoom, pan, live truck interpolation, role‑based views.
- **Route Viewer** – Depart, Arrive, Pickup, Complete Delivery, Instant Arrive (demo shortcut).
- **Proposal management** – Accept/reject initial and intermediate pickups.
- **Earnings dashboard** – Charts, period filters, CSV export.
- **Dock schedule** – Dot‑plot visualisation for warehouse managers.
- **Admin system state** – Full tables for trucks, loads, warehouses, pairs, revenue, proposals, logs, users.
- **No authentication tokens** – Simple role + ID stored in `localStorage`.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| React Router 6 | Navigation |
| Tailwind CSS | Styling |
| Canvas API | Custom map renderer (no Leaflet/Google Maps) |
| Axios | HTTP client |
| Recharts | Charts |
| Lucide React | Icons |
| React Hook Form | Form handling |
| React Hot Toast | Notifications |

---

## 📁 Folder Structure

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── assets/               # Images, icons
│   ├── components/
│   │   ├── common/           # StatCard, StatusBadge, ExportButton, LoadingSpinner
│   │   ├── layout/           # Layout, PrivateRoute
│   │   └── map/              # MapVisualizer (canvas-based)
│   ├── context/              # AppContext (global state)
│   ├── hooks/                # usePolling, useApi
│   ├── pages/
│   │   ├── admin/            # Dashboard, SystemState/*, AgentStatus, Configuration
│   │   ├── driver/           # Dashboard, RegisterTruck, SessionManager, Proposals, RouteViewer, Earnings
│   │   ├── shipper/          # Dashboard, RegisterLoad, LoadsDatabase, History, Analytics
│   │   ├── warehouse/        # Dashboard, WarehouseDetails, DockSchedule, Loads, History
│   │   ├── RoleSelection.jsx
│   │   └── LoginRegister.jsx
│   ├── services/             # api.js, auth.js
│   ├── utils/                # helpers.js, constants.js
│   ├── App.js
│   ├── index.js
│   └── index.css             # Tailwind base + components
├── package.json
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js 16+**
- **npm** (comes with Node.js)

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm start
```

The app will be available at `http://localhost:3000`.

### 3. Build for production

```bash
npm run build
```

The build output will be in the `build/` folder, ready for deployment.

---

## 🔧 Configuration

### Backend URL

The frontend expects the backend to run at `http://localhost:8005`. If your backend is on a different port or host, update `BASE_URL` in `src/services/api.js`:

```javascript
const BASE_URL = 'http://your-backend-url:port';
```

### Environment Variables (Optional)

You can also use a `.env` file in the root of the frontend folder:

```env
REACT_APP_API_URL=http://localhost:8005
```

Then in `api.js`:

```javascript
const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8005';
```

---

## 🗺️ Map Visualizer

- **Pure Canvas** – No external map libraries (no Leaflet, no Google Maps).
- **Zoom & Pan** – Scroll to zoom, drag to pan.
- **Live Truck Positions** – Interpolated along edges using `progress_km`.
- **Role‑based Views**:
  - **Driver**: own truck + nearby loads + all warehouses.
  - **Shipper**: its loads + all warehouses.
  - **Warehouse**: only its own warehouse.
  - **Admin**: everything (expandable to full screen).

### Components Used

| Component | Description |
|-----------|-------------|
| `MapVisualizer` | Main canvas renderer. Accepts `nodes`, `edges`, `trucks`, `warehouses`, `loads`, `role`. |
| `MapUtils` | Coordinate normalisation, distance helpers (if needed). |

---

## 🔐 Authentication (No Tokens)

- The system uses **role + ID** stored in `localStorage`.
- No JWT, no bearer tokens – authentication is disabled on the backend for demo purposes.
- `PrivateRoute` checks for a valid user object in storage.

### Login/Register Flow

1. User selects a role on the home page.
2. They are redirected to `LoginRegister` with the role in the URL.
3. They can either **login** or **register** a new account.
4. On successful login, the user object is stored in `localStorage` and the app redirects to the corresponding dashboard.

---

## 🧩 Key Pages & Components

### Driver

| Page | Description |
|------|-------------|
| `Dashboard` | Truck status, live map, pending deliveries, stats. |
| `RegisterTruck` | Register a new truck (driver ID is auto‑filled). |
| `SessionManager` | Start/end a session (triggers matching). |
| `Proposals` | View and accept/reject initial and intermediate proposals. |
| `RouteViewer` | **Core driver tool**: Depart, Arrive, Pickup, Complete, Instant Arrive. Shows suggested next action and pending deliveries. |
| `Earnings` | Period‑based earnings, chart, per‑load breakdown, CSV export. |

### Shipper

| Page | Description |
|------|-------------|
| `Dashboard` | Live map with its loads, stats, recent loads. |
| `RegisterLoad` | Register a new load (pickup/drop nodes restricted to warehouses). |
| `LoadsDatabase` | Table of all loads with filtering and CSV export. |
| `History` | Completed loads. |
| `Analytics` | Load volume trends (bar chart). |

### Warehouse

| Page | Description |
|------|-------------|
| `Dashboard` | Warehouse details, map (only its warehouse), active loads, scheduled trucks. |
| `WarehouseDetails` | Register/update warehouse (compatible load types). |
| `DockSchedule` | Dot‑plot of dock assignments (5 docks). Free dock manually. |
| `Loads` | Active loads at this warehouse. |
| `History` | Completed visits with analytics (daily/estimated yearly). |

### Admin

| Page | Description |
|------|-------------|
| `Dashboard` | Summary cards, global map (expandable), agent status line. |
| `SystemState` | Sub‑pages for Trucks, Loads, Warehouses, Pairs, Truck Revenue, Proposals, Logs & Notifications, User Accounts. All tables with CSV export. |
| `AgentStatus` | Shows all agents as "up" (monolithic architecture). |
| `Configuration` | Update global parameters (radius, speed, rate limits, thresholds). |

---

## 🧪 Testing the Frontend

### Manual Test Flow

1. **Register all roles** – driver, shipper, warehouse, admin.
2. **Create warehouses** (as WH1 at N2, WH2 at N5, etc.).
3. **Create loads** (as shipper).
4. **Register truck** (as driver).
5. **Start session** → proposals appear.
6. **Accept proposals** → use Route Viewer.
7. **Complete deliveries** → check Earnings.

### Useful Debugging Tools

- **Browser Console** – check for errors, network requests.
- **React DevTools** – inspect component state.
- **Backend Swagger** (`http://localhost:8005/docs`) – test API calls directly.

---

## 🛠️ Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| **Blank page on load** | Check browser console for errors. Usually a missing import or a component error. We've added all necessary imports. |
| **Map not showing** | Ensure the backend is running and the map data is loaded (`GET /map`). The canvas will show "No map data available" if nodes are empty. |
| **"Pickup" button not showing** | The truck must be at the pickup node and the load status must be `PENDING`. Also ensure `get_pending_deliveries` returns `PICKED_UP` pairs (we fixed this in the backend). |
| **"Complete" button not showing** | The truck must be at the drop node and the load status must be `PICKED_UP`. |
| **Proposals not appearing** | Check that the truck is `IDLE`, loads are `PENDING`, and `NEARBY_RADIUS_KM` is sufficient. Also check backend logs for `match_for_truck` prints. |
| **Stale user data after login/logout** | We use `getCurrentUser()` directly from `localStorage` in all pages, so context staleness is avoided. |
| **CORS errors** | Ensure the backend has CORS enabled (it does). If using a different backend URL, update `BASE_URL`. |

---

## 📦 Build & Deployment

### Production Build

```bash
npm run build
```

This creates an optimised `build/` folder.

### Deployment Options

- **Vercel** – `vercel --prod`
- **Netlify** – drag `build/` folder to Netlify dashboard.
- **AWS S3 / CloudFront** – upload `build/` to S3 and enable static hosting.
- **Render** – use the "Static Site" option and point to the `build/` folder.

### Environment Variables (for Production)

Set `REACT_APP_API_URL` to the backend URL in your deployment environment.

---

## 🤝 Contributing

This is a demo/proof‑of‑concept. Feel free to fork, modify, and improve.

---

## 📄 License

MIT – use it freely.

---

**FleetMind 7.0 Frontend – Built for smart logistics.** 🚀
```