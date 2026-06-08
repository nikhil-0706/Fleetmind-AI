import {
  LayoutDashboard,
  Truck,
  Package,
  MapPin,
  Activity,
  Store,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Page } from '../types';
import { cn } from '../utils/cn';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  collapsed: boolean;
  onToggle: () => void;
}

const navItems: { page: Page; label: string; icon: React.ReactNode; description: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, description: 'Fleet Overview' },
  { page: 'registration', label: 'Registration', icon: <Truck size={20} />, description: 'Register Trucks' },
  { page: 'capacity', label: 'Capacity Match', icon: <Package size={20} />, description: 'Match Cargo' },
  { page: 'tracking', label: 'Live Tracking', icon: <MapPin size={20} />, description: 'GPS Tracking' },
  { page: 'monitoring', label: 'Fleet Monitor', icon: <Activity size={20} />, description: 'Health & Stats' },
  { page: 'marketplace', label: 'Marketplace', icon: <Store size={20} />, description: 'Empty Capacity' },
];

export default function Sidebar({ currentPage, onNavigate, collapsed, onToggle }: SidebarProps) {
  return (
    <aside className={cn(
      'fixed left-0 top-0 h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white z-40 transition-all duration-300 flex flex-col border-r border-slate-700/50',
      collapsed ? 'w-[68px]' : 'w-[250px]'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-700/50 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center shrink-0">
          <Truck size={20} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-white leading-tight">Fleet</h1>
            <h1 className="text-sm font-bold text-emerald-400 leading-tight">Orchestrator</h1>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <button
            key={item.page}
            onClick={() => onNavigate(item.page)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
              currentPage === item.page
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            )}
          >
            {currentPage === item.page && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full" />
            )}
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && (
              <div className="text-left overflow-hidden">
                <p className="text-sm font-medium leading-tight">{item.label}</p>
                <p className="text-[10px] text-slate-500 leading-tight">{item.description}</p>
              </div>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg border border-slate-700">
                {item.label}
              </div>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center h-12 border-t border-slate-700/50 text-slate-400 hover:text-white transition-colors shrink-0"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </aside>
  );
}
