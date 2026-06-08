import { useState } from 'react';
import {
  Store, Plus, Search, MapPin, Calendar, Truck, X,
  TrendingUp, Package, Phone, MessageSquare, Star, Filter
} from 'lucide-react';
import { useFleet } from '../context/FleetContext';
import { MarketplaceListing } from '../types';
import { cn } from '../utils/cn';

const truckTypeIcons: Record<string, string> = {
  flatbed: '🚛',
  refrigerated: '🧊',
  tanker: '🛢️',
  box: '📦',
  container: '🏗️',
  lowboy: '⬇️',
};

export default function Marketplace() {
  const { listings, trucks, addListing, removeListing } = useFleet();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showCreateListing, setShowCreateListing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [form, setForm] = useState({
    truckId: '',
    pricePerTonPerKm: 2.5,
    availableUntil: '',
    notes: '',
    destinations: '',
  });

  const filtered = listings.filter(l => {
    if (!l.isActive) return false;
    const matchesSearch = l.currentCity.toLowerCase().includes(search.toLowerCase()) ||
      l.truckRegistration.toLowerCase().includes(search.toLowerCase()) ||
      l.driverName.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === 'all' || l.truckType === typeFilter;
    return matchesSearch && matchesType;
  });

  const availableTrucks = trucks.filter(t =>
    (t.status === 'available' || t.status === 'idle') &&
    !listings.some(l => l.truckId === t.id && l.isActive)
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const truck = trucks.find(t => t.id === form.truckId);
    if (!truck) return;

    const newListing: MarketplaceListing = {
      id: `LST-${String(listings.length + 1).padStart(4, '0')}`,
      truckId: truck.id,
      truckRegistration: truck.registrationNumber,
      driverName: truck.driverName,
      truckType: truck.type,
      availableCapacityTons: truck.maxCapacityTons - truck.currentLoadTons,
      currentCity: truck.currentLocation.city,
      currentState: truck.currentLocation.state,
      preferredDestinations: form.destinations.split(',').map(d => d.trim()).filter(Boolean),
      pricePerTonPerKm: form.pricePerTonPerKm,
      availableFrom: new Date().toISOString().split('T')[0],
      availableUntil: form.availableUntil,
      notes: form.notes,
      isActive: true,
      createdAt: new Date().toISOString(),
      contactPhone: truck.driverPhone,
    };
    addListing(newListing);
    setShowCreateListing(false);
    setForm({ truckId: '', pricePerTonPerKm: 2.5, availableUntil: '', notes: '', destinations: '' });
  };

  const totalCapacity = filtered.reduce((sum, l) => sum + l.availableCapacityTons, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Empty Capacity Marketplace</h1>
          <p className="text-slate-500 text-sm mt-1">List and discover available truck capacity across the network</p>
        </div>
        <button
          onClick={() => setShowCreateListing(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg hover:from-violet-600 hover:to-violet-700 transition-all shadow-md shadow-violet-200 font-medium text-sm"
        >
          <Plus size={18} /> List Empty Capacity
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-4">
          <Store size={20} className="text-violet-500 mb-2" />
          <p className="text-2xl font-bold text-violet-900">{filtered.length}</p>
          <p className="text-xs text-violet-600">Active Listings</p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-4">
          <Package size={20} className="text-blue-500 mb-2" />
          <p className="text-2xl font-bold text-blue-900">{Math.round(totalCapacity)}T</p>
          <p className="text-xs text-blue-600">Total Available</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
          <Truck size={20} className="text-emerald-500 mb-2" />
          <p className="text-2xl font-bold text-emerald-900">{availableTrucks.length}</p>
          <p className="text-xs text-emerald-600">Unlisted Trucks</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4">
          <TrendingUp size={20} className="text-amber-500 mb-2" />
          <p className="text-2xl font-bold text-amber-900">
            ₹{filtered.length > 0 ? (filtered.reduce((s, l) => s + l.pricePerTonPerKm, 0) / filtered.length).toFixed(1) : '0'}
          </p>
          <p className="text-xs text-amber-600">Avg Price/T/km</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by city, registration, or driver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-slate-400" />
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {['all', 'flatbed', 'refrigerated', 'tanker', 'box', 'container'].map(t => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors capitalize',
                  typeFilter === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(listing => (
          <div
            key={listing.id}
            className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-violet-200 transition-all cursor-pointer group"
            onClick={() => setSelectedListing(listing)}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{truckTypeIcons[listing.truckType] || '🚛'}</span>
                  <div>
                    <p className="text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
                      {listing.truckRegistration}
                    </p>
                    <p className="text-[10px] text-slate-400 capitalize">{listing.truckType}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-slate-400">{listing.id}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin size={12} />
                <span>{listing.currentCity}, {listing.currentState}</span>
              </div>
            </div>

            {/* Body */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs text-slate-400">Available Capacity</p>
                  <p className="text-xl font-bold text-slate-900">{listing.availableCapacityTons}T</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Price</p>
                  <p className="text-lg font-bold text-emerald-600">₹{listing.pricePerTonPerKm}/T/km</p>
                </div>
              </div>

              {/* Destinations */}
              <div className="mb-3">
                <p className="text-xs text-slate-400 mb-1">Preferred Routes</p>
                <div className="flex flex-wrap gap-1">
                  {listing.preferredDestinations.slice(0, 3).map(dest => (
                    <span key={dest} className="px-2 py-0.5 bg-violet-50 text-violet-600 rounded text-[10px] font-medium">
                      {dest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar size={12} />
                  <span>Until {listing.availableUntil}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span>4.{Math.floor(Math.random() * 5) + 5}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
          <Store size={48} className="mx-auto mb-3 text-slate-300" />
          <p className="font-medium text-slate-500">No listings found</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or list your available capacity</p>
        </div>
      )}

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedListing(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{truckTypeIcons[selectedListing.truckType] || '🚛'}</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">{selectedListing.truckRegistration}</h2>
                    <p className="text-sm text-slate-500 capitalize">{selectedListing.truckType} · {selectedListing.id}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedListing(null)} className="p-2 hover:bg-slate-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-violet-50 rounded-lg">
                  <p className="text-xs text-violet-500">Available Capacity</p>
                  <p className="text-xl font-bold text-violet-900">{selectedListing.availableCapacityTons}T</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <p className="text-xs text-emerald-500">Price per T/km</p>
                  <p className="text-xl font-bold text-emerald-900">₹{selectedListing.pricePerTonPerKm}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-slate-400" />
                  <span className="text-slate-700">{selectedListing.currentCity}, {selectedListing.currentState}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-slate-400" />
                  <span className="text-slate-700">{selectedListing.availableFrom} to {selectedListing.availableUntil}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck size={16} className="text-slate-400" />
                  <span className="text-slate-700">{selectedListing.driverName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={16} className="text-slate-400" />
                  <span className="text-slate-700">{selectedListing.contactPhone}</span>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1.5">Preferred Destinations</p>
                <div className="flex flex-wrap gap-2">
                  {selectedListing.preferredDestinations.map(dest => (
                    <span key={dest} className="px-2.5 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-medium">
                      {dest}
                    </span>
                  ))}
                </div>
              </div>

              {selectedListing.notes && (
                <div className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                    <MessageSquare size={12} /> Notes
                  </div>
                  <p className="text-sm text-slate-700">{selectedListing.notes}</p>
                </div>
              )}

              <div className="flex gap-3 pt-3 border-t border-slate-200">
                <button
                  onClick={() => {
                    removeListing(selectedListing.id);
                    setSelectedListing(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
                >
                  Remove Listing
                </button>
                <a
                  href={`tel:${selectedListing.contactPhone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-md shadow-emerald-200"
                >
                  <Phone size={14} /> Contact Driver
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Listing Modal */}
      {showCreateListing && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreateListing(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div>
                <h2 className="text-lg font-bold text-slate-900">List Empty Capacity</h2>
                <p className="text-sm text-slate-500">Make your empty capacity available to shippers</p>
              </div>
              <button onClick={() => setShowCreateListing(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Select Truck *</label>
                {availableTrucks.length > 0 ? (
                  <select
                    required
                    value={form.truckId}
                    onChange={e => setForm({ ...form, truckId: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  >
                    <option value="">Choose a truck...</option>
                    {availableTrucks.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.registrationNumber} — {t.type} — {t.maxCapacityTons}T — {t.currentLocation.city}
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg">
                    No available trucks to list. All trucks are either in transit, in maintenance, or already listed.
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Price (₹/T/km) *</label>
                  <input
                    type="number"
                    required
                    min={0.5}
                    step={0.1}
                    value={form.pricePerTonPerKm}
                    onChange={e => setForm({ ...form, pricePerTonPerKm: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Available Until *</label>
                  <input
                    type="date"
                    required
                    value={form.availableUntil}
                    onChange={e => setForm({ ...form, availableUntil: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Preferred Destinations</label>
                <input
                  type="text"
                  placeholder="e.g., Mumbai, Delhi, Chennai (comma-separated)"
                  value={form.destinations}
                  onChange={e => setForm({ ...form, destinations: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  placeholder="Any additional info about the availability..."
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" onClick={() => setShowCreateListing(false)} className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={availableTrucks.length === 0}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-violet-700 transition-all shadow-md shadow-violet-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
