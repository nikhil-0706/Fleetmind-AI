import { useState, useEffect } from 'react'
import { Users, Server, Activity, RefreshCw } from 'lucide-react'
import { getHealth } from '../../services/api'
import toast from 'react-hot-toast'

const agents = [
  { name: 'Truck Agent', port: 8001, description: 'Evaluates truck‑load pairs for feasibility and utility' },
  { name: 'Load Agent', port: 8000, description: 'Scores loads against trucks' },
  { name: 'Warehouse Agent', port: 8003, description: 'Manages dock scheduling and compatibility' },
  { name: 'Backhaul Agent', port: 8004, description: 'Suggests next actions after destination changes' },
  { name: 'Coordinator', port: 8005, description: 'Central orchestration, state management, routing' },
]

export default function Agents() {
  const [statuses, setStatuses] = useState({})
  const [loading, setLoading] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const res = await getHealth()
      setStatuses(res.data.agents || {})
      toast.success('Agent status updated')
    } catch {
      setStatuses({ truck: 'up', load: 'up', warehouse: 'up', backhaul: 'up', coordinator: 'up' })
      toast.error('Using mock status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
  }, [])

  const getStatusBadge = (key) => {
    const status = statuses[key]
    if (status === 'up') return <span className="badge-active">● Online</span>
    if (status === 'down') return <span className="badge-danger">● Offline</span>
    return <span className="badge-inactive">Unknown</span>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <Users className="text-accent" size={24} />
            Agent Management
          </h2>
          <p className="text-text-light text-sm">Monitor and manage microservices</p>
        </div>
        <button onClick={fetchStatus} disabled={loading} className="btn-secondary">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {agents.map((agent) => {
          const key = agent.name.toLowerCase().split(' ')[0]
          return (
            <div key={agent.name} className="card p-5 flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-accent/10 rounded-lg">
                  <Server size={20} className="text-accent" />
                </div>
                <div>
                  <h3 className="font-semibold text-primary">{agent.name}</h3>
                  <p className="text-sm text-text-light mt-1">{agent.description}</p>
                  <p className="text-xs text-text-light mt-2">Port: {agent.port}</p>
                </div>
              </div>
              <div className="text-right">
                {getStatusBadge(key)}
                <div className="mt-2">
                  <button className="btn-outline text-xs py-1 px-2">View Logs</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card p-5 bg-accent/5 border-accent/20">
        <h3 className="font-semibold text-primary mb-2">Agent Communication</h3>
        <p className="text-sm text-text-light">All agents communicate through the Coordinator on port 8005. The Coordinator maintains system state and orchestrates matches, intermediate pickups, and backhaul planning.</p>
      </div>
    </div>
  )
}