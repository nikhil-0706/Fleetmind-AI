import { useState } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Truck, Package, Warehouse, Shield,
  ChevronDown, ChevronRight, Menu, X, Bell, Activity,
  Route, DollarSign, FileText, Settings, LogOut, 
  MapPin, Clock, Zap, TrendingUp, Users, List,
  Boxes, Grid, Calendar
} from 'lucide-react'
import { getUserRole, logout } from '../services/auth'

const navItems = {
  driver: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/driver' },
    { label: 'Register Truck', icon: Truck, to: '/driver/register-truck' },
    { label: 'Session', icon: Activity, to: '/driver/session' },
    { label: 'Route', icon: Route, to: '/driver/route' },
    { label: 'Proposals', icon: Zap, to: '/driver/proposals' },
    { label: 'Earnings', icon: DollarSign, to: '/driver/earnings' },
  ],
  shipper: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/shipper' },
    { label: 'Register Load', icon: Package, to: '/shipper/register-load' },
    { label: 'Track Loads', icon: MapPin, to: '/shipper/track-loads' },
  ],
  warehouse: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/warehouse' },
    { label: 'Register Warehouse', icon: Warehouse, to: '/warehouse/register' },
    { label: 'Dock Schedule', icon: Calendar, to: '/warehouse/dock-schedule' },
  ],
  admin: [
    { label: 'Dashboard', icon: LayoutDashboard, to: '/admin' },
    { label: 'System State', icon: Grid, to: '/admin/system-state' },
    { label: 'Configuration', icon: Settings, to: '/admin/configuration' },
    { label: 'Agents', icon: Users, to: '/admin/agents' },
    { label: 'Logs', icon: FileText, to: '/admin/logs' },
  ],
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const role = getUserRole()
  const menu = navItems[role] || []

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 bg-primary text-white flex flex-col transition-all duration-300`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-primary-700">
          {!collapsed && (
            <div className="font-bold text-xl tracking-tight">FleetMind</div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-lg hover:bg-primary-700">
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {menu.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200
                ${isActive
                  ? 'bg-accent text-primary-900'
                  : 'text-primary-100 hover:bg-primary-800'
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-primary-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-primary-100 hover:bg-primary-800 transition-all"
          >
            <LogOut size={18} />
            {!collapsed && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-surface border-b border-border px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-primary">FleetMind</h1>
            <p className="text-xs text-text-light">Logistics Intelligence Platform</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-700 font-medium">System Online</span>
            </div>
            <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
              <Bell size={18} className="text-text-light" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}