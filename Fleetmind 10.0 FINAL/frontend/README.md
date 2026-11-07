# 🚛 FleetMind 10.0 – Frontend

Modern, high-performance React 18 user interface for the **FleetMind** logistics and freight intelligence platform. Features an interactive **3D Spatial Logistics Network Canvas**, **Stitch cyber-industrial 3D tilt cards**, role-based portals, and live telemetry.

---

## ✨ Features

- **Interactive 3D Spatial Canvas** – Real-time 3D projected logistics network with rotating hubs, ambient particle field, depth attenuation, and mouse parallax.
- **"Stitch" Cyber-Industrial Aesthetic** – Corner crosshairs (`+`), monospace telemetry codes (`AGENT.DRV`, `AGENT.SHP`), and dynamic glowing gradients.
- **3D Physics Tilt Cards** – Cursor-following perspective transforms with specular radial lighting and depth pop.
- **Role-Based Portals**:
  - **Driver Portal**: Real-time load proposal reviews, intermediate pickup acceptance, route navigation with waypoint actions, and earnings tracking with CSV exports.
  - **Shipper Portal**: Rapid multi-stop freight registration, automated carrier pairing, cost-curve analytics, and real-time cargo telemetry.
  - **Warehouse Portal**: 5-bay dynamic dock queue scheduler with dot-plot bay reservations and cargo check-in.
  - **Admin Console**: Central coordinator state, fleet canvas map visualizer, system audit logs, and revenue monitoring.
- **Custom HTML5 Vector Map** – Pure canvas-rendered road network with smooth linear truck position interpolation and role-isolated filtering.
- **One-Click Demo Helper** – Quick demo accounts autofill drawer for fast local or cloud evaluation.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework with functional components and hooks |
| **Tailwind CSS 3** | Responsive cyber-industrial styling & utility classes |
| **HTML5 Canvas 2D/3D** | Custom 3D spatial logistics background & real-time highway vector map |
| **Lucide React** | High-precision vector iconography |
| **Recharts** | Earnings & freight volume charts |
| **React Router 6** | SPA routing with private role routes |
| **Axios** | Dynamic REST client with `REACT_APP_API_URL` environment support |

---

## 🚀 Setup & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy the example `.env` file:
```bash
cp .env.example .env
```
Default:
```env
REACT_APP_API_URL=http://localhost:8005
```

### 3. Run Development Server
```bash
npm start
```
Runs at `http://localhost:3000`.

---

## ☁️ Netlify Deployment

### Option A: Netlify Drop (Zero Configuration)
1. Build the production package:
   ```bash
   npm run build
   ```
2. Navigate to [app.netlify.com/drop](https://app.netlify.com/drop).
3. Drag and drop the generated `build` folder into the browser.

### Option B: Git-Connected Continuous Deployment
The repository includes `netlify.toml` and `public/_redirects`:
- **Base directory:** `Fleetmind 10.0 FINAL/frontend`
- **Build command:** `npm run build`
- **Publish directory:** `build`
- **Redirects:** `/* /index.html 200` (SPA routing fallback)
