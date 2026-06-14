import { useState, useEffect } from 'react'
import { Package, TrendingUp, Clock, CheckCircle, Bell } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { getShipperLoads } from '../../services/api'
import { getCurrentUser } from '../../services/auth'
import { mockLoads } from '../../utils/mockData'
import toast from 'react-hot-toast'

export default function ShipperDashboard() {
  const [loads, setLoads] = useState([])
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Load L123 assigned to truck T1 · ETA 10:30', type: 'info' },
    { id: 2, message: 'Load L123 picked up at N2', type: 'success' },
  ])
  const user = getCurrentUser()
  const shipperId = user?.id || 'SHIP_001'

  const fetchLoads = async () => {
    setLoading(true)
    try {
      const res = await getShipperLoads(shipperId)
      setLoads(res.data.loads)
      toast.success('Loads refreshed')
    } catch {
      setLoads(mockLoads)
      toast.error('Using mock data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoads()
  }, [])

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  const stats = {
    total: loads.length,
    enRoute: loads.filter(l => l.status === 'EN_ROUTE').length,
    waiting: loads.filter(l => l.status === 'WAITING' || l.status === 'PENDING').length,
    delivered: loads.filter(l => l.status === 'DELIVERED').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Shipper Dashboard</h2>
          <p className="text-text-light text-sm">Manage your loads and track shipments</p>
        </div>
        <button onClick={fetchLoads} disabled={loading} className="btn-secondary">
          Refresh
        </button>
      </div>

      {/* Notifications */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <Bell size={16} /> Latest Notifications
        </h3>
        <div className="max-h-36 overflow-y-auto space-y-1">
          {notifications.length === 0 ? (
            <p className="text-sm text-text-light">No new notifications</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className="flex items-center justify-between text-sm border-b border-border py-1">
                <span className="text-text-light">{n.message}</span>
                <button onClick={() => dismissNotification(n.id)} className="text-text-light hover:text-primary">✕</button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Loads" value={stats.total} icon={Package} />
        <StatCard title="En Route" value={stats.enRoute} icon={TrendingUp} />
        <StatCard title="Waiting" value={stats.waiting} icon={Clock} />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle} />
      </div>

      {/* Loads List */}
      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4">My Loads</h3>
        <div className="space-y-3">
          {loads.map((load) => (
            <div key={load.load_id} className="card-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Package size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary">{load.load_id}</p>
                    <p className="text-xs text-text-light">{load.type} · {load.weight}T</p>
                  </div>
                </div>
                <StatusBadge status={load.status} />
              </div>
              <div className="grid grid-cols-4 gap-3 mt-3 text-xs">
                <div><span className="text-text-light">From</span><br/>{load.pickup_node}</div>
                <div><span className="text-text-light">To</span><br/>{load.drop_node}</div>
                <div><span className="text-text-light">Deadline</span><br/>{load.delivery_deadline}</div>
                <div><span className="text-text-light">ETA</span><br/>{load.current_eta || '—'}</div>
              </div>
              {load.assigned_truck && (
                <div className="mt-2 pt-2 border-t border-border flex items-center gap-2">
                  <span className="text-xs text-text-light">Assigned to:</span>
                  <span className="badge-info text-xs">{load.assigned_truck}</span>
                </div>
              )}
            </div>
          ))}
          {loads.length === 0 && (
            <div className="text-center py-6 text-text-light">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              <p>No loads found. Register your first load.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}