import { useState, useEffect } from 'react'
import { Truck, Clock, Package, Navigation, Activity } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { getTruckStatus } from '../../services/api'
import { getCurrentUser } from '../../services/auth'
import { mockTrucks, mockPairs } from '../../utils/mockData'
import toast from 'react-hot-toast'

export default function DriverDashboard() {
  const [truckId, setTruckId] = useState('')
  const [truckData, setTruckData] = useState(null)
  const [loading, setLoading] = useState(false)
  const user = getCurrentUser()

  // For MVP, driver ID is stored; we need to fetch associated truck
  // For simplicity, we'll allow manual entry or fetch from stored registration
  useEffect(() => {
    // In a real app, you'd fetch the driver's truck from backend
    // For demo, we'll use mock
    const mockTruck = mockTrucks[0]
    setTruckData(mockTruck)
    setTruckId(mockTruck.truck_id)
  }, [])

  const fetchTruck = async () => {
    if (!truckId) return
    setLoading(true)
    try {
      const res = await getTruckStatus(truckId)
      setTruckData(res.data)
      toast.success('Truck status updated')
    } catch (err) {
      setTruckData(mockTrucks.find(t => t.truck_id === truckId) || mockTrucks[0])
      toast.error('Using mock data')
    } finally {
      setLoading(false)
    }
  }

  if (!truckData) {
    return <div className="text-center py-10">Loading dashboard...</div>
  }

  const hoursUsed = 8 - truckData.remaining_drive_hours
  const hoursPct = (hoursUsed / 8) * 100
  const capacityUsed = 20 - truckData.remaining_capacity
  const capPct = (capacityUsed / 20) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Driver Dashboard</h2>
          <p className="text-text-light text-sm">Monitor your truck and active deliveries</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input-field w-32"
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            placeholder="Truck ID"
          />
          <button onClick={fetchTruck} disabled={loading} className="btn-secondary">
            <Activity size={16} />
            {loading ? '...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="card border-l-4 border-l-accent p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl">
              <Truck size={28} className="text-accent" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-primary">{truckData.truck_id}</h3>
              <StatusBadge status={truckData.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-light">Current Edge / Node</p>
            <p className="font-mono text-sm">{truckData.current_edge_id || truckData.current_node_id || '—'}</p>
            {truckData.progress_km !== undefined && (
              <p className="text-xs text-text-light mt-1">Progress: {truckData.progress_km} km</p>
            )}
          </div>
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-light">Drive Hours Remaining</span>
              <span className="font-medium">{truckData.remaining_drive_hours}h</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: `${100 - (hoursUsed / 8) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-text-light">Capacity Remaining</span>
              <span className="font-medium">{truckData.remaining_capacity}T</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-secondary rounded-full" style={{ width: `${100 - (capacityUsed / 20) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Drive Hours Left" value={`${truckData.remaining_drive_hours}h`} icon={Clock} />
        <StatCard title="Remaining Capacity" value={`${truckData.remaining_capacity}T`} icon={Package} />
        <StatCard title="Active Pairs" value={truckData.assigned_pairs?.length || 0} icon={Navigation} />
        <StatCard title="Next Stop" value={truckData.next_destination || '—'} icon={Navigation} />
      </div>

      {/* Active Pairs */}
      <div className="card">
        <h3 className="font-semibold text-primary mb-4">Active Pairs</h3>
        {truckData.assigned_pairs?.length === 0 ? (
          <div className="text-center py-8 text-text-light">
            <Package size={32} className="mx-auto mb-2 opacity-50" />
            <p>No active assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {truckData.assigned_pairs.map((pairId) => {
              const pair = mockPairs.find(p => p.pair_id === pairId)
              if (!pair) return (
                <div key={pairId} className="card-sm">
                  <p className="font-mono text-sm">{pairId}</p>
                </div>
              )
              return (
                <div key={pairId} className="card-sm">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-mono text-sm font-medium">{pair.pair_id}</p>
                      <p className="text-xs text-text-light">Load: {pair.load_id}</p>
                    </div>
                    <StatusBadge status={pair.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3 text-sm">
                    <div><span className="text-text-light">From</span><br/>{pair.pickup_node}</div>
                    <div><span className="text-text-light">To</span><br/>{pair.drop_node}</div>
                    <div><span className="text-text-light">Deadline</span><br/>{pair.delivery_deadline}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        <button className="btn-primary">Start Session</button>
        <button className="btn-primary">Depart</button>
        <button className="btn-primary">Complete Delivery</button>
      </div>
    </div>
  )
}