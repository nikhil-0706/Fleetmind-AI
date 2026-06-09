import { useState } from 'react';
import { Package, Search, CheckCircle, Clock, XCircle, Truck, ArrowRight, Zap, Plus, X } from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { CapacityRequest, TruckType } from '../types';
import { cn } from '../utils/cn';

const truckTypes: (TruckType | 'any')[] = ['any', 'flatbed', 'refrigerated', 'tanker', 'box', 'container', 'lowboy'];
const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune', 'Ahmedabad', 'Kolkata', 'Jaipur', 'Lucknow', 'Nagpur', 'Indore'];
const cityStates: Record<string, string> = {
  Mumbai: 'Maharashtra', Delhi: 'Delhi', Bangalore: 'Karnataka', Chennai: 'Tamil Nadu',
  Hyderabad: 'Telangana', Pune: 'Maharashtra', Ahmedabad: 'Gujarat', Kolkata: 'West Bengal',
  Jaipur: 'Rajasthan', Lucknow: 'Uttar Pradesh', Nagpur: 'Maharashtra', Indore: 'Madhya Pradesh',
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <Clock size={14} />,
  matched: <CheckCircle size={14} />,
  closed: <XCircle size={14} />,
};

const statusColors: Record<string, string> = {
  open: 'bg-amber-100 text-amber-700',
  matched: 'bg-emerald-100 text-emerald-700',
  closed: 'bg-slate-100 text-slate-600',
};

export default function CapacityMatching() {
  const { requests, trucks, addRequest, matchRequest, getMatchingTrucks } = useFleet();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [matchingFor, setMatchingFor] = useState<CapacityRequest | null>(null);
  const [form, setForm] = useState({
    requiredCapacityTons: 10,
    cargoType: '',
    pickupCity: 'Mumbai',
    deliveryCity: 'Delhi',
    requiredTruckType: 'any' as TruckType | 'any',
    requiredDate: '',
    budget: 25000,
    contactName: '',
    contactPhone: '',
  });

  const filtered = requests.filter(r => {
    const matchesSearch = r.cargoType.toLowerCase().includes(search.toLowerCase()) ||
      r.pickupCity.toLowerCase().includes(search.toLowerCase()) ||
      r.deliveryCity.toLowerCase().includes(search.toLowerCase()) ||
      r.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    const newReq: CapacityRequest = {
      id: `REQ-${String(requests.length + 1).padStart(4, '0')}`,
      requiredCapacityTons: form.requiredCapacityTons,
      cargoType: form.cargoType,
      pickupCity: form.pickupCity,
      pickupState: cityStates[form.pickupCity] || '',
      deliveryCity: form.deliveryCity,
      deliveryState: cityStates[form.deliveryCity] || '',
      requiredTruckType: form.requiredTruckType,
      requiredDate: form.requiredDate,
      budget: form.budget,
      status: 'open',
      createdAt: new Date().toISOString(),
      contactName: form.contactName,
      contactPhone: form.contactPhone,
    };
    addRequest(newReq);
    setShowNewRequest(false);
    setForm({
      requiredCapacityTons: 10, cargoType: '', pickupCity: 'Mumbai', deliveryCity: 'Delhi',
      requiredTruckType: 'any', requiredDate: '', budget: 25000, contactName: '', contactPhone: '',
    });
  };

  const matchingTrucks = matchingFor ? getMatchingTrucks(matchingFor) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Capacity Matching</h1>
          <p className="text-slate-500 text-sm mt-1">AI-powered matching of cargo demands with available fleet capacity</p>
        </div>
        <button
          onClick={() => setShowNewRequest(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all shadow-md shadow-blue-200 font-medium text-sm"
        >
          <Plus size={18} /> New Request
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Open Requests', value: requests.filter(r => r.status === 'open').length, color: 'text-amber-600 bg-amber-50 border-amber-200', icon: <Clock size={20} /> },
          { label: 'Matched', value: requests.filter(r => r.status === 'matched').length, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: <CheckCircle size={20} /> },
          { label: 'Available Trucks', value: trucks.filter(t => t.status === 'available' || t.status === 'idle').length, color: 'text-blue-600 bg-blue-50 border-blue-200', icon: <Truck size={20} /> },
        ].map((card, i) => (
          <div key={i} className={cn('rounded-xl border p-4 flex items-center gap-3', card.color)}>
            {card.icon}
            <div>
              <p className="text-2xl font-bold">{card.value}</p>
              <p className="text-xs">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search requests..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {['all', 'open', 'matched', 'closed'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                statusFilter === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-3">
        {filtered.map(req => (
          <div key={req.id} className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-mono text-slate-400">{req.id}</span>
                  <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 capitalize', statusColors[req.status])}>
                    {statusIcons[req.status]} {req.status}
                  </span>
                  <span className="px-2 py-0.5 bg-violet-100 text-violet-700 rounded text-xs font-medium">
                    {req.cargoType}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 mb-1">
                  <span>{req.pickupCity}</span>
                  <ArrowRight size={14} className="text-slate-400" />
                  <span>{req.deliveryCity}</span>
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                  <span>📦 {req.requiredCapacityTons}T required</span>
                  <span>🚛 {req.requiredTruckType === 'any' ? 'Any type' : req.requiredTruckType}</span>
                  <span>📅 {req.requiredDate}</span>
                  <span>💰 ₹{req.budget.toLocaleString()}</span>
                  <span>👤 {req.contactName}</span>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {req.status === 'open' && (
                  <button
                    onClick={() => setMatchingFor(req)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-xs font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-sm"
                  >
                    <Zap size={14} /> Find Match
                  </button>
                )}
                {req.status === 'matched' && req.matchedTruckId && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-2 rounded-lg font-medium">
                    ✅ Matched: {req.matchedTruckId}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400">
            <Package size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No requests found</p>
          </div>
        )}
      </div>

      {/* Matching Modal */}
      {matchingFor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setMatchingFor(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Matching Trucks for {matchingFor.id}</h2>
                <p className="text-sm text-slate-500">
                  {matchingFor.pickupCity} → {matchingFor.deliveryCity} · {matchingFor.requiredCapacityTons}T · {matchingFor.cargoType}
                </p>
              </div>
              <button onClick={() => setMatchingFor(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              {matchingTrucks.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-600 font-medium">🎯 Found {matchingTrucks.length} matching truck(s)</p>
                  {matchingTrucks.map(truck => (
                    <div key={truck.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-all">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-900">{truck.registrationNumber}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs capitalize">{truck.type}</span>
                        </div>
                        <div className="text-xs text-slate-500 space-x-3">
                          <span>{truck.driverName}</span>
                          <span>📍 {truck.currentLocation.city}</span>
                          <span>📦 {truck.maxCapacityTons - truck.currentLoadTons}T available</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          matchRequest(matchingFor.id, truck.id);
                          setMatchingFor(null);
                        }}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  <Truck size={40} className="mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No matching trucks available</p>
                  <p className="text-xs mt-1">Try modifying the requirements or check back later</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* New Request Modal */}
      {showNewRequest && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowNewRequest(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">New Capacity Request</h2>
              <button onClick={() => setShowNewRequest(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleNewRequest} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cargo Type *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Electronics"
                    value={form.cargoType}
                    onChange={e => setForm({ ...form, cargoType: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required Capacity (T)</label>
                  <input
                    type="number"
                    min={1}
                    value={form.requiredCapacityTons}
                    onChange={e => setForm({ ...form, requiredCapacityTons: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pickup City</label>
                  <select
                    value={form.pickupCity}
                    onChange={e => setForm({ ...form, pickupCity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Delivery City</label>
                  <select
                    value={form.deliveryCity}
                    onChange={e => setForm({ ...form, deliveryCity: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Truck Type</label>
                  <select
                    value={form.requiredTruckType}
                    onChange={e => setForm({ ...form, requiredTruckType: e.target.value as TruckType | 'any' })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {truckTypes.map(t => <option key={t} value={t}>{t === 'any' ? 'Any Type' : t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Required Date</label>
                  <input
                    type="date"
                    value={form.requiredDate}
                    onChange={e => setForm({ ...form, requiredDate: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Budget (₹)</label>
                  <input
                    type="number"
                    min={1000}
                    value={form.budget}
                    onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name *</label>
                  <input
                    type="text"
                    required
                    value={form.contactName}
                    onChange={e => setForm({ ...form, contactName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Phone *</label>
                <input
                  type="text"
                  required
                  placeholder="+91 XXXXXXXXXX"
                  value={form.contactPhone}
                  onChange={e => setForm({ ...form, contactPhone: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowNewRequest(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 shadow-md shadow-blue-200">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
