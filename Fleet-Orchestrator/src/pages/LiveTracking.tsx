import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, RefreshCw, Signal, ChevronDown } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { Truck as TruckType } from '../types';
import { cn } from '../utils/cn';

const statusDot: Record<string, string> = {
  'available': 'bg-emerald-500',
  'in-transit': 'bg-blue-500',
  'loading': 'bg-amber-500',
  'maintenance': 'bg-red-500',
  'idle': 'bg-slate-400',
};

const statusBg: Record<string, string> = {
  'available': 'bg-emerald-100 text-emerald-700',
  'in-transit': 'bg-blue-100 text-blue-700',
  'loading': 'bg-amber-100 text-amber-700',
  'maintenance': 'bg-red-100 text-red-700',
  'idle': 'bg-slate-100 text-slate-600',
};

export default function LiveTracking() {
  const { trucks } = useFleet();
  const [selectedTruck, setSelectedTruck] = useState<TruckType | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [liveTime, setLiveTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync selected truck data
  useEffect(() => {
    if (selectedTruck) {
      const updated = trucks.find(t => t.id === selectedTruck.id);
      if (updated) setSelectedTruck(updated);
    }
  }, [trucks, selectedTruck?.id]);

  const filteredTrucks = trucks.filter(t => filter === 'all' || t.status === filter);

  const getTimeSinceUpdate = (lastUpdated: string) => {
    const diff = Math.floor((Date.now() - new Date(lastUpdated).getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Live Status Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Real-time GPS tracking and status monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-emerald-700">LIVE</span>
            <span className="text-xs text-emerald-600">{liveTime.toLocaleTimeString()}</span>
          </div>
          <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            <RefreshCw size={16} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'all', label: 'All', count: trucks.length },
          { key: 'in-transit', label: 'In Transit', count: trucks.filter(t => t.status === 'in-transit').length },
          { key: 'available', label: 'Available', count: trucks.filter(t => t.status === 'available').length },
          { key: 'loading', label: 'Loading', count: trucks.filter(t => t.status === 'loading').length },
          { key: 'maintenance', label: 'Maintenance', count: trucks.filter(t => t.status === 'maintenance').length },
          { key: 'idle', label: 'Idle', count: trucks.filter(t => t.status === 'idle').length },
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === f.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
            )}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Visualization Area */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Simulated Map */}
            <div className="relative bg-gradient-to-br from-slate-100 via-blue-50 to-slate-100 h-[500px] overflow-hidden">
              {/* Grid lines for map feel */}
              <svg className="absolute inset-0 w-full h-full opacity-10">
                {Array.from({ length: 20 }).map((_, i) => (
                  <line key={`h${i}`} x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="#64748b" strokeWidth="0.5" />
                ))}
                {Array.from({ length: 20 }).map((_, i) => (
                  <line key={`v${i}`} x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="#64748b" strokeWidth="0.5" />
                ))}
              </svg>

              {/* India outline hint text */}
              <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-1.5 text-xs text-slate-500 font-medium flex items-center gap-1.5 border border-slate-200/50">
                <MapPin size={12} /> Fleet Map — India
              </div>

              {/* Truck Pins */}
              {filteredTrucks.map(truck => {
                // Map lat/lng to relative positions (approximate India)
                const x = ((truck.currentLocation.lng - 68) / (92 - 68)) * 85 + 5;
                const y = ((32 - truck.currentLocation.lat) / (32 - 8)) * 85 + 5;

                return (
                  <button
                    key={truck.id}
                    onClick={() => setSelectedTruck(truck)}
                    className={cn(
                      'absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 group z-10',
                      selectedTruck?.id === truck.id ? 'scale-150 z-20' : 'hover:scale-125'
                    )}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div className="relative">
                      <div className={cn(
                        'w-4 h-4 rounded-full border-2 border-white shadow-lg',
                        statusDot[truck.status]
                      )} />
                      {truck.status === 'in-transit' && (
                        <div className={cn('absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-40', statusDot[truck.status])} />
                      )}
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none shadow-lg transition-opacity z-30">
                        <p className="font-semibold">{truck.registrationNumber}</p>
                        <p>{truck.currentLocation.city}</p>
                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
                      </div>
                    </div>
                  </button>
                );
              })}

              {/* Route Line for selected in-transit truck */}
              {selectedTruck?.status === 'in-transit' && selectedTruck.destination && (() => {
                const x1 = ((selectedTruck.currentLocation.lng - 68) / (92 - 68)) * 85 + 5;
                const y1 = ((32 - selectedTruck.currentLocation.lat) / (32 - 8)) * 85 + 5;
                const x2 = ((selectedTruck.destination.lng - 68) / (92 - 68)) * 85 + 5;
                const y2 = ((32 - selectedTruck.destination.lat) / (32 - 8)) * 85 + 5;
                return (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                    <line
                      x1={`${x1}%`} y1={`${y1}%`}
                      x2={`${x2}%`} y2={`${y2}%`}
                      stroke="#3b82f6"
                      strokeWidth="2"
                      strokeDasharray="6 4"
                      opacity="0.6"
                    />
                    <circle cx={`${x2}%`} cy={`${y2}%`} r="6" fill="#3b82f6" opacity="0.3" />
                    <circle cx={`${x2}%`} cy={`${y2}%`} r="3" fill="#3b82f6" />
                  </svg>
                );
              })()}

              {/* Legend */}
              <div className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-slate-200/50">
                <p className="text-[10px] text-slate-400 font-medium mb-1.5">STATUS LEGEND</p>
                <div className="space-y-1">
                  {Object.entries(statusDot).map(([status, color]) => (
                    <div key={status} className="flex items-center gap-1.5 text-[10px] text-slate-600">
                      <div className={cn('w-2 h-2 rounded-full', color)} />
                      <span className="capitalize">{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Truck List / Details Panel */}
        <div className="space-y-4">
          {selectedTruck ? (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg">{selectedTruck.registrationNumber}</h3>
                  <button
                    onClick={() => setSelectedTruck(null)}
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    ✕ Close
                  </button>
                </div>
                <p className="text-sm text-slate-300">{selectedTruck.make} {selectedTruck.model}</p>
                <span className={cn('inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusBg[selectedTruck.status])}>
                  {selectedTruck.status}
                </span>
              </div>

              <div className="p-4 space-y-4">
                {/* Driver */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold text-sm">
                    {selectedTruck.driverName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{selectedTruck.driverName}</p>
                    <p className="text-xs text-slate-500">{selectedTruck.driverPhone}</p>
                  </div>
                </div>

                {/* Location Details */}
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Current Location</p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedTruck.currentLocation.city}, {selectedTruck.currentLocation.state}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {selectedTruck.currentLocation.lat.toFixed(4)}°N, {selectedTruck.currentLocation.lng.toFixed(4)}°E
                      </p>
                    </div>
                  </div>
                  {selectedTruck.destination && (
                    <div className="flex items-start gap-2">
                      <Navigation size={16} className="text-blue-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs text-slate-400">Destination</p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedTruck.destination.city}, {selectedTruck.destination.state}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <Clock size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Last Updated</p>
                      <p className="text-sm font-medium text-slate-900">{getTimeSinceUpdate(selectedTruck.lastUpdated)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Signal size={16} className="text-slate-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-slate-400">Load / Capacity</p>
                      <p className="text-sm font-medium text-slate-900">
                        {selectedTruck.currentLoadTons}T / {selectedTruck.maxCapacityTons}T
                      </p>
                      <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-1">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${(selectedTruck.currentLoadTons / selectedTruck.maxCapacityTons) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2 bg-slate-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-slate-900">{selectedTruck.mileage.toLocaleString()}</p>
                    <p className="text-[10px] text-slate-400">Total KM</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg text-center">
                    <p className="text-lg font-bold text-slate-900">{selectedTruck.fuelEfficiency}</p>
                    <p className="text-[10px] text-slate-400">KM/L Efficiency</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900 text-sm">Fleet List ({filteredTrucks.length})</h3>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {filteredTrucks.map(truck => (
                  <button
                    key={truck.id}
                    onClick={() => setSelectedTruck(truck)}
                    className="w-full text-left bg-white rounded-xl border border-slate-200 p-3 hover:border-emerald-300 hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className={cn('w-3 h-3 rounded-full', statusDot[truck.status])} />
                        {truck.status === 'in-transit' && (
                          <div className={cn('absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-40', statusDot[truck.status])} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors">
                            {truck.registrationNumber}
                          </span>
                          <span className="text-[10px] text-slate-400">{getTimeSinceUpdate(truck.lastUpdated)}</span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">
                          {truck.driverName} · {truck.currentLocation.city}
                          {truck.destination ? ` → ${truck.destination.city}` : ''}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
