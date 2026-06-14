import { useState } from 'react'
import { Settings, Truck, Package, Warehouse, Zap, RotateCcw } from 'lucide-react'
import { getAdminState, forceMatch, cancelPair, overrideRateCap } from '../../services/api'
import { mockTrucks, mockLoads, mockWarehouses, mockPairs } from '../../services/mockData'
import StatusBadge from '../../components/StatusBadge'
import toast from 'react-hot-toast'

const tabs = ['Trucks', 'Loads', 'Warehouses', 'Pairs']

export default function SystemState() {
  const [activeTab, setActiveTab] = useState('Trucks')
  const [state, setState] = useState({ trucks: mockTrucks, loads: mockLoads, warehouses: mockWarehouses, pairs: mockPairs })
  const [rateCap, setRateCap] = useState({ min_rate: 0, max_rate: 200 })

  const refresh = async () => {
    try {
      const r = await getAdminState()
      setState(r.data)
      toast.success('State refreshed')
    } catch {
      toast.error('Backend not available, showing mock data')
    }
  }

  const handleRateCapUpdate = async () => {
    try {
      await overrideRateCap(rateCap)
      toast.success('Rate cap updated!')
    } catch {
      toast.success('Rate cap updated (mock)!')
    }
  }

  const renderTable = () => {
    if (activeTab === 'Trucks') {
      return (
        <table className="w-full text-sm">
          <thead><tr className="table-header">
            {['ID', 'Status', 'Capacity', 'Drive Hours', 'Load Weight', 'Pairs'].map((h) => <th key={h} className="text-left p-3">{h}</th>)}
          </tr></thead>
          <tbody>{state.trucks.map((t) => (
            <tr key={t.truck_id} className="table-row">
              <td className="p-3 font-mono text-primary-400">{t.truck_id}</td>
              <td className="p-3"><StatusBadge status={t.status} /></td>
              <td className="p-3 text-dark-400">{t.remaining_capacity}T</td>
              <td className="p-3 text-dark-400">{t.remaining_drive_hours}h</td>
              <td className="p-3 text-dark-400">{t.current_load_weight}T</td>
              <td className="p-3 text-dark-400">{t.assigned_pairs.length}</td>
            </tr>
          ))}</tbody>
        </table>
      )
    }
    if (activeTab === 'Loads') {
      return (
        <table className="w-full text-sm">
          <thead><tr className="table-header">
            {['ID', 'Type', 'Weight', 'Status', 'From', 'To', 'Deadline', 'Rate'].map((h) => <th key={h} className="text-left p-3">{h}</th>)}
          </tr></thead>
          <tbody>{state.loads.map((l) => (
            <tr key={l.load_id} className="table-row">
              <td className="p-3 font-mono text-emerald-400">{l.load_id}</td>
              <td className="p-3 text-dark-300">{l.type}</td>
              <td className="p-3 text-dark-400">{l.weight}T</td>
              <td className="p-3"><StatusBadge status={l.status} /></td>
              <td className="p-3 text-dark-400">{l.pickup_node}</td>
              <td className="p-3 text-dark-400">{l.drop_node}</td>
              <td className="p-3 font-mono text-dark-300">{l.delivery_deadline}</td>
              <td className="p-3 text-dark-400">₹{l.offered_rs_per_km}</td>
            </tr>
          ))}</tbody>
        </table>
      )
    }
    if (activeTab === 'Warehouses') {
      return (
        <table className="w-full text-sm">
          <thead><tr className="table-header">
            {['ID', 'Node', 'Status', 'Docks', 'Active Loads', 'Scheduled Trucks'].map((h) => <th key={h} className="text-left p-3">{h}</th>)}
          </tr></thead>
          <tbody>{state.warehouses.map((w) => (
            <tr key={w.warehouse_id} className="table-row">
              <td className="p-3 font-mono text-amber-400">{w.warehouse_id}</td>
              <td className="p-3 text-dark-400">{w.node_id}</td>
              <td className="p-3"><StatusBadge status={w.status} /></td>
              <td className="p-3 text-dark-400">{w.total_docks}</td>
              <td className="p-3 text-dark-400">{w.active_loads.length}</td>
              <td className="p-3 text-dark-400">{w.scheduled_trucks.length}</td>
            </tr>
          ))}</tbody>
        </table>
      )
    }
    if (activeTab === 'Pairs') {
      return (
        <table className="w-full text-sm">
          <thead><tr className="table-header">
            {['Pair ID', 'Truck', 'Load', 'Status', 'WH', 'ETA', 'Score', 'Action'].map((h) => <th key={h} className="text-left p-3">{h}</th>)}
          </tr></thead>
          <tbody>{state.pairs.map((p) => (
            <tr key={p.pair_id} className="table-row">
              <td className="p-3 font-mono text-purple-400 text-xs">{p.pair_id}</td>
              <td className="p-3 text-dark-300">{p.truck_id}</td>
              <td className="p-3 text-dark-300">{p.load_id}</td>
              <td className="p-3"><StatusBadge status={p.status} /></td>
              <td className="p-3 text-dark-400">{p.assigned_warehouse}</td>
              <td className="p-3 font-mono text-dark-300">{p.assigned_eta}</td>
              <td className="p-3 text-blue-400 font-medium">{p.utility_score}</td>
              <td className="p-3">
                {p.status !== 'DELIVERED' && (
                  <button
                    onClick={async () => {
                      try {
                        await cancelPair({ pair_id: p.pair_id })
                        toast.success(`Pair ${p.pair_id} cancelled`)
                      } catch {
                        toast.success('Cancelled (mock)')
                      }
                    }}
                    className="text-xs text-red-400 hover:text-red-300"
                  >
                    Cancel
                  </button>
                )}
              </td>
            </tr>
          ))}</tbody>
        </table>
      )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <Settings className="text-purple-400" size={24} />
            System State
          </h2>
          <p className="text-dark-400 text-sm mt-1">Full system data overview and controls</p>
        </div>
        <button onClick={refresh} className="btn-primary">
          <RotateCcw size={16} /> Refresh
        </button>
      </div>

      {/* Rate cap override */}
      <div className="card">
        <h3 className="section-title">Rate Cap Override</h3>
        <div className="flex items-end gap-4">
          <div>
            <label className="label">Min Rate (₹/km)</label>
            <input
              type="number"
              className="input-field w-32"
              value={rateCap.min_rate}
              onChange={(e) => setRateCap({ ...rateCap, min_rate: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <label className="label">Max Rate (₹/km)</label>
            <input
              type="number"
              className="input-field w-32"
              value={rateCap.max_rate}
              onChange={(e) => setRateCap({ ...rateCap, max_rate: parseInt(e.target.value) })}
            />
          </div>
          <button onClick={handleRateCapUpdate} className="btn-danger">
            Override Cap
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex gap-1 mb-4 bg-dark-800 p-1 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all
                ${activeTab === tab ? 'bg-primary-600 text-white' : 'text-dark-400 hover:text-dark-200'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          {renderTable()}
        </div>
      </div>
    </div>
  )
}