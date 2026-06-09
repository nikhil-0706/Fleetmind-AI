import { useState } from 'react';
import {
  Activity, AlertTriangle, Shield, Fuel, Wrench, TrendingUp,
  CheckCircle, Calendar, ChevronDown, Search
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { cn } from '../utils/cn';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, RadialBarChart, RadialBar, Legend } from 'recharts';

const statusColors: Record<string, string> = {
  'available': 'bg-emerald-100 text-emerald-700',
  'in-transit': 'bg-blue-100 text-blue-700',
  'loading': 'bg-amber-100 text-amber-700',
  'maintenance': 'bg-red-100 text-red-700',
  'idle': 'bg-slate-100 text-slate-600',
};

export default function FleetMonitoring() {
  const { trucks, stats } = useFleet();
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'mileage' | 'efficiency' | 'service'>('service');

  // Trucks needing attention
  const maintenanceTrucks = trucks.filter(t => t.status === 'maintenance');
  const upcomingService = trucks
    .filter(t => {
      const days = Math.ceil((new Date(t.nextServiceDate).getTime() - Date.now()) / 86400000);
      return days <= 30 && days >= 0;
    })
    .sort((a, b) => new Date(a.nextServiceDate).getTime() - new Date(b.nextServiceDate).getTime());

  const expiringInsurance = trucks.filter(t => {
    const days = Math.ceil((new Date(t.insurance.expiryDate).getTime() - Date.now()) / 86400000);
    return days <= 60;
  });

  // Fuel efficiency distribution
  const efficiencyBuckets = [
    { range: '2-3', count: trucks.filter(t => t.fuelEfficiency >= 2 && t.fuelEfficiency < 3).length },
    { range: '3-4', count: trucks.filter(t => t.fuelEfficiency >= 3 && t.fuelEfficiency < 4).length },
    { range: '4-5', count: trucks.filter(t => t.fuelEfficiency >= 4 && t.fuelEfficiency < 5).length },
    { range: '5+', count: trucks.filter(t => t.fuelEfficiency >= 5).length },
  ];

  // Mileage tiers
  const mileageTiers = [
    { range: '0-100K', count: trucks.filter(t => t.mileage < 100000).length, fill: '#10b981' },
    { range: '100-200K', count: trucks.filter(t => t.mileage >= 100000 && t.mileage < 200000).length, fill: '#3b82f6' },
    { range: '200-300K', count: trucks.filter(t => t.mileage >= 200000 && t.mileage < 300000).length, fill: '#f59e0b' },
    { range: '300K+', count: trucks.filter(t => t.mileage >= 300000).length, fill: '#ef4444' },
  ];

  // Simulated monthly performance
  const monthlyPerformance = [
    { month: 'Jan', utilization: 72, efficiency: 3.8 },
    { month: 'Feb', utilization: 68, efficiency: 3.6 },
    { month: 'Mar', utilization: 75, efficiency: 3.9 },
    { month: 'Apr', utilization: 80, efficiency: 4.1 },
    { month: 'May', utilization: 78, efficiency: 4.0 },
    { month: 'Jun', utilization: 82, efficiency: 4.2 },
  ];

  // Fleet health score
  const healthScore = Math.round(
    ((stats.activeTrucks / stats.totalTrucks) * 40) +
    ((stats.inTransit / Math.max(stats.activeTrucks, 1)) * 30) +
    (Math.min(stats.avgFuelEfficiency / 5, 1) * 30)
  );

  const radialData = [
    { name: 'Health', value: healthScore, fill: healthScore > 70 ? '#10b981' : healthScore > 50 ? '#f59e0b' : '#ef4444' },
  ];

  // Sorted fleet table
  const sortedTrucks = [...trucks]
    .filter(t => t.registrationNumber.toLowerCase().includes(search.toLowerCase()) || t.driverName.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'mileage') return b.mileage - a.mileage;
      if (sortBy === 'efficiency') return a.fuelEfficiency - b.fuelEfficiency;
      return new Date(a.nextServiceDate).getTime() - new Date(b.nextServiceDate).getTime();
    });

  const getDaysUntil = (date: string) => {
    const days = Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);
    return days;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Fleet Monitoring</h1>
        <p className="text-slate-500 text-sm mt-1">Comprehensive fleet health, performance, and maintenance tracking</p>
      </div>

      {/* Alert Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity size={20} />
            <span className="text-2xl font-bold">{healthScore}%</span>
          </div>
          <p className="text-sm font-medium">Fleet Health Score</p>
          <p className="text-xs text-emerald-100 mt-0.5">Based on utilization & efficiency</p>
        </div>
        <div className={cn('rounded-xl p-4 border', maintenanceTrucks.length > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200')}>
          <div className="flex items-center justify-between mb-2">
            <Wrench size={20} className={maintenanceTrucks.length > 0 ? 'text-red-500' : 'text-emerald-500'} />
            <span className={cn('text-2xl font-bold', maintenanceTrucks.length > 0 ? 'text-red-700' : 'text-emerald-700')}>
              {maintenanceTrucks.length}
            </span>
          </div>
          <p className={cn('text-sm font-medium', maintenanceTrucks.length > 0 ? 'text-red-700' : 'text-emerald-700')}>
            In Maintenance
          </p>
          <p className="text-xs text-slate-500 mt-0.5">{maintenanceTrucks.length > 0 ? 'Needs attention' : 'All operational'}</p>
        </div>
        <div className={cn('rounded-xl p-4 border', upcomingService.length > 3 ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200')}>
          <div className="flex items-center justify-between mb-2">
            <Calendar size={20} className={upcomingService.length > 3 ? 'text-amber-500' : 'text-blue-500'} />
            <span className={cn('text-2xl font-bold', upcomingService.length > 3 ? 'text-amber-700' : 'text-blue-700')}>
              {upcomingService.length}
            </span>
          </div>
          <p className={cn('text-sm font-medium', upcomingService.length > 3 ? 'text-amber-700' : 'text-blue-700')}>
            Service Due (30d)
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Upcoming maintenance</p>
        </div>
        <div className={cn('rounded-xl p-4 border', expiringInsurance.length > 0 ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200')}>
          <div className="flex items-center justify-between mb-2">
            <Shield size={20} className={expiringInsurance.length > 0 ? 'text-amber-500' : 'text-emerald-500'} />
            <span className={cn('text-2xl font-bold', expiringInsurance.length > 0 ? 'text-amber-700' : 'text-emerald-700')}>
              {expiringInsurance.length}
            </span>
          </div>
          <p className={cn('text-sm font-medium', expiringInsurance.length > 0 ? 'text-amber-700' : 'text-emerald-700')}>
            Insurance Expiring
          </p>
          <p className="text-xs text-slate-500 mt-0.5">Within 60 days</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Gauge */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-2">Fleet Health</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={radialData} startAngle={180} endAngle={0}>
                <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#e2e8f0' }} />
                <Legend />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center -mt-8">
            <p className="text-3xl font-bold text-slate-900">{healthScore}%</p>
            <p className="text-xs text-slate-500">Overall Fleet Health</p>
          </div>
        </div>

        {/* Fuel Efficiency */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <Fuel size={16} className="text-blue-500" /> Fuel Efficiency (km/L)
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={efficiencyBuckets}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-xs text-slate-500 mt-2">Average: {stats.avgFuelEfficiency} km/L</p>
        </div>

        {/* Monthly Performance Trend */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
            <TrendingUp size={16} className="text-emerald-500" /> Performance Trend
          </h3>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="utilization" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} name="Utilization %" />
                <Line type="monotone" dataKey="efficiency" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Efficiency" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Mileage distribution */}
      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <h3 className="font-semibold text-slate-900 mb-4">Mileage Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          {mileageTiers.map(tier => (
            <div key={tier.range} className="text-center">
              <div className="relative h-24 flex items-end justify-center mb-2">
                <div
                  className="w-16 rounded-t-lg transition-all"
                  style={{
                    height: `${Math.max((tier.count / trucks.length) * 100, 8)}%`,
                    backgroundColor: tier.fill,
                    opacity: 0.8,
                  }}
                />
              </div>
              <p className="text-sm font-bold text-slate-900">{tier.count}</p>
              <p className="text-xs text-slate-500">{tier.range} km</p>
            </div>
          ))}
        </div>
      </div>

      {/* Fleet Health Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-semibold text-slate-900">Fleet Health Details</h3>
          <div className="flex gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <div className="relative">
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as 'mileage' | 'efficiency' | 'service')}
                className="appearance-none pl-3 pr-7 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
              >
                <option value="service">By Service Date</option>
                <option value="mileage">By Mileage</option>
                <option value="efficiency">By Efficiency</option>
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Truck</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Status</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Mileage</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Efficiency</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Next Service</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Insurance</th>
                <th className="text-left px-4 py-2.5 font-semibold text-slate-600 text-xs">Health</th>
              </tr>
            </thead>
            <tbody>
              {sortedTrucks.slice(0, 15).map(truck => {
                const serviceDays = getDaysUntil(truck.nextServiceDate);
                const insuranceDays = getDaysUntil(truck.insurance.expiryDate);
                const truckHealth = truck.status === 'maintenance' ? 'poor' :
                  serviceDays < 7 ? 'warning' :
                    truck.fuelEfficiency < 3 ? 'warning' : 'good';

                return (
                  <tr key={truck.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                    <td className="px-4 py-2.5">
                      <p className="font-semibold text-slate-900 text-xs">{truck.registrationNumber}</p>
                      <p className="text-[10px] text-slate-400">{truck.make} {truck.model}</p>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-medium capitalize', statusColors[truck.status])}>
                        {truck.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-slate-700 font-mono">{truck.mileage.toLocaleString()} km</td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs font-medium', truck.fuelEfficiency < 3 ? 'text-red-600' : truck.fuelEfficiency < 4 ? 'text-amber-600' : 'text-emerald-600')}>
                        {truck.fuelEfficiency} km/L
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs', serviceDays < 7 ? 'text-red-600 font-semibold' : serviceDays < 30 ? 'text-amber-600' : 'text-slate-600')}>
                        {serviceDays < 0 ? 'Overdue!' : `${serviceDays}d`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={cn('text-xs', insuranceDays < 30 ? 'text-red-600 font-semibold' : insuranceDays < 60 ? 'text-amber-600' : 'text-slate-600')}>
                        {insuranceDays < 0 ? 'Expired!' : `${insuranceDays}d`}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      {truckHealth === 'good' && <CheckCircle size={16} className="text-emerald-500" />}
                      {truckHealth === 'warning' && <AlertTriangle size={16} className="text-amber-500" />}
                      {truckHealth === 'poor' && <AlertTriangle size={16} className="text-red-500" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
