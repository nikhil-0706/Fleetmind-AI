import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Package, Warehouse, Link, Activity } from 'lucide-react'
import { getMap, getAdminState, getHealth } from '../../services/api'
import MapVisualizer from '../../components/MapVisualizer'
import StatCard from '../../components/StatCard'
// No mock data import

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [mapData, setMapData] = useState({ nodes: [], edges: [] })
  const [stats, setStats] = useState({ trucks: 0, loads: 0, warehouses: 0, activePairs: 0 })
  const [agents, setAgents] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mapRes, stateRes, healthRes] = await Promise.all([
          getMap(),
          getAdminState(),
          getHealth().catch(() => ({ data: { agents: {} } }))
        ])
        setMapData(mapRes.data)

        const state = stateRes.data
        setStats({
          trucks: state.trucks?.length || 0,
          loads: state.loads?.length || 0,
          warehouses: state.warehouses?.length || 0,
          activePairs: state.pairs?.filter(p => p.status !== 'DELIVERED').length || 0,
        })

        setAgents(healthRes.data?.agents || {})
      } catch (err) {
        console.error('Failed to load admin data:', err)
        // No fallback to mock – show zeros
        setStats({ trucks: 0, loads: 0, warehouses: 0, activePairs: 0 })
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <div className="p-8 text-center">Loading admin dashboard...</div>

  const agentList = [
    { name: 'Truck Agent', key: 'truck', port: 8001 },
    { name: 'Load Agent', key: 'load', port: 8000 },
    { name: 'Warehouse Agent', key: 'warehouse', port: 8003 },
    { name: 'Backhaul Agent', key: 'backhaul', port: 8004 },
    { name: 'Coordinator', key: 'coordinator', port: 8005 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Admin Dashboard</h2>
          <p className="text-text-light text-sm">System maintenance and monitoring</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          <Activity size={16} /> Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Trucks" value={stats.trucks} icon={Truck} />
        <StatCard title="Loads" value={stats.loads} icon={Package} />
        <StatCard title="Warehouses" value={stats.warehouses} icon={Warehouse} />
        <StatCard title="Active Pairs" value={stats.activePairs} icon={Link} />
      </div>

      {/* Live Map (compact) */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2">Live Logistics Map</h3>
        <MapVisualizer nodes={mapData.nodes} edges={mapData.edges} activeTrucks={[]} />
        <p className="text-sm text-text-light mt-2">
          {mapData.nodes.length} nodes, {mapData.edges.length} edges
        </p>
      </div>

      {/* Agent Status */}
      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-3">Agent Status</h3>
        <div className="flex flex-wrap gap-4">
          {agentList.map(agent => {
            const isUp = agents[agent.key] === 'up'
            return (
              <div key={agent.key} className="flex items-center gap-2 bg-gray-50 rounded-full px-3 py-1">
                <div className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-sm text-text">{agent.name}</span>
                <span className="text-xs text-text-light">({agent.port})</span>
                {isUp ? <span className="text-emerald-600 text-xs">● Online</span> : <span className="text-red-600 text-xs">● Offline</span>}
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <button onClick={() => navigate('/admin/system-state')} className="btn-primary">
          View System State
        </button>
        <button onClick={() => navigate('/admin/configuration')} className="btn-primary">
          Configuration
        </button>
        <button onClick={() => navigate('/admin/logs')} className="btn-primary">
          View Logs
        </button>
      </div>
    </div>
  )
}