import {
  Truck, TrendingUp, Package, AlertTriangle, MapPin, Activity,
  ArrowUpRight, ArrowDownRight, Fuel, Store
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { cn } from '../utils/cn';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

const statusColors: Record<string, string> = {
  'available': 'bg-emerald-500',
  'in-transit': 'bg-blue-500',
  'loading': 'bg-amber-500',
  'maintenance': 'bg-red-500',
  'idle': 'bg-slate-400',
};

const statusLabels: Record<string, string> = {
  'available': 'Available',
  'in-transit': 'In Transit',
  'loading': 'Loading',
  'maintenance': 'Maintenance',
  'idle': 'Idle',
};

const PIE_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#94a3b8'];

export default function Dashboard() {
  const { trucks, stats, requests } = useFleet();

  const statusDistribution = ['available', 'in-transit', 'loading', 'maintenance', 'idle'].map(status => ({
    name: statusLabels[status],
    value: trucks.filter(t => t.status === status).length,
  }));

  const typeDistribution = ['flatbed', 'refrigerated', 'tanker', 'box', 'container', 'lowboy'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    count: trucks.filter(t => t.type === type).length,
  })).filter(t => t.count > 0);

  const capacityData = [
    { name: 'Used', value: Math.round(stats.usedCapacity) },
    { name: 'Available', value: Math.round(stats.emptyCapacity) },
  ];

  // Simulated weekly activity
  const weeklyActivity = [
    { day: 'Mon', trips: 12, loads: 45 },
    { day: 'Tue', trips: 19, loads: 62 },
    { day: 'Wed', trips: 15, loads: 51 },
    { day: 'Thu', trips: 22, loads: 73 },
    { day: 'Fri', trips: 18, loads: 58 },
    { day: 'Sat', trips: 14, loads: 42 },
    { day: 'Sun', trips: 8, loads: 28 },
  ];

  const statCards = [
    {
      label: 'Total Fleet',
      value: stats.totalTrucks,
      icon: <Truck size={22} />,
      color: 'from-blue-500 to-blue-600',
      trend: '+3',
      trendUp: true,
    },
    {
      label: 'In Transit',
      value: stats.inTransit,
      icon: <MapPin size={22} />,
      color: 'from-emerald-500 to-emerald-600',
      trend: `${Math.round(stats.inTransit / stats.totalTrucks * 100)}%`,
      trendUp: true,
    },
    {
      label: 'Available',
      value: stats.availableTrucks,
      icon: <Package size={22} />,
      color: 'from-cyan-500 to-cyan-600',
      trend: 'Ready',
      trendUp: true,
    },
    {
      label: 'Maintenance',
      value: stats.maintenanceTrucks,
      icon: <AlertTriangle size={22} />,
      color: 'from-amber-500 to-amber-600',
      trend: stats.maintenanceTrucks > 3 ? 'High' : 'Normal',
      trendUp: stats.maintenanceTrucks <= 3,
    },
    {
      label: 'Capacity Used',
      value: `${Math.round(stats.usedCapacity / stats.totalCapacity * 100)}%`,
      icon: <TrendingUp size={22} />,
      color: 'from-violet-500 to-violet-600',
      trend: `${Math.round(stats.emptyCapacity)}T free`,
      trendUp: true,
    },
    {
      label: 'Marketplace',
      value: stats.activeListings,
      icon: <Store size={22} />,
      color: 'from-rose-500 to-rose-600',
      trend: `${requests.filter(r => r.status === 'open').length} requests`,
      trendUp: true,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fleet Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Real-time overview of your entire fleet operations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-lg transition-shadow duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white', card.color)}>
                {card.icon}
              </div>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full flex items-center gap-0.5',
                card.trendUp ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
              )}>
                {card.trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {card.trend}
              </span>
            </div>
            <p className="text-2xl font-bold text-slate-900">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Pie */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Fleet Status</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution.filter(s => s.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {statusDistribution.filter(s => s.value > 0).map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {statusDistribution.filter(s => s.value > 0).map((s, i) => (
              <div key={s.name} className="flex items-center gap-1.5 text-xs text-slate-600">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                {s.name} ({s.value})
              </div>
            ))}
          </div>
        </div>

        {/* Truck Type Bar Chart */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Fleet by Type</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={typeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Activity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Weekly Activity</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="trips" stroke="#3b82f6" fill="#3b82f680" strokeWidth={2} />
                <Area type="monotone" dataKey="loads" stroke="#10b981" fill="#10b98140" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Trucks & Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Active Trucks */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">Active Trucks</h3>
            <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full font-medium">
              Live
              <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full ml-1.5 animate-pulse" />
            </span>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {trucks.filter(t => t.status === 'in-transit').slice(0, 6).map(truck => (
              <div key={truck.id} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className={cn('w-2.5 h-2.5 rounded-full', statusColors[truck.status])} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{truck.registrationNumber}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">{truck.type}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {truck.driverName} · {truck.currentLocation.city} → {truck.destination?.city || 'N/A'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-medium text-slate-700">{truck.currentLoadTons}T / {truck.maxCapacityTons}T</p>
                  <p className="text-[10px] text-slate-400">
                    {new Date(truck.lastUpdated).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}
            {trucks.filter(t => t.status === 'in-transit').length === 0 && (
              <p className="text-sm text-slate-400 text-center py-8">No trucks in transit</p>
            )}
          </div>
        </div>

        {/* Capacity Overview */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-4">Capacity Utilization</h3>
          <div className="flex items-center gap-8">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={capacityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4 flex-1">
              <div>
                <p className="text-sm text-slate-500">Total Capacity</p>
                <p className="text-2xl font-bold text-slate-900">{Math.round(stats.totalCapacity)}T</p>
              </div>
              <div className="flex gap-6">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded bg-blue-500" />
                    <span className="text-xs text-slate-500">Used</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{Math.round(stats.usedCapacity)}T</p>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <div className="w-3 h-3 rounded bg-slate-200" />
                    <span className="text-xs text-slate-500">Available</span>
                  </div>
                  <p className="text-lg font-semibold text-slate-900">{Math.round(stats.emptyCapacity)}T</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Fuel size={16} className="text-slate-400" />
                <span className="text-sm text-slate-600">Avg Efficiency: {stats.avgFuelEfficiency} km/L</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-slate-400" />
                <span className="text-sm text-slate-600">
                  Fleet Utilization: {Math.round(stats.usedCapacity / stats.totalCapacity * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
