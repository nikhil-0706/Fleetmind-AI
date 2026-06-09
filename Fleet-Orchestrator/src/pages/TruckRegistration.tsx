import { useState } from 'react';
import {
  Truck, Plus, Search, X, Edit3, Trash2, Eye, ChevronDown
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { Truck as TruckType, TruckType as TType, FuelType, TruckStatus } from '../types';
import { cn } from '../utils/cn';

const truckTypes: TType[] = ['flatbed', 'refrigerated', 'tanker', 'box', 'container', 'lowboy'];
const fuelTypes: FuelType[] = ['diesel', 'electric', 'hybrid', 'cng'];

const cities = [
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { city: 'Delhi', state: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Bangalore', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462 },
];

const statusColors: Record<string, string> = {
  'available': 'bg-emerald-100 text-emerald-700',
  'in-transit': 'bg-blue-100 text-blue-700',
  'loading': 'bg-amber-100 text-amber-700',
  'maintenance': 'bg-red-100 text-red-700',
  'idle': 'bg-slate-100 text-slate-700',
};

const emptyForm = {
  registrationNumber: '',
  driverName: '',
  driverPhone: '',
  type: 'flatbed' as TType,
  fuelType: 'diesel' as FuelType,
  maxCapacityTons: 20,
  make: '',
  model: '',
  year: 2024,
  city: 'Mumbai',
  insuranceProvider: '',
  insurancePolicy: '',
  insuranceExpiry: '',
};

export default function TruckRegistration() {
  const { trucks, addTruck, removeTruck, updateTruckStatus } = useFleet();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [form, setForm] = useState(emptyForm);
  const [viewTruck, setViewTruck] = useState<TruckType | null>(null);

  const filteredTrucks = trucks.filter(t => {
    const matchesSearch = t.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
      t.driverName.toLowerCase().includes(search.toLowerCase()) ||
      t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchesType = filterType === 'all' || t.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cityData = cities.find(c => c.city === form.city) || cities[0];
    const newTruck: TruckType = {
      id: `TRK-${String(trucks.length + 1).padStart(4, '0')}`,
      registrationNumber: form.registrationNumber,
      driverName: form.driverName,
      driverPhone: form.driverPhone,
      type: form.type,
      fuelType: form.fuelType,
      maxCapacityTons: form.maxCapacityTons,
      currentLoadTons: 0,
      status: 'available',
      currentLocation: {
        lat: cityData.lat,
        lng: cityData.lng,
        city: cityData.city,
        state: cityData.state,
      },
      lastUpdated: new Date().toISOString(),
      mileage: 0,
      year: form.year,
      make: form.make,
      model: form.model,
      registeredDate: new Date().toISOString().split('T')[0],
      fuelEfficiency: 3.5,
      nextServiceDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      insurance: {
        provider: form.insuranceProvider,
        expiryDate: form.insuranceExpiry,
        policyNumber: form.insurancePolicy,
      },
    };
    addTruck(newTruck);
    setForm(emptyForm);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Truck Registration</h1>
          <p className="text-slate-500 text-sm mt-1">Register, manage, and track all trucks in your fleet</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setViewTruck(null); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-200 font-medium text-sm"
        >
          <Plus size={18} /> Register New Truck
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ID, registration, or driver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="in-transit">In Transit</option>
            <option value="loading">Loading</option>
            <option value="maintenance">Maintenance</option>
            <option value="idle">Idle</option>
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterType}
            onChange={e => setFilterType(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
          >
            <option value="all">All Types</option>
            {truckTypes.map(t => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Count */}
      <p className="text-sm text-slate-500">Showing {filteredTrucks.length} of {trucks.length} trucks</p>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">ID</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Registration</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Driver</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Type</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Capacity</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Location</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrucks.map(truck => (
                <tr key={truck.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{truck.id}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{truck.registrationNumber}</td>
                  <td className="px-4 py-3 text-slate-700">{truck.driverName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-medium capitalize">
                      {truck.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {truck.currentLoadTons}T / {truck.maxCapacityTons}T
                  </td>
                  <td className="px-4 py-3 text-slate-700">{truck.currentLocation.city}</td>
                  <td className="px-4 py-3">
                    <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium capitalize', statusColors[truck.status])}>
                      {truck.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setViewTruck(truck); setShowForm(false); }}
                        className="p-1.5 rounded-md hover:bg-blue-50 text-blue-500 transition-colors"
                        title="View"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => {
                          const newStatus: TruckStatus = truck.status === 'available' ? 'maintenance' : 'available';
                          updateTruckStatus(truck.id, newStatus);
                        }}
                        className="p-1.5 rounded-md hover:bg-amber-50 text-amber-500 transition-colors"
                        title="Toggle Status"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => removeTruck(truck.id)}
                        className="p-1.5 rounded-md hover:bg-red-50 text-red-500 transition-colors"
                        title="Remove"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredTrucks.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Truck size={40} className="mx-auto mb-3 opacity-50" />
            <p className="font-medium">No trucks found</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Registration Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Register New Truck</h2>
                <p className="text-sm text-slate-500">Fill in all the details to add a truck to your fleet</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., MH12AB1234"
                    value={form.registrationNumber}
                    onChange={e => setForm({ ...form, registrationNumber: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Full name"
                    value={form.driverName}
                    onChange={e => setForm({ ...form, driverName: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Driver Phone *</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 XXXXXXXXXX"
                    value={form.driverPhone}
                    onChange={e => setForm({ ...form, driverPhone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Truck Type</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value as TType })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {truckTypes.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Fuel Type</label>
                  <select
                    value={form.fuelType}
                    onChange={e => setForm({ ...form, fuelType: e.target.value as FuelType })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {fuelTypes.map(f => (
                      <option key={f} value={f}>{f.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Max Capacity (Tons)</label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={form.maxCapacityTons}
                    onChange={e => setForm({ ...form, maxCapacityTons: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Make *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Tata"
                    value={form.make}
                    onChange={e => setForm({ ...form, make: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Prima"
                    value={form.model}
                    onChange={e => setForm({ ...form, model: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                  <input
                    type="number"
                    min={2010}
                    max={2026}
                    value={form.year}
                    onChange={e => setForm({ ...form, year: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Current City</label>
                  <select
                    value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    {cities.map(c => (
                      <option key={c.city} value={c.city}>{c.city}, {c.state}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Insurance Section */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">Insurance Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    placeholder="Insurance Provider"
                    value={form.insuranceProvider}
                    onChange={e => setForm({ ...form, insuranceProvider: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Policy Number"
                    value={form.insurancePolicy}
                    onChange={e => setForm({ ...form, insurancePolicy: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <input
                    type="date"
                    value={form.insuranceExpiry}
                    onChange={e => setForm({ ...form, insuranceExpiry: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-200"
                >
                  Register Truck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Truck Detail Modal */}
      {viewTruck && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewTruck(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">{viewTruck.registrationNumber}</h2>
                <p className="text-sm text-slate-500">{viewTruck.make} {viewTruck.model} · {viewTruck.year}</p>
              </div>
              <button onClick={() => setViewTruck(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Truck ID', value: viewTruck.id },
                  { label: 'Status', value: viewTruck.status },
                  { label: 'Type', value: viewTruck.type },
                  { label: 'Fuel', value: viewTruck.fuelType },
                  { label: 'Capacity', value: `${viewTruck.maxCapacityTons}T` },
                  { label: 'Current Load', value: `${viewTruck.currentLoadTons}T` },
                  { label: 'Driver', value: viewTruck.driverName },
                  { label: 'Phone', value: viewTruck.driverPhone },
                  { label: 'Location', value: `${viewTruck.currentLocation.city}, ${viewTruck.currentLocation.state}` },
                  { label: 'Mileage', value: `${viewTruck.mileage.toLocaleString()} km` },
                  { label: 'Efficiency', value: `${viewTruck.fuelEfficiency} km/L` },
                  { label: 'Next Service', value: viewTruck.nextServiceDate },
                  { label: 'Insurance', value: viewTruck.insurance.provider },
                  { label: 'Policy', value: viewTruck.insurance.policyNumber },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-xs text-slate-400">{item.label}</p>
                    <p className="text-sm font-medium text-slate-900 capitalize">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
