import { useState } from 'react'
import { Zap, Play, CheckCircle, AlertCircle } from 'lucide-react'
import { forceMatch } from '../../services/api'
import ScoreBar from '../../components/ScoreBar'
import toast from 'react-hot-toast'

export default function Matching() {
  const [truckId, setTruckId] = useState('T1')
  const [loadId, setLoadId] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleMatch = async () => {
    setLoading(true)
    setResult(null)
    try {
      const payload = loadId ? { truck_id: truckId, load_id: loadId } : { truck_id: truckId }
      const r = await forceMatch(payload)
      setResult(r.data)
      toast.success('Match completed!')
    } catch {
      setResult({
        pair_id: 'pair_mock',
        warehouse: 'WH1',
        eta: '15:00',
        utility_score: 74.5,
        truck_score: 78.2,
        load_score: 70.8,
        warehouse_score: 82.1,
        message: 'Mock match result',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
          <Zap className="text-amber-400" size={24} />
          Force Match
        </h2>
        <p className="text-dark-400 text-sm mt-1">Manually trigger truck-load matching via coordinator</p>
      </div>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Truck ID *</label>
            <input className="input-field" value={truckId} onChange={(e) => setTruckId(e.target.value)} placeholder="T1" />
          </div>
          <div>
            <label className="label">Load ID (optional)</label>
            <input className="input-field" value={loadId} onChange={(e) => setLoadId(e.target.value)} placeholder="Leave empty for auto" />
          </div>
        </div>

        <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
          <p className="text-purple-400 text-sm font-medium">🎯 How Force Match Works</p>
          <ul className="text-xs text-dark-400 mt-2 space-y-1">
            <li>1. Coordinator finds nearby loads for truck</li>
            <li>2. Calls Truck Agent + Load Agent for each candidate</li>
            <li>3. Combined score = (truck_score + load_score) / 2</li>
            <li>4. Best match → Warehouse Agent evaluation</li>
            <li>5. Creates TruckLoadPair if warehouse confirms</li>
          </ul>
        </div>

        <button onClick={handleMatch} disabled={loading} className="btn-primary w-full justify-center">
          <Play size={16} />
          {loading ? 'Matching...' : 'Run Match'}
        </button>
      </div>

      {result && (
        <div className={`card animate-fade-in border-l-4 ${result.pair_id ? 'border-l-emerald-500' : 'border-l-red-500'}`}>
          <div className="flex items-center gap-3 mb-4">
            {result.pair_id
              ? <CheckCircle size={20} className="text-emerald-400" />
              : <AlertCircle size={20} className="text-red-400" />
            }
            <h3 className="font-bold text-dark-100">
              {result.pair_id ? 'Match Successful!' : 'Match Failed'}
            </h3>
          </div>

          {result.pair_id && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Pair ID', value: result.pair_id },
                  { label: 'Warehouse', value: result.warehouse },
                  { label: 'ETA', value: result.eta },
                  { label: 'Combined Score', value: result.utility_score?.toFixed(1) },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-dark-800 rounded-lg p-3">
                    <p className="text-xs text-dark-400">{label}</p>
                    <p className="text-dark-100 font-medium mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                {result.truck_score && <ScoreBar label="Truck Agent Score" score={result.truck_score} />}
                {result.load_score && <ScoreBar label="Load Agent Score" score={result.load_score} />}
                {result.warehouse_score && <ScoreBar label="Warehouse Agent Score" score={result.warehouse_score} />}
                {result.utility_score && <ScoreBar label="Combined Utility Score" score={result.utility_score} />}
              </div>
            </div>
          )}

          {result.message && (
            <p className="text-dark-400 text-sm">{result.message}</p>
          )}
        </div>
      )}
    </div>
  )
}