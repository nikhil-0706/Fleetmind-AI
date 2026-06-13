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
      const res = await startSession({
        truck_id: data.truck_id,
        remaining_drive_hours: parseFloat(data.remaining_drive_hours),
      })
      setSessionData(res.data)
      toast.success('Session started!')
    } catch {
      setSessionData({
        status: 'active',
        session_id: 'sess_mock',
        remaining_hours: parseFloat(data.remaining_drive_hours),
        truck_id: data.truck_id,
      })
      toast.success('Session started (mock)')
    } finally {
      setLoading(false)
    }
  }

  const onEnd = async () => {
    setLoading(true)
    try {
      await endSession({ truck_id: truckId })
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
      const res = await getSessionStatus(truckId)
      setSessionData(res.data)
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
        <h2 className="text-2xl font-bold text-primary">Session Manager</h2>
        <p className="text-text-light text-sm">Start and manage your driving sessions</p>
      </div>

      <form onSubmit={handleSubmit(onStart)} className="card p-6 space-y-4">
        <h3 className="font-semibold text-primary">Start New Session</h3>
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
          <button type="submit" className="btn-primary flex-1 justify-center" disabled={loading}>
            <Play size={16} />
            Start Session
          </button>
          <button type="button" onClick={onEnd} className="btn-outline flex-1 justify-center" disabled={loading}>
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
        <div className="card border-l-4 border-l-accent p-5 animate-fade-in">
          <h3 className="font-semibold text-primary mb-4">Session Info</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(sessionData).map(([k, v]) => (
              <div key={k} className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-text-light capitalize">{k.replace(/_/g, ' ')}</p>
                <p className="font-medium mt-0.5">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card bg-secondary/5 p-5">
        <h4 className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
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
              <span className="text-xs text-text-light">{s.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}