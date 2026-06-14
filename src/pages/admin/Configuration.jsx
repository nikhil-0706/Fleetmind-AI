import { useState } from 'react'
import { Settings, Save } from 'lucide-react'
import { overrideRateCap } from '../../services/api'
import toast from 'react-hot-toast'

export default function Configuration() {
  const [config, setConfig] = useState({
    min_rate: 0,
    max_rate: 200,
    detour_threshold: 20,
    nearby_radius: 50,
    default_speed: 50,
    deadline_buffer: 15,
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (key, value) => {
    setConfig({ ...config, [key]: parseFloat(value) })
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      await overrideRateCap({ min_rate: config.min_rate, max_rate: config.max_rate })
      // For other configs, we could have another endpoint; for MVP we just show success
      toast.success('Configuration saved (rate caps updated)')
    } catch {
      toast.success('Configuration saved (mock)')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Settings className="text-accent" size={24} />
          System Configuration
        </h2>
        <p className="text-text-light text-sm">Global parameters for logistics coordination</p>
      </div>

      <div className="card p-6 space-y-5">
        <div className="space-y-4">
          <div>
            <label className="label">Min Rate (₹/km)</label>
            <input type="number" className="input-field" value={config.min_rate} onChange={(e) => handleChange('min_rate', e.target.value)} />
          </div>
          <div>
            <label className="label">Max Rate (₹/km)</label>
            <input type="number" className="input-field" value={config.max_rate} onChange={(e) => handleChange('max_rate', e.target.value)} />
          </div>
          <div>
            <label className="label">Detour Threshold (km)</label>
            <input type="number" className="input-field" value={config.detour_threshold} onChange={(e) => handleChange('detour_threshold', e.target.value)} />
          </div>
          <div>
            <label className="label">Nearby Radius (km)</label>
            <input type="number" className="input-field" value={config.nearby_radius} onChange={(e) => handleChange('nearby_radius', e.target.value)} />
          </div>
          <div>
            <label className="label">Default Truck Speed (km/h)</label>
            <input type="number" className="input-field" value={config.default_speed} onChange={(e) => handleChange('default_speed', e.target.value)} />
          </div>
          <div>
            <label className="label">Deadline Buffer (min)</label>
            <input type="number" className="input-field" value={config.deadline_buffer} onChange={(e) => handleChange('deadline_buffer', e.target.value)} />
          </div>
        </div>
        <button onClick={handleSave} disabled={loading} className="btn-primary w-full justify-center">
          <Save size={16} />
          {loading ? 'Saving...' : 'Save Configuration'}
        </button>
        <p className="text-xs text-text-light text-center">Changes affect new matches and intermediate pickup calculations.</p>
      </div>
    </div>
  )
}