import { useState, useEffect } from 'react'
import { Truck, Package, Warehouse, Zap, Activity, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import StatCard from '../components/StatCard'
import MapVisualizer from '../components/MapVisualizer'
import StatusBadge from '../components/StatusBadge'
import { mockTrucks, mockLoads, mockWarehouses, mockPairs, mockLogs } from '../services/mockData'
import { getAdminState, getHealth } from '../services/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts'

const earningsData = [
  { time: '06:00', earnings: 200 },
  { time: '08:00', earnings: 480 },
  { time: '10:00', earnings: 730 },
  { time: '12:00', earnings: 950 },
  { time: '14:00', earnings: 1250 },
  { time: '16:00', earnings: 1580 },
  { time: '18:00', earnings: 1920 },
]

const activityData = [
  { name: 'Mon', deliveries: 8, pickups: 5 },
  { name: 'Tue', deliveries: 12, pickups: 9 },
  { name: 'Wed', deliveries: 6, pickups: 4 },
  { name: 'Thu', deliveries: 15, pickups: 11 },
  { name: 'Fri', deliveries: 10, pickups: 8 },
  { name: 'Sat', deliveries: 7, pickups: 6 },
  { name: 'Sun', deliveries: 4, pickups: 3 },
]

const agentStatus = [
  { name: 'Truck Agent', port: 8001, status: 'up', color: 'text-blue-400' },
  { name: 'Load Agent', port: 8000, status: 'up', color: 'text-emerald-400' },
  { name: 'Warehouse Agent', port: 8003, status: 'up', color: 'text-amber-400' },
  { name: 'Backhaul Agent', port: 8004, status: 'up', color: 'text-purple-400' },
  { name: 'Coordinator', port: 8005, status: 'up', color: 'text-primary-400' },
]

export default function Dashboard() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getHealth()
      .then((r) => setHealth(r.data))
      .catch(() => {})
  }, [])

  const activeTrucks = mockTrucks.filter((t) => t.status === 'TRAVELING')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-dark-100">System Dashboard</h2>
        <p className="text-dark-400 text-sm mt-1">Real-time overview of all logistics operations</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Trucks"
          value={mockTrucks.filter((t) => t.status !== 'INACTIVE').length}
          subtitle={`${activeTrucks.length} traveling now`}
          icon={Truck}
          color="text-blue-400"
          trend={12}
        />
        <StatCard
          title="Active Loads"
          value={mockLoads.filter((l) => l.status !== 'DELIVERED').length}
          subtitle={`${mockLoads.filter((l) => l.status === 'WAITING').length} waiting pickup`}
          icon={Package}
          color="text-emerald-400"
          trend={-5}
        />
        <StatCard
          title="Warehouses"
          value={mockWarehouses.length}
          subtitle={`${mockWarehouses.filter((w) => w.status === 'ACTIVE').length} active`}
          icon={Warehouse}
          color="text-amber-400"
        />
        <StatCard
          title="Pairs Today"
          value={mockPairs.length}
          subtitle={`${mockPairs.filter((p) => p.status === 'DELIVERED').length} delivered`}
          icon={Zap}
          color="text-purple-400"
          trend={8}
        />
      </div>

      {/* Map + Agents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map */}
        <div className="lg:col-span-2 card">
          <h3 className="section-title flex items-center gap-2">
            <Activity size={18} className="text-primary-400" />
            Live Map View
          </h3>
          <MapVisualizer activeTrucks={activeTrucks} />
        </div>

        {/* Agent Status */}
        <div className="card">
          <h3 className="section-title flex items-center gap-2">
            <Zap size={18} className="text-primary-400" />
            Agent Status
          </h3>
          <div className="space-y-3">
            {agentStatus.map((agent) => {
              const isUp = health ? health.agents?.[agent.name.toLowerCase().split(' ')[0]] === 'up' : agent.status === 'up'
              return (
                <div key={agent.name} className="flex items-center justify-between p-3 bg-dark-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isUp ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    <div>
                      <p className={`text-sm font-medium ${agent.color}`}>{agent.name}</p>
                      <p className="text-xs text-dark-500">Port {agent.port}</p>
                    </div>
                  </div>
                  {isUp
                    ? <CheckCircle size={16} className="text-emerald-400" />
                    : <AlertCircle size={16} className="text-red-400" />
                  }
                </div>
              )
            })}
          </div>

          {/* Pair Stats */}
          <div className="mt-4 pt-4 border-t border-dark-700">
            <p className="text-xs text-dark-400 mb-2">Avg Utility Score</p>
            <div className="text-2xl font-bold text-primary-400">
              {(mockPairs.reduce((s, p) => s + p.utility_score, 0) / mockPairs.length).toFixed(1)}
            </div>
            <p className="text-xs text-dark-500">across {mockPairs.length} pairs</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Earnings */}
        <div className="card">
          <h3 className="section-title flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-400" />
            Today's Earnings
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={earningsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Line type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Activity */}
        <div className="card">
          <h3 className="section-title flex items-center gap-2">
            <Activity size={18} className="text-blue-400" />
            Weekly Activity
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              />
              <Bar dataKey="deliveries" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="pickups" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Logs */}
      <div className="card">
        <h3 className="section-title">Recent Events</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Event</th>
                <th className="text-left p-3">Entity</th>
                <th className="text-left p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {mockLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="table-row">
                  <td className="p-3 text-dark-400 text-xs font-mono">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    <span className="badge-info text-xs">{log.event}</span>
                  </td>
                  <td className="p-3 text-dark-300 font-mono text-xs">{log.entity}</td>
                  <td className="p-3 text-dark-400">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}