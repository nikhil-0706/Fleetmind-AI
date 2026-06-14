import { useState } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Truck, Package, Warehouse, Shield,
  ChevronDown, ChevronRight, Menu, X, Activity,
  Route, DollarSign, Bell, MapPin, Settings,
  FileText, Map, Zap, LogIn, ClipboardList
} from 'lucide-react'
import LiveNotificationPanel from './LiveNotificationPanel'

const navItems = [
  {
    label: 'Overview',
    icon: LayoutDashboard,
    to: '/',
    exact: true,
  },
  {
    label: 'Driver',
    icon: Truck,
    color: 'text-blue-400',
    children: [
      { label: 'Dashboard', to: '/driver', icon: LayoutDashboard },
      { label: 'Register Truck', to: '/driver/register', icon: Truck },
      { label: 'Session', to: '/driver/session', icon: Activity },
      { label: 'Route', to: '/driver/route', icon: Route },
      { label: 'Proposals', to: '/driver/proposals', icon: Bell },
      { label: 'Earnings', to: '/driver/earnings', icon: DollarSign },
    ],
  },
  {
    label: 'Shipper',
    icon: Package,
    color: 'text-emerald-400',
    children: [
      { label: 'Dashboard', to: '/shipper', icon: LayoutDashboard },
      { label: 'Register Load', to: '/shipper/register-load', icon: Package },
      { label: 'Track Loads', to: '/shipper/loads', icon: MapPin },
    ],
  },
  {
    label: 'Warehouse',
    icon: Warehouse,
    color: 'text-amber-400',
    children: [
      { label: 'Dashboard', to: '/warehouse', icon: LayoutDashboard },
      { label: 'Register', to: '/warehouse/register', icon: Warehouse },
      { label: 'Dock Schedule', to: '/warehouse/schedule', icon: ClipboardList },
    ],
  },
  {
    label: 'Admin',
    icon: Shield,
    color: 'text-purple-400',
    children: [
      { label: 'Dashboard', to: '/admin', icon: LayoutDashboard },
      { label: 'System State', to: '/admin/system', icon: Settings },
      { label: 'Matching', to: '/admin/matching', icon: Zap },
      { label: 'Map Editor', to: '/admin/map', icon: Map },
      { label: 'Logs', to: '/admin/logs', icon: FileText },
    ],
  },
]

function NavSection({ item, collapsed }) {
  const location = useLocation()
  const [open, setOpen] = useState(() => {
    if (!item.children) return false
    return item.children.some((c) => location.pathname === c.to || location.pathname.startsWith(c.to + '/'))
  })

  if (!item.children) {
    return (
      <NavLink
        to={item.to}
        end={item.exact}
        className={({ isActive }) =>
          `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
          ${isActive
            ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
            : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
          }`
        }
      >
        <item.icon size={18} className="shrink-0" />
        {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
      </NavLink>
    )
  }

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
          text-dark-300 hover:text-dark-100 hover:bg-dark-800
          ${open ? 'text-dark-100' : ''}`}
      >
        <item.icon size={18} className={`shrink-0 ${item.color || ''}`} />
        {!collapsed && (
          <>
            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </>
        )}
      </button>

      {open && !collapsed && (
        <div className="ml-4 mt-1 space-y-0.5 border-l border-dark-700 pl-3">
          {item.children.map((child) => (
            <NavLink
              key={child.to}
              to={child.to}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm
                ${isActive
                  ? 'bg-primary-600/20 text-primary-400'
                  : 'text-dark-400 hover:text-dark-100 hover:bg-dark-800'
                }`
              }
            >
              <child.icon size={15} className="shrink-0" />
              {child.label}
            </NavLink>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Sidebar */}
      <aside
        className={`${collapsed ? 'w-16' : 'w-64'} shrink-0 bg-dark-900 border-r border-dark-700 
        flex flex-col transition-all duration-300 overflow-hidden`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-dark-700">
          <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center shrink-0">
            <Truck size={16} className="text-white" />
          </div>
          {!collapsed && (
            <div>
              <div className="text-sm font-bold text-white">LogiFlow</div>
              <div className="text-xs text-dark-400">Multi-Agent System</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavSection key={item.label} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Collapse button */}
        <div className="p-2 border-t border-dark-700">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center p-2 rounded-lg text-dark-400 
            hover:text-dark-100 hover:bg-dark-800 transition-all"
          >
            {collapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-dark-900 border-b border-dark-700 px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-sm font-semibold text-dark-100">
              Logistics Multi-Agent System
            </h1>
            <p className="text-xs text-dark-500">5-Agent Coordination Platform</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Health indicator */}
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 
              rounded-lg px-3 py-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">System Online</span>
            </div>

            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-dark-400 hover:text-dark-100 
              hover:bg-dark-800 transition-all"
            >
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>

      {/* Notification Panel */}
      {showNotifications && (
        <LiveNotificationPanel onClose={() => setShowNotifications(false)} />
      )}
    </div>
  )
}