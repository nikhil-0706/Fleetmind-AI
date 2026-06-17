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
import LoadsDatabase from './pages/shipper/LoadsDatabase';
import ShipperHistory from './pages/shipper/History';
import ShipperAnalytics from './pages/shipper/Analytics';
import WarehouseDashboard from './pages/warehouse/Dashboard';
import WarehouseDetails from './pages/warehouse/WarehouseDetails';
import DockSchedule from './pages/warehouse/DockSchedule';
import WarehouseLoads from './pages/warehouse/Loads';
import WarehouseHistory from './pages/warehouse/History';
import AdminDashboard from './pages/admin/Dashboard';
import Trucks from './pages/admin/SystemState/Trucks';
import Loads from './pages/admin/SystemState/Loads';
import Warehouses from './pages/admin/SystemState/Warehouses';
import Pairs from './pages/admin/SystemState/Pairs';
import TruckRevenue from './pages/admin/SystemState/TruckRevenue';
import ProposalsAdmin from './pages/admin/SystemState/Proposals';
import LogsNotifications from './pages/admin/SystemState/LogsNotifications';
import UserAccounts from './pages/admin/SystemState/UserAccounts';
import AgentStatus from './pages/admin/AgentStatus';
import Configuration from './pages/admin/Configuration';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelection />} />
      <Route path="/login/:role" element={<LoginRegister />} />

      {/* Driver */}
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

      {/* Shipper */}
      <Route element={<PrivateRoute allowedRoles={['shipper']} />}>
        <Route element={<Layout />}>
          <Route path="/shipper" element={<ShipperDashboard />} />
          <Route path="/shipper/register-load" element={<RegisterLoad />} />
          <Route path="/shipper/loads" element={<LoadsDatabase />} />
          <Route path="/shipper/history" element={<ShipperHistory />} />
          <Route path="/shipper/analytics" element={<ShipperAnalytics />} />
        </Route>
      </Route>

      {/* Warehouse */}
      <Route element={<PrivateRoute allowedRoles={['warehouse']} />}>
        <Route element={<Layout />}>
          <Route path="/warehouse" element={<WarehouseDashboard />} />
          <Route path="/warehouse/details" element={<WarehouseDetails />} />
          <Route path="/warehouse/dock-schedule" element={<DockSchedule />} />
          <Route path="/warehouse/loads" element={<WarehouseLoads />} />
          <Route path="/warehouse/history" element={<WarehouseHistory />} />
        </Route>
      </Route>

      {/* Admin */}
      <Route element={<PrivateRoute allowedRoles={['admin']} />}>
        <Route element={<Layout />}>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/system-state/trucks" element={<Trucks />} />
          <Route path="/admin/system-state/loads" element={<Loads />} />
          <Route path="/admin/system-state/warehouses" element={<Warehouses />} />
          <Route path="/admin/system-state/pairs" element={<Pairs />} />
          <Route path="/admin/system-state/truck-revenue" element={<TruckRevenue />} />
          <Route path="/admin/system-state/proposals" element={<ProposalsAdmin />} />
          <Route path="/admin/system-state/logs" element={<LogsNotifications />} />
          <Route path="/admin/system-state/users" element={<UserAccounts />} />
          <Route path="/admin/agent-status" element={<AgentStatus />} />
          <Route path="/admin/configuration" element={<Configuration />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}