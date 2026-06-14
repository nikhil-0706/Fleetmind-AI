import { useState, useEffect, useCallback } from 'react'
import { Warehouse, Package, Truck, Clock, Bell, Edit3 } from 'lucide-react'
import StatCard from '../../components/StatCard'
import { getWarehouseSchedule, getActiveLoads, updateDocks } from '../../services/api'
import { getCurrentUser } from '../../services/auth'
import toast from 'react-hot-toast'

export default function WarehouseDashboard() {
  const [schedule, setSchedule] = useState([])
  const [activeLoads, setActiveLoads] = useState([])
  const [docks, setDocks] = useState(0)
  const [notifications] = useState([]) // kept for future use, no setter needed
  const user = getCurrentUser()
  const warehouseId = user?.id || ''

  const fetchData = useCallback(async () => {
    if (!warehouseId) {
      setSchedule([])
      setActiveLoads([])
      return
    }
    try {
      const [scheduleRes, loadsRes] = await Promise.all([
        getWarehouseSchedule(warehouseId),
        getActiveLoads(warehouseId)
      ])
      setSchedule(scheduleRes.data.scheduled_trucks || [])
      setActiveLoads(loadsRes.data.loads || [])
      toast.success('Data refreshed')
    } catch (err) {
      console.error(err)
      toast.error('Failed to fetch warehouse data')
      setSchedule([])
      setActiveLoads([])
    }
  }, [warehouseId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUpdateDocks = async () => {
    try {
      await updateDocks(warehouseId, { total_docks: docks })
      toast.success('Docks updated')
      fetchData()
    } catch (err) {
      console.error(err)
      toast.error('Update failed')
    }
  }

  if (!warehouseId) {
    return <div className="text-center py-10">Please log in as a warehouse user.</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Warehouse Dashboard</h2>
          <p className="text-text-light text-sm">{warehouseId}</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">Refresh</button>
      </div>

      {/* Notifications */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2">
          <Bell size={16} /> Notifications
        </h3>
        <div className="max-h-32 overflow-y-auto space-y-1">
          {notifications.length === 0 && <p className="text-sm text-text-light">No notifications</p>}
          {notifications.map((n, idx) => (
            <div key={idx} className="text-sm text-text-light">{n.message}</div>
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
        <StatCard title="Total Docks" value={docks} icon={Warehouse} />
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
            {activeLoads.map((lid, idx) => (
              <span key={idx} className="badge-info">{lid.load_id || lid}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}