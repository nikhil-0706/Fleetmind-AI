import { useState } from 'react'
import { Shield, Truck, Package, Warehouse, Zap, TrendingUp, AlertCircle } from 'lucide-react'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import MapVisualizer from '../../components/MapVisualizer'
import { mockTrucks, mockLoads, mockWarehouses, mockPairs } from '../../services/mockData'
import { getAdminState } from '../../services/api'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboard() {
  const [data, setData] = useState({
    trucks: mockTrucks,
    loads: mockLoads,
    warehouses: mockWarehouses,
    pairs: mockPairs,
  })

  const fetchState = async () => {
    try {
      const r = await getAdminState()
      setData(r.data)
    } catch {}
  }

  const truckStatusData = [
    { name: 'TRAVELING', value: data.trucks.filter((t) => t.status === 'TRAVELING').length },
    { name: 'IDLE', value: data.trucks.filter((t) => t.status === 'IDLE').length },
    { name: 'AT_NODE', value: data.trucks.filter((t) => t.status === 'AT_NODE').length },
    { name: 'PAUSED', value: data.trucks.filter((t) => t.status === 'PAUSED').length },
  ].filter((d) => d.value > 0)

  const loadStatusData = [
    { name: 'EN_ROUTE', value: data.loads.filter((l) => l.status === 'EN_ROUTE').length },
    { name: 'WAITING', value: data.loads.filter((l) => l.status === 'WAITING').length },
    { name: 'DELIVERED', value: data.loads.filter((l) => l.status === 'DELIVERED').length },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <Shield className="text-purple-400" size={24} />
            Admin Dashboard
          </h2>
          <p className="text-dark-400 text-sm mt-1">Full system oversight and control</p>
        </div>
        <button onClick={fetchState} className="btn-primary">
          <Zap size={16} /> Refresh State
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Trucks" value={data.trucks.length} icon={Truck} color="text-blue-400" />
        <StatCard title="Loads" value={data.loads.length} icon={Package} color="text-emerald-400" />
        <StatCard title="Warehouses" value={data.warehouses.length} icon={Warehouse} color="text-amber-400" />
        <StatCard title="Active Pairs" value={data.pairs.filter((p) => p.status !== 'DELIVERED').length} icon={Zap} color="text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="section-title">System Map</h3>
          <MapVisualizer activeTrucks={data.trucks.filter((t) => t.status === 'TRAVELING')} />
        </div>

        <div className="space-y-4">
          <div className="card">
            <h3 className="section-title text-sm">Truck Status Distribution</h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={truckStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  {truckStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Legend iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="card">
            <h3 className="section-title text-sm">Load Status Distribution</h3>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={loadStatusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value">
                  {loadStatusData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155' }} />
                <Legend iconSize={8} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trucks table */}
      <div className="card">
        <h3 className="section-title">All Trucks</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                {['Truck ID', 'Status', 'Location', 'Capacity Left', 'Drive Hours', 'Pairs'].map((h) => (
                  <th key={h} className="text-left p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.trucks.map((t) => (
                <tr key={t.truck_id} className="table-row">
                  <td className="p-3 font-mono text-dark-200">{t.truck_id}</td>
                  <td className="p-3"><StatusBadge status={t.status} /></td>
                  <td className="p-3 text-dark-400">{t.current_edge_id || 'At Node'}</td>
                  <td className="p-3 text-dark-400">{t.remaining_capacity}T</td>
                  <td className="p-3 text-dark-400">{t.remaining_drive_hours}h</td>
                  <td className="p-3 text-dark-400">{t.assigned_pairs.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}