import { useState } from 'react'
import { FileText, Download, Filter, RefreshCw } from 'lucide-react'
import { getLogs, exportLogs } from '../../services/api'
import { mockLogs } from '../../services/mockData'
import toast from 'react-hot-toast'

const EVENT_COLORS = {
  REGISTRATION: 'badge-info',
  SESSION_START: 'badge-active',
  SESSION_END: 'badge-inactive',
  MATCH: 'badge-warning',
  DEPART: 'badge-info',
  ARRIVE: 'badge-info',
  DELIVERY: 'badge-active',
  BACKHAUL: 'badge-warning',
  PROPOSAL: 'badge-warning',
  CANCEL: 'badge-danger',
}

export default function Logs() {
  const [logs, setLogs] = useState(mockLogs)
  const [filter, setFilter] = useState({ entity: '', event: '', from: '', to: '' })
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const r = await getLogs(filter)
      setLogs(r.data.logs)
    } catch {
      setLogs(mockLogs)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const r = await exportLogs()
      const url = window.URL.createObjectURL(new Blob([r.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'logs.csv'
      a.click()
    } catch {
      // Mock CSV export
      const csv = ['id,timestamp,event,entity,details',
        ...logs.map((l) => `${l.id},${l.timestamp},${l.event},${l.entity},"${l.details}"`)
      ].join('\n')
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'logs.csv'; a.click()
      toast.success('Logs exported!')
    }
  }

  const filtered = logs.filter((l) => {
    if (filter.entity && !l.entity.includes(filter.entity)) return false
    if (filter.event && l.event !== filter.event) return false
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <FileText className="text-purple-400" size={24} />
            System Logs
          </h2>
          <p className="text-dark-400 text-sm mt-1">Audit trail of all system events</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchLogs} disabled={loading} className="btn-secondary">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button onClick={handleExport} className="btn-primary">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-dark-400" />
          <span className="text-sm font-medium text-dark-300">Filters</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="label">Entity</label>
            <input
              className="input-field"
              placeholder="truck/T1"
              value={filter.entity}
              onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Event Type</label>
            <select
              className="input-field"
              value={filter.event}
              onChange={(e) => setFilter({ ...filter, event: e.target.value })}
            >
              <option value="">All Events</option>
              {Object.keys(EVENT_COLORS).map((e) => (
                <option key={e} value={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">From</label>
            <input
              type="datetime-local"
              className="input-field"
              value={filter.from}
              onChange={(e) => setFilter({ ...filter, from: e.target.value })}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="datetime-local"
              className="input-field"
              value={filter.to}
              onChange={(e) => setFilter({ ...filter, to: e.target.value })}
            />
          </div>
        </div>
        <button onClick={fetchLogs} className="btn-primary mt-3">
          <Filter size={16} /> Apply
        </button>
      </div>

      {/* Logs table */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-dark-400">{filtered.length} events</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                {['#', 'Timestamp', 'Event', 'Entity', 'Details'].map((h) => (
                  <th key={h} className="text-left p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr key={log.id} className="table-row">
                  <td className="p-3 text-dark-500 text-xs">{log.id}</td>
                  <td className="p-3 font-mono text-dark-400 text-xs">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className={EVENT_COLORS[log.event] || 'badge-inactive'}>
                      {log.event}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-xs text-dark-300">{log.entity}</td>
                  <td className="p-3 text-dark-400">{log.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-8 text-dark-500">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p>No logs found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}