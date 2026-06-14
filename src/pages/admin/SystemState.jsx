import { useState, useEffect } from 'react'
import { Grid } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge'
import { getAdminState } from '../../services/api'
import toast from 'react-hot-toast'

const tabs = ['Trucks', 'Loads', 'Warehouses', 'Pairs']

export default function SystemState() {
  const [activeTab, setActiveTab] = useState('Trucks')
  const [state, setState] = useState({ trucks: [], loads: [], warehouses: [], pairs: [] })

  const fetchState = async () => {
    try {
      const res = await getAdminState()
      setState(res.data)
      toast.success('State refreshed')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load state from backend')
      setState({ trucks: [], loads: [], warehouses: [], pairs: [] })
    }
  }

  useEffect(() => {
    fetchState()
  }, [])

  const renderTable = () => {
    if (activeTab === 'Trucks') {
      return (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-3">Truck ID</th><th>Driver</th><th>Status</th><th>Location</th><th>Hours Left</th><th>Capacity</th>
            </tr>
          </thead>
          <tbody>
            {state.trucks.map(t => (
              <tr key={t.truck_id} className="border-b border-border">
                <td className="p-3 font-mono">{t.truck_id}</td>
                <td className="p-3">{t.driver_id || '-'}</td>
                <td className="p-3"><StatusBadge status={t.status} /></td>
                <td className="p-3">{t.current_edge_id || t.current_node_id || '-'}</td>
                <td className="p-3">{t.remaining_drive_hours}h</td>
                <td className="p-3">{t.remaining_capacity}T</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    if (activeTab === 'Loads') {
      return (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-3">Load ID</th><th>Type</th><th>Weight</th><th>Status</th><th>From</th><th>To</th><th>Deadline</th></tr>
          </thead>
          <tbody>
            {state.loads.map(l => (
              <tr key={l.load_id} className="border-b border-border">
                <td className="p-3 font-mono">{l.load_id}</td>
                <td className="p-3">{l.type}</td>
                <td className="p-3">{l.weight}T</td>
                <td className="p-3"><StatusBadge status={l.status} /></td>
                <td className="p-3">{l.pickup_node_id}</td>
                <td className="p-3">{l.drop_node_id}</td>
                <td className="p-3">{l.delivery_deadline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    if (activeTab === 'Warehouses') {
      return (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-3">Warehouse ID</th><th>Node</th><th>Status</th><th>Docks</th><th>Active Loads</th><th>Scheduled</th></tr>
          </thead>
          <tbody>
            {state.warehouses.map(w => (
              <tr key={w.warehouse_id} className="border-b border-border">
                <td className="p-3 font-mono">{w.warehouse_id}</td>
                <td className="p-3">{w.node_id}</td>
                <td className="p-3"><StatusBadge status={w.status} /></td>
                <td className="p-3">{w.total_docks}</td>
                <td className="p-3">{w.active_loads?.length || 0}</td>
                <td className="p-3">{w.scheduled_trucks?.length || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
    if (activeTab === 'Pairs') {
      return (
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr><th className="text-left p-3">Pair ID</th><th>Truck</th><th>Load</th><th>Status</th><th>Warehouse</th><th>ETA</th></tr>
          </thead>
          <tbody>
            {state.pairs.map(p => (
              <tr key={p.pair_id} className="border-b border-border">
                <td className="p-3 font-mono text-xs">{p.pair_id}</td>
                <td className="p-3">{p.truck_id}</td>
                <td className="p-3">{p.load_id}</td>
                <td className="p-3"><StatusBadge status={p.status} /></td>
                <td className="p-3">{p.assigned_warehouse || '-'}</td>
                <td className="p-3">{p.assigned_eta || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Grid className="text-accent" size={24} />
            System State
          </h2>
          <p className="text-text-light text-sm">Read‑only view of all system entities</p>
        </div>
        <button onClick={fetchState} className="btn-secondary">Refresh</button>
      </div>

      <div className="card p-5">
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit mb-4">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-text-light hover:text-primary'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
        {state.trucks.length === 0 && state.loads.length === 0 && state.warehouses.length === 0 && state.pairs.length === 0 && (
          <div className="text-center py-8 text-text-light">No data – backend is empty. Register a truck, load, or warehouse.</div>
        )}
      </div>
    </div>
  )
}