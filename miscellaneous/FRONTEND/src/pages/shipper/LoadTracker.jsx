import { useState } from 'react'
import { MapPin, Package, Search } from 'lucide-react'
import { getLoadStatus } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import MapVisualizer from '../../components/MapVisualizer'
import { mockLoads } from '../../services/mockData'
import toast from 'react-hot-toast'

export default function LoadTracker() {
  const [loadId, setLoadId] = useState('L1')
  const [loadData, setLoadData] = useState(mockLoads[0])
  const [loading, setLoading] = useState(false)

  const track = async () => {
    setLoading(true)
    try {
      const r = await getLoadStatus(loadId)
      setLoadData(r.data)
    } catch {
      setLoadData(mockLoads.find((l) => l.load_id === loadId) || mockLoads[0])
      toast.error('Using mock data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
          <MapPin className="text-emerald-400" size={24} />
          Track Load
        </h2>
        <p className="text-dark-400 text-sm mt-1">Real-time load tracking and status</p>
      </div>

      <div className="flex gap-3">
        <input
          className="input-field max-w-xs"
          value={loadId}
          onChange={(e) => setLoadId(e.target.value)}
          placeholder="Enter Load ID"
        />
        <button onClick={track} disabled={loading} className="btn-primary">
          <Search size={16} />
          {loading ? 'Tracking...' : 'Track'}
        </button>
      </div>

      {loadData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">
          <div className="card border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3 mb-4">
              <Package size={24} className="text-emerald-400" />
              <div>
                <h3 className="font-bold text-dark-100">{loadData.load_id}</h3>
                <StatusBadge status={loadData.status} />
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Type', value: loadData.type },
                { label: 'Weight', value: `${loadData.weight}T` },
                { label: 'From', value: loadData.pickup_node },
                { label: 'To', value: loadData.drop_node },
                { label: 'Deadline', value: loadData.delivery_deadline },
                { label: 'ETA', value: loadData.current_eta || 'Not assigned' },
                { label: 'Truck', value: loadData.assigned_truck || 'Unassigned' },
                { label: 'Rate', value: `₹${loadData.offered_rs_per_km}/km` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-dark-800">
                  <span className="text-sm text-dark-400">{label}</span>
                  <span className="text-sm text-dark-100 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="section-title">Route Map</h3>
            <MapVisualizer />
          </div>
        </div>
      )}
    </div>
  )
}