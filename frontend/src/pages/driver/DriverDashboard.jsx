import { useState } from 'react'
import { Truck, Navigation, Clock, Package, DollarSign, Activity } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import ScoreBar from '../../components/ScoreBar'
import { mockTrucks, mockPairs } from '../../services/mockData'
import { getTruckStatus } from '../../services/api'
import toast from 'react-hot-toast'

export default function DriverDashboard() {
  const [truckId, setTruckId] = useState('T1')
  const [truckData, setTruckData] = useState(mockTrucks[0])
  const [loading, setLoading] = useState(false)

  const fetchTruck = async () => {
    setLoading(true)
    try {
      const r = await getTruckStatus(truckId)
      setTruckData(r.data)
      toast.success('Truck status refreshed')
    } catch {
      setTruckData(mockTrucks.find((t) => t.truck_id === truckId) || mockTrucks[0])
    } finally {
      setLoading(false)
    }
  }

  const hoursUsedPct = ((8 - truckData.remaining_drive_hours) / 8) * 100
  const capUsedPct = ((20 - truckData.remaining_capacity) / 20) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-100">Driver Dashboard</h2>
          <p className="text-dark-400 text-sm mt-1">Monitor your truck and deliveries</p>
        </div>
        <div className="flex gap-3">
          <input
            className="input-field w-32"
            value={truckId}
            onChange={(e) => setTruckId(e.target.value)}
            placeholder="Truck ID"
          />
          <button onClick={fetchTruck} disabled={loading} className="btn-primary">
            <Activity size={16} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Truck Status Card */}
      <div className="card border-l-4 border-l-blue-500">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Truck size={28} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-dark-100">{truckData.truck_id}</h3>
              <StatusBadge status={truckData.status} />
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-dark-400">Current Edge</p>
            <p className="font-mono text-dark-200">{truckData.current_edge_id || '—'}</p>
            <p className="text-xs text-dark-400 mt-1">Progress: {truckData.progress_km} km</p>
          </div>
        </div>

        {/* Progress bars */}
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Drive Hours Remaining</span>
              <span className="text-dark-200 font-medium">{truckData.remaining_drive_hours}h</span>
            </div>
            <div className="score-bar">
              <div
                className={`score-fill ${hoursUsedPct > 80 ? 'bg-red-500' : hoursUsedPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${100 - hoursUsedPct}%` }}
              />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-dark-400">Capacity Remaining</span>
              <span className="text-dark-200 font-medium">{truckData.remaining_capacity}T</span>
            </div>
            <div className="score-bar">
              <div
                className="score-fill bg-blue-500"
                style={{ width: `${100 - capUsedPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Drive Hours Left" value={`${truckData.remaining_drive_hours}h`} icon={Clock} color="text-amber-400" />
        <StatCard title="Remaining Capacity" value={`${truckData.remaining_capacity}T`} icon={Package} color="text-blue-400" />
        <StatCard title="Active Pairs" value={truckData.assigned_pairs.length} icon={Navigation} color="text-emerald-400" />
        <StatCard title="Next Stop" value={truckData.next_destination || '—'} icon={Navigation} color="text-purple-400" />
      </div>

      {/* Assigned Pairs */}
      <div className="card">
        <h3 className="section-title">Assigned Pairs</h3>
        {truckData.assigned_pairs.length === 0 ? (
          <div className="text-center py-8 text-dark-500">
            <Package size={32} className="mx-auto mb-2 opacity-50" />
            <p>No active assignments</p>
          </div>
        ) : (
          <div className="space-y-3">
            {truckData.assigned_pairs.map((pairId) => {
              const pair = mockPairs.find((p) => p.pair_id === pairId)
              if (!pair) return <div key={pairId} className="card-sm text-dark-400 font-mono text-sm">{pairId}</div>
              return (
                <div key={pairId} className="card-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-mono text-sm text-dark-200">{pair.pair_id}</p>
                      <p className="text-xs text-dark-400">Load: {pair.load_id}</p>
                    </div>
                    <StatusBadge status={pair.status} />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-3">
                    <div>
                      <p className="text-xs text-dark-500">From</p>
                      <p className="text-sm text-dark-200">{pair.pickup_node}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-500">To</p>
                      <p className="text-sm text-dark-200">{pair.drop_node}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-500">Deadline</p>
                      <p className="text-sm text-dark-200">{pair.delivery_deadline}</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ScoreBar label="Utility Score" score={pair.utility_score} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}