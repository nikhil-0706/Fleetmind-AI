import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../../services/auth';
import {
  LayoutDashboard, Truck, Package, Warehouse, Shield,
  LogOut, Menu, X, Navigation, DollarSign, Clock,
  Settings, Server, FileText, Users, Link, TrendingUp, Activity,
  ChevronDown, ChevronRight
} from 'lucide-react';

function SidebarItem({ icon: Icon, label, to, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active ? 'bg-accent/20 text-accent' : 'text-text-light hover:bg-primary-50 hover:text-primary'
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );
}

function SidebarDropdown({ icon: Icon, label, items, isOpen, onToggle }) {
  const location = useLocation();
  const isActive = items.some(item => location.pathname === item.path);

  return (
    <div>
      <button
        onClick={onToggle}
        className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
          isActive ? 'bg-accent/20 text-accent' : 'text-text-light hover:bg-primary-50 hover:text-primary'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon size={18} />
          <span>{label}</span>
        </div>
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && (
        <div className="ml-6 mt-1 space-y-1">
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => window.location.href = item.path}
                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-accent/20 text-accent' : 'text-text-light hover:bg-primary-50 hover:text-primary'
                }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [systemStateOpen, setSystemStateOpen] = useState(true);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = {
    driver: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/driver' },
      { label: 'Register Truck', icon: Truck, path: '/driver/register-truck' },
      { label: 'Session', icon: Navigation, path: '/driver/session' },
      { label: 'Proposals', icon: Package, path: '/driver/proposals' },
      { label: 'Route Viewer', icon: Clock, path: '/driver/route' },
      { label: 'Earnings', icon: DollarSign, path: '/driver/earnings' },
    ],
    shipper: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/shipper' },
      { label: 'Register Load', icon: Package, path: '/shipper/register-load' },
      { label: 'Loads Database', icon: FileText, path: '/shipper/loads' },
      { label: 'History', icon: Clock, path: '/shipper/history' },
      { label: 'Analytics', icon: TrendingUp, path: '/shipper/analytics' },
    ],
    warehouse: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/warehouse' },
      { label: 'Warehouse Details', icon: Warehouse, path: '/warehouse/details' },
      { label: 'Dock Schedule', icon: Clock, path: '/warehouse/dock-schedule' },
      { label: 'Active Loads', icon: Package, path: '/warehouse/loads' },
      { label: 'History', icon: FileText, path: '/warehouse/history' },
    ],
    admin: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
      {
        label: 'System State',
        icon: Server,
        isDropdown: true,
        items: [
          { label: 'Trucks', icon: Truck, path: '/admin/system-state/trucks' },
          { label: 'Loads', icon: Package, path: '/admin/system-state/loads' },
          { label: 'Warehouses', icon: Warehouse, path: '/admin/system-state/warehouses' },
          { label: 'Pairs', icon: Link, path: '/admin/system-state/pairs' },
          { label: 'Truck Revenue', icon: DollarSign, path: '/admin/system-state/truck-revenue' },
          { label: 'Proposals', icon: FileText, path: '/admin/system-state/proposals' },
          { label: 'Logs & Notifications', icon: Clock, path: '/admin/system-state/logs' },
          { label: 'User Accounts', icon: Users, path: '/admin/system-state/users' },
        ]
      },
      { label: 'Agent Status', icon: Activity, path: '/admin/agent-status' },
      { label: 'Configuration', icon: Settings, path: '/admin/configuration' },
    ],
  };

  const items = navItems[user?.role] || [];

  return (
    <div className="flex h-screen bg-background">
      <div className={`${sidebarOpen ? 'w-64' : 'w-20'} transition-all duration-300 bg-white border-r border-border flex flex-col shrink-0`}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          <h1 className={`text-xl font-bold text-primary ${!sidebarOpen && 'hidden'}`}>FleetMind</h1>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-text-light hover:text-primary">
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item, index) => {
            if (item.isDropdown) {
              return (
                <SidebarDropdown
                  key={index}
                  icon={item.icon}
                  label={item.label}
                  items={item.items}
                  isOpen={systemStateOpen}
                  onToggle={() => setSystemStateOpen(!systemStateOpen)}
                />
              );
            }
            return (
              <SidebarItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                active={location.pathname === item.path}
                onClick={() => navigate(item.path)}
              />
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all">
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <Outlet />
      </div>
    </div>
  );
}