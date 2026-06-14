import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import DriverDashboard from './pages/driver/DriverDashboard'
import SessionManager from './pages/driver/SessionManager'
import RouteViewer from './pages/driver/RouteViewer'
import Earnings from './pages/driver/Earnings'
import Proposals from './pages/driver/Proposals'
import ShipperDashboard from './pages/shipper/ShipperDashboard'
import LoadTracker from './pages/shipper/LoadTracker'
import RegisterLoad from './pages/shipper/RegisterLoad'
import WarehouseDashboard from './pages/warehouse/WarehouseDashboard'
import DockSchedule from './pages/warehouse/DockSchedule'
import RegisterWarehouse from './pages/warehouse/RegisterWarehouse'
import AdminDashboard from './pages/admin/AdminDashboard'
import SystemState from './pages/admin/SystemState'
import Logs from './pages/admin/Logs'
import MapEditor from './pages/admin/MapEditor'
import RegisterTruck from './pages/driver/RegisterTruck'
import Matching from './pages/admin/Matching'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />

        {/* Driver Routes */}
        <Route path="driver" element={<DriverDashboard />} />
        <Route path="driver/register" element={<RegisterTruck />} />
        <Route path="driver/session" element={<SessionManager />} />
        <Route path="driver/route" element={<RouteViewer />} />
        <Route path="driver/earnings" element={<Earnings />} />
        <Route path="driver/proposals" element={<Proposals />} />

        {/* Shipper Routes */}
        <Route path="shipper" element={<ShipperDashboard />} />
        <Route path="shipper/loads" element={<LoadTracker />} />
        <Route path="shipper/register-load" element={<RegisterLoad />} />

        {/* Warehouse Routes */}
        <Route path="warehouse" element={<WarehouseDashboard />} />
        <Route path="warehouse/schedule" element={<DockSchedule />} />
        <Route path="warehouse/register" element={<RegisterWarehouse />} />

        {/* Admin Routes */}
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="admin/system" element={<SystemState />} />
        <Route path="admin/logs" element={<Logs />} />
        <Route path="admin/map" element={<MapEditor />} />
        <Route path="admin/matching" element={<Matching />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}