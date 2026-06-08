import { useState } from 'react';
import { FleetProvider } from './context/FleetContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import TruckRegistration from './pages/TruckRegistration';
import CapacityMatching from './pages/CapacityMatching';
import LiveTracking from './pages/LiveTracking';
import FleetMonitoring from './pages/FleetMonitoring';
import Marketplace from './pages/Marketplace';
import { Page } from './types';
import { cn } from './utils/cn';
import { Bell, User, Search } from 'lucide-react';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard />;
      case 'registration': return <TruckRegistration />;
      case 'capacity': return <CapacityMatching />;
      case 'tracking': return <LiveTracking />;
      case 'monitoring': return <FleetMonitoring />;
      case 'marketplace': return <Marketplace />;
      default: return <Dashboard />;
    }
  };

  const pageTitle: Record<Page, string> = {
    dashboard: 'Dashboard',
    registration: 'Truck Registration',
    capacity: 'Capacity Matching',
    tracking: 'Live Tracking',
    monitoring: 'Fleet Monitoring',
    marketplace: 'Marketplace',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content */}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'ml-[68px]' : 'ml-[250px]')}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
          <div className="flex items-center justify-between px-6 h-16">
            <div className="flex items-center gap-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{pageTitle[currentPage]}</h2>
                <p className="text-[10px] text-slate-400">Fleet Orchestrator · Agent Dashboard</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Quick search..."
                  className="pl-9 pr-4 py-2 w-56 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Notifications */}
              <button className="relative p-2 hover:bg-slate-50 rounded-lg transition-colors">
                <Bell size={18} className="text-slate-500" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Profile */}
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-cyan-500 rounded-full flex items-center justify-center">
                  <User size={14} className="text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-slate-900">Fleet Admin</p>
                  <p className="text-[10px] text-slate-400">admin@fleet.io</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <FleetProvider>
      <AppContent />
    </FleetProvider>
  );
}
