import { useState, useEffect } from 'react'
import { Warehouse, Package, Truck, Clock, Bell, Edit3 } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { getWarehouseSchedule, getActiveLoads, updateDocks } from '../../services/api'
import { getCurrentUser } from '../../services/auth'
import { mockWarehouses } from '../../utils/mockData'
import toast from 'react-hot-toast'

export default function WarehouseDashboard() {
  const [warehouse, setWarehouse] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [activeLoads, setActiveLoads] = useState([])
  const [docks, setDocks] = useState(4)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'Truck T1 arriving at 10:30', type: 'info' },
    { id: 2, message: 'Dock available', type: 'success' },
  ])
  const user = getCurrentUser()
  const warehouseId = user?.id || 'WH_MUM'

  const fetchData = async () => {
    setLoading(true)
    try {
      const scheduleRes = await getWarehouseSchedule(warehouseId)
      setSchedule(scheduleRes.data.scheduled || [])
      const loadsRes = await getActiveLoads(warehouseId)
      setActiveLoads(loadsRes.data.loads || [])
      const wh = mockWarehouses.find(w => w.warehouse_id === warehouseId)
      if (wh) {
        setWarehouse(wh)
        setDocks(wh.total_docks)
      }
      toast.success('Data refreshed')
    } catch {
      const wh = mockWarehouses.find(w => w.warehouse_id === warehouseId) || mockWarehouses[0]
      setWarehouse(wh)
      setSchedule(wh.scheduled_trucks || [])
      setActiveLoads(wh.active_loads || [])
      setDocks(wh.total_docks)
      toast.error('Using mock data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleUpdateDocks = async () => {
    try {
      await updateDocks(warehouseId, { total_docks: docks })
      toast.success('Docks updated')
      fetchData()
    } catch {
      toast.success('Docks updated (mock)')
    }
  }

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id))
  }

  if (!warehouse) return <div className="text-center py-10">Loading warehouse data...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Warehouse Dashboard</h2>
          <p className="text-text-light text-sm">{warehouse.warehouse_id} · Node {warehouse.node_id}</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">Refresh</button>
      </div>

      {/* Notifications */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <Bell size={16} /> Notifications
        </h3>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {notifications.map(n => (
            <div key={n.id} className="flex items-center justify-between text-sm border-b border-border py-1">
              <span className="text-text-light">{n.message}</span>
              <button onClick={() => dismissNotification(n.id)} className="text-text-light hover:text-primary">✕</button>
            </div>
          ))}
        </div>
      </div>

      {/* Update Docks */}
      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
          <Edit3 size={16} /> Update Docks
        </h3>
        <div className="flex items-end gap-4">
          <div>
            <label className="label">Total Docks</label>
            <input
              type="number"
              className="input-field w-32"
              value={docks}
              onChange={(e) => setDocks(parseInt(e.target.value))}
            />
          </div>
          <button onClick={handleUpdateDocks} className="btn-primary">Update</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Docks" value={warehouse.total_docks} icon={Warehouse} />
        <StatCard title="Scheduled Trucks" value={schedule.length} icon={Truck} />
        <StatCard title="Active Loads" value={activeLoads.length} icon={Package} />
      </div>

      {/* Scheduled Trucks */}
      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4 flex items-center gap-2">
          <Clock size={16} /> Scheduled Trucks
        </h3>
        {schedule.length === 0 ? (
          <p className="text-text-light text-sm">No scheduled trucks</p>
        ) : (
          <div className="space-y-2">
            {schedule.map((st, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Truck size={16} className="text-secondary" />
                  <div>
                    <p className="text-sm font-medium">{st.truck_id}</p>
                    <p className="text-xs text-text-light">Unload: {st.unloading_duration || 30} min</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-text-light" />
                  <span className="font-mono">{st.eta}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Loads */}
      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4">Active Loads at This Warehouse</h3>
        {activeLoads.length === 0 ? (
          <p className="text-text-light text-sm">No loads waiting</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {activeLoads.map((lid) => (
              <span key={lid} className="badge-info">{lid}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}