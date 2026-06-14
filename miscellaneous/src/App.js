import { Routes, Route, Navigate } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import LoginRegister from './pages/LoginRegister';
import DriverDashboard from './pages/driver/Dashboard';
import RegisterTruck from './pages/driver/RegisterTruck';
import SessionManager from './pages/driver/SessionManager';
import RouteViewer from './pages/driver/RouteViewer';
import Proposals from './pages/driver/Proposals';
import Earnings from './pages/driver/Earnings';
import ShipperDashboard from './pages/shipper/Dashboard';
import RegisterLoad from './pages/shipper/RegisterLoad';
import TrackLoads from './pages/shipper/TrackLoads';
import WarehouseDashboard from './pages/warehouse/Dashboard';
import RegisterWarehouse from './pages/warehouse/RegisterWarehouse';
import DockSchedule from './pages/warehouse/DockSchedule';
import AdminDashboard from './pages/admin/Dashboard';
import SystemState from './pages/admin/SystemState';
import Configuration from './pages/admin/Configuration';
import Agents from './pages/admin/Agents';
import Logs from './pages/admin/Logs';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/login/:role" element={<LoginRegister />} />

      <Route element={<PrivateRoute allowedRoles={['driver']} />}>
        <Route element={<Layout />}>
          <Route path="/driver" element={<DriverDashboard />} />
          <Route path="/driver/register-truck" element={<RegisterTruck />} />
          <Route path="/driver/session" element={<SessionManager />} />
          <Route path="/driver/route" element={<RouteViewer />} />
          <Route path="/driver/proposals" element={<Proposals />} />
          <Route path="/driver/earnings" element={<Earnings />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['shipper']} />}>
        <Route element={<Layout />}>
          <Route path="/shipper" element={<ShipperDashboard />} />
          <Route path="/shipper/register-load" element={<RegisterLoad />} />
          <Route path="/shipper/track-loads" element={<TrackLoads />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['warehouse']} />}>
        <Route element={<Layout />}>
          <Route path="/warehouse" element={<WarehouseDashboard />} />
          <Route path="/warehouse/register" element={<RegisterWarehouse />} />
          <Route path="/warehouse/dock-schedule" element={<DockSchedule />} />
        </Route>
      </Route>

      <Route element={<PrivateRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/system-state" element={<SystemState />} />
          <Route path="/admin/configuration" element={<Configuration />} />
          <Route path="/admin/agents" element={<Agents />} />
          <Route path="/admin/logs" element={<Logs />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}