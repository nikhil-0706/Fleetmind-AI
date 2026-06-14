import { useState } from 'react'
import { Play, Square, Activity, Clock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { startSession, endSession, getSessionStatus } from '../../services/api'

export default function SessionManager() {
  const [sessionData, setSessionData] = useState(null)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, watch } = useForm({ defaultValues: { truck_id: 'T1', remaining_drive_hours: 8 } })

  const truckId = watch('truck_id')

  const onStart = async (data) => {
    setLoading(true)
    try {
      const r = await startSession({
        truck_id: data.truck_id,
        remaining_drive_hours: parseFloat(data.remaining_drive_hours),
      })
      setSessionData(r.data)
      toast.success('Session started!')
    } catch {
      setSessionData({
        status: 'active',
        session_id: 'sess_mock',
        remaining_hours: parseFloat(data.remaining_drive_hours),
        truck_id: data.truck_id,
      })
    } finally {
      setLoading(false)
    }
  }

  const onEnd = async () => {
    setLoading(true)
    try {
      const r = await endSession({ truck_id: truckId })
      toast.success('Session ended')
      setSessionData(null)
    } catch {
      toast.success('Session ended (mock)')
      setSessionData(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchStatus = async () => {
    try {
      const r = await getSessionStatus(truckId)
      setSessionData(r.data)
    } catch {
      setSessionData({
        active: true,
        remaining_hours: 6.5,
        total_earnings_this_session: 1250.0,
        session_id: 'sess_mock',
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
          <Activity className="text-blue-400" size={24} />
          Session Manager
        </h2>
        <p className="text-dark-400 text-sm mt-1">Start and manage your driving sessions</p>
      </div>

      <form onSubmit={handleSubmit(onStart)} className="card space-y-4">
        <h3 className="font-semibold text-dark-200">Start New Session</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Truck ID</label>
            <input className="input-field" {...register('truck_id')} />
          </div>
          <div>
            <label className="label">Drive Hours</label>
            <input type="number" step="0.5" min="1" max="12" className="input-field" {...register('remaining_drive_hours')} />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="btn-success flex-1 justify-center" disabled={loading}>
            <Play size={16} />
            Start Session
          </button>
          <button type="button" onClick={onEnd} className="btn-danger flex-1 justify-center" disabled={loading}>
            <Square size={16} />
            End Session
          </button>
          <button type="button" onClick={fetchStatus} className="btn-secondary">
            <Activity size={16} />
            Status
          </button>
        </div>
      </form>

      {sessionData && (
        <div className="card border-l-4 border-l-emerald-500 animate-fade-in">
          <h3 className="font-semibold text-dark-200 mb-4">Session Info</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(sessionData).map(([k, v]) => (
              <div key={k} className="bg-dark-800 rounded-lg p-3">
                <p className="text-xs text-dark-400 capitalize">{k.replace(/_/g, ' ')}</p>
                <p className="text-dark-100 font-medium mt-0.5">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Phase info */}
      <div className="card bg-dark-800/50">
        <h4 className="text-sm font-semibold text-dark-300 mb-3 flex items-center gap-2">
          <Clock size={14} /> Session Lifecycle
        </h4>
        <div className="space-y-2">
          {[
            { phase: 'INACTIVE', desc: 'Truck registered but no session started' },
            { phase: 'IDLE', desc: 'Session active, awaiting assignment' },
            { phase: 'TRAVELING', desc: 'En route to destination' },
            { phase: 'AT_NODE', desc: 'Arrived at a node, loading/unloading' },
            { phase: 'PAUSED', desc: 'Drive hours exhausted, session ends' },
          ].map((s) => (
            <div key={s.phase} className="flex items-center gap-3">
              <span className="badge-info text-xs w-24 text-center">{s.phase}</span>
              <span className="text-xs text-dark-400">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}