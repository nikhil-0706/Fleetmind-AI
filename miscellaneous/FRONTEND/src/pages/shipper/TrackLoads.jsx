import { useState } from 'react'
import { MapPin, Package, Search, Eye } from 'lucide-react'
import { getLoadStatus } from '../../services/api'
import StatusBadge from '../../components/StatusBadge'
import { mockLoads } from '../../utils/mockData'
import toast from 'react-hot-toast'

export default function TrackLoads() {
  const [loadId, setLoadId] = useState('')
  const [loadData, setLoadData] = useState(null)
  const [loading, setLoading] = useState(false)

  const track = async () => {
    if (!loadId) return toast.error('Enter a Load ID')
    setLoading(true)
    try {
      const res = await getLoadStatus(loadId)
      setLoadData(res.data)
      toast.success('Load found')
    } catch {
      const mock = mockLoads.find(l => l.load_id === loadId)
      if (mock) {
        setLoadData(mock)
        toast.info('Using mock data')
      } else {
        toast.error('Load not found')
        setLoadData(null)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Track Load</h2>
        <p className="text-text-light text-sm">Real-time load tracking and status</p>
      </div>

      <div className="flex gap-3">
        <input
          className="input-field flex-1"
          value={loadId}
          onChange={(e) => setLoadId(e.target.value)}
          placeholder="Enter Load ID (e.g., L123)"
        />
        <button onClick={track} disabled={loading} className="btn-primary">
          <Search size={16} />
          {loading ? 'Searching...' : 'Track'}
        </button>
      </div>

      {loadData && (
        <div className="card border-l-4 border-l-accent p-5 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <Package size={24} className="text-accent" />
            <div>
              <h3 className="font-bold text-primary">{loadData.load_id}</h3>
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
              <div key={label} className="flex justify-between py-2 border-b border-border">
                <span className="text-sm text-text-light">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}