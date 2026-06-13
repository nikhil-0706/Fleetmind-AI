import { useState } from 'react'
import { Package, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { mockLoads } from '../../services/mockData'
import { getShipperLoads } from '../../services/api'

export default function ShipperDashboard() {
  const [shipperId, setShipperId] = useState('S1')
  const [loads, setLoads] = useState(mockLoads)

  const fetchLoads = async () => {
    try {
      const r = await getShipperLoads(shipperId)
      setLoads(r.data.loads)
    } catch {}
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-100">Shipper Dashboard</h2>
          <p className="text-dark-400 text-sm mt-1">Manage your loads and track deliveries</p>
        </div>
        <div className="flex gap-2">
          <input className="input-field w-28" value={shipperId} onChange={(e) => setShipperId(e.target.value)} />
          <button onClick={fetchLoads} className="btn-primary">
            <Package size={16} /> My Loads
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Loads" value={loads.length} icon={Package} color="text-emerald-400" />
        <StatCard title="En Route" value={loads.filter((l) => l.status === 'EN_ROUTE').length} icon={TrendingUp} color="text-blue-400" />
        <StatCard title="Waiting" value={loads.filter((l) => l.status === 'WAITING').length} icon={Clock} color="text-amber-400" />
        <StatCard title="Delivered" value={loads.filter((l) => l.status === 'DELIVERED').length} icon={CheckCircle} color="text-emerald-400" />
      </div>

      <div className="card">
        <h3 className="section-title">All Loads</h3>
        <div className="space-y-3">
          {loads.map((load) => (
            <div key={load.load_id} className="card-sm hover:border-dark-500 transition-all">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Package size={16} className="text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-dark-100">{load.load_id}</p>
                    <p className="text-xs text-dark-400">{load.type} · {load.weight}T</p>
                  </div>
                </div>
                <StatusBadge status={load.status} />
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 text-xs">
                <div>
                  <p className="text-dark-500">From</p>
                  <p className="text-dark-200">{load.pickup_node}</p>
                </div>
                <div>
                  <p className="text-dark-500">To</p>
                  <p className="text-dark-200">{load.drop_node}</p>
                </div>
                <div>
                  <p className="text-dark-500">Deadline</p>
                  <p className="text-dark-200">{load.delivery_deadline}</p>
                </div>
                <div>
                  <p className="text-dark-500">ETA</p>
                  <p className={load.current_eta ? 'text-blue-400' : 'text-dark-500'}>
                    {load.current_eta || '—'}
                  </p>
                </div>
              </div>
              {load.assigned_truck && (
                <div className="mt-2 pt-2 border-t border-dark-700 flex items-center gap-2">
                  <span className="text-xs text-dark-500">Assigned to:</span>
                  <span className="badge-info">{load.assigned_truck}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}