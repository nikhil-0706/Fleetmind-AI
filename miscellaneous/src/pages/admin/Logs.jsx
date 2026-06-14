import { useState } from 'react'
import { FileText, Download, Filter, RefreshCw } from 'lucide-react'
import { getLogs, exportLogs } from '../../services/api'
import toast from 'react-hot-toast'

export default function Logs() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState({ entity: '', event: '' })
  const [loading, setLoading] = useState(false)

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await getLogs(filter)
      setLogs(res.data.logs || [])
      toast.success('Logs loaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load logs')
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const res = await exportLogs()
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'logs.csv'
      a.click()
      toast.success('Logs exported')
    } catch (err) {
      console.error(err)
      toast.error('Export failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
            <FileText className="text-accent" size={24} />
            System Logs
          </h2>
          <p className="text-text-light text-sm">Audit trail of all system events</p>
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
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-text-light" />
          <span className="text-sm font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Entity</label>
            <input
              className="input-field"
              placeholder="e.g., truck/T1"
              value={filter.entity}
              onChange={(e) => setFilter({ ...filter, entity: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Event Type</label>
            <input
              className="input-field"
              placeholder="e.g., DEPART"
              value={filter.event}
              onChange={(e) => setFilter({ ...filter, event: e.target.value.toUpperCase() })}
            />
          </div>
        </div>
        <button onClick={fetchLogs} className="btn-secondary mt-3">Apply Filters</button>
      </div>

      {/* Logs Table */}
      <div className="card p-5 overflow-x-auto">
        <div className="text-sm text-text-light mb-2">{logs.length} events</div>
        {logs.length === 0 ? (
          <div className="text-center py-8 text-text-light">No logs found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Time</th>
                <th className="text-left p-3">Event</th>
                <th className="text-left p-3">Entity</th>
                <th className="text-left p-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log, idx) => (
                <tr key={idx} className="border-b border-border">
                  <td className="p-3 text-xs font-mono">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="p-3"><span className="badge-info text-xs">{log.event_type}</span></td>
                  <td className="p-3 font-mono text-xs">{log.entity_id}</td>
                  <td className="p-3 text-text-light text-xs">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}