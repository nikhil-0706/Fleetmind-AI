import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerTruck } from '../../services/api'
import { getCurrentUser } from '../../services/auth'

export default function RegisterTruck() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const user = getCurrentUser()

  const onSubmit = async (data) => {
  setLoading(true)
  let payload
  try {
    payload = {
      truck_id: data.truck_id,
      driver_id: user?.id || 'DRV_001',
      remaining_capacity: parseFloat(data.capacity),      // renamed
      preferred_rs_per_km: parseFloat(data.preferred_rate),
      current_node_id: data.start_node,                  // renamed
      // available_from_time is not used by backend – omit it
      remaining_drive_hours: 8,                           // default, can be set later in session
      status: "INACTIVE"
    }
    await registerTruck(payload)
    toast.success(`Truck ${data.truck_id} registered successfully!`)
    reset()
  } catch (err) {
    toast.error('Registration failed. Using mock fallback.')
    if (payload) localStorage.setItem('fleetmind_truck', JSON.stringify(payload))
    toast.success('Mock registration stored locally')
  } finally {
    setLoading(false)
  }
}
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Register Truck</h2>
        <p className="text-text-light text-sm">Add a new truck to your fleet</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Truck ID *</label>
            <input className="input-field" placeholder="e.g. T1" {...register('truck_id', { required: 'Required' })} />
            {errors.truck_id && <p className="text-red-500 text-xs mt-1">{errors.truck_id.message}</p>}
          </div>
          <div>
            <label className="label">Capacity (tons) *</label>
            <input type="number" step="0.1" className="input-field" placeholder="20" {...register('capacity', { required: 'Required', min: 0.1, max: 100 })} />
            {errors.capacity && <p className="text-red-500 text-xs mt-1">Valid capacity required</p>}
          </div>
          <div>
            <label className="label">Preferred Rate (₹/km) *</label>
            <input type="number" step="0.5" className="input-field" placeholder="45 (0–200)" {...register('preferred_rate', { required: 'Required', min: 0, max: 200 })} />
            {errors.preferred_rate && <p className="text-red-500 text-xs mt-1">Rate must be 0–200</p>}
          </div>
          <div>
            <label className="label">Starting Node ID *</label>
            <input className="input-field" placeholder="e.g. N1" {...register('start_node', { required: 'Required' })} />
            {errors.start_node && <p className="text-red-500 text-xs mt-1">{errors.start_node.message}</p>}
          </div>
          <div>
            <label className="label">Available From Time *</label>
            <input type="time" className="input-field" {...register('available_from', { required: 'Required' })} />
            {errors.available_from && <p className="text-red-500 text-xs mt-1">{errors.available_from.message}</p>}
          </div>
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          <Save size={16} />
          {loading ? 'Registering...' : 'Register Truck'}
        </button>
      </form>
    </div>
  )
}