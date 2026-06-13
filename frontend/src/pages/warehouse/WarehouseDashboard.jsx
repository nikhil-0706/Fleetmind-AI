import { useState } from 'react'
import { Warehouse, Package, Truck, Clock } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { mockWarehouses } from '../../services/mockData'
import { getWarehouseSchedule, getActiveLoads } from '../../services/api'

export default function WarehouseDashboard() {
  const [warehouses] = useState(mockWarehouses)
  const [selected, setSelected] = useState(mockWarehouses[0])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-100">Warehouse Dashboard</h2>
        <p className="text-dark-400 text-sm mt-1">Monitor warehouse operations and dock usage</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Warehouses" value={warehouses.length} icon={Warehouse} color="text-amber-400" />
        <StatCard title="Active" value={warehouses.filter((w) => w.status === 'ACTIVE').length} icon={Warehouse} color="text-emerald-400" />
        <StatCard title="Total Docks" value={warehouses.reduce((s, w) => s + w.total_docks, 0)} icon={Package} color="text-blue-400" />
        <StatCard title="Scheduled Trucks" value={warehouses.reduce((s, w) => s + w.scheduled_trucks.length, 0)} icon={Truck} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warehouse list */}
        <div className="space-y-3">
          {warehouses.map((wh) => (
            <div
              key={wh.warehouse_id}
              onClick={() => setSelected(wh)}
              className={`card-sm cursor-pointer transition-all
                ${selected?.warehouse_id === wh.warehouse_id ? 'border-amber-500/50' : 'hover:border-dark-500'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Warehouse size={18} className="text-amber-400" />
                  <div>
                    <p className="font-semibold text-dark-100">{wh.warehouse_id}</p>
                    <p className="text-xs text-dark-400">Node: {wh.node_id}</p>
                  </div>
                </div>
                <StatusBadge status={wh.status} />
              </div>
              <div className="flex gap-4 mt-2 text-xs text-dark-400">
                <span>{wh.total_docks} docks</span>
                <span>{wh.active_loads.length} loads</span>
                <span>{wh.scheduled_trucks.length} trucks</span>
              </div>
            </div>
          ))}
        </div>

        {/* Detail */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            <div className="card">
              <h3 className="section-title">{selected.warehouse_id} — Schedule</h3>
              {selected.scheduled_trucks.length === 0 ? (
                <p className="text-dark-500 text-sm">No scheduled trucks</p>
              ) : (
                <div className="space-y-2">
                  {selected.scheduled_trucks.map((st, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Truck size={16} className="text-blue-400" />
                        <div>
                          <p className="text-sm font-medium text-dark-100">{st.truck_id}</p>
                          <p className="text-xs text-dark-400">Unload: {st.unloading_duration} min</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock size={14} className="text-dark-400" />
                        <span className="font-mono text-dark-200">{st.eta}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="section-title">Active Loads</h3>
              {selected.active_loads.length === 0 ? (
                <p className="text-dark-500 text-sm">No loads waiting</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selected.active_loads.map((lid) => (
                    <span key={lid} className="badge-info">{lid}</span>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="section-title">Compatible Types</h3>
              <div className="flex flex-wrap gap-2">
                {selected.compatible_load_types.map((t) => (
                  <span key={t} className="badge-warning">{t}</span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}