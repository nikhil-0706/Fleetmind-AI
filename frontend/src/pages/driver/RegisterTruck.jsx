import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Truck, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerTruck } from '../../services/api'

export default function RegisterTruck() {
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        capacity: parseFloat(data.capacity),
        preferred_rs_per_km: parseFloat(data.preferred_rs_per_km),
      }
      await registerTruck(payload)
      toast.success(`Truck ${data.truck_id} registered successfully!`)
      reset()
    } catch {
      // error handled by interceptor
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
          <Truck className="text-blue-400" size={24} />
          Register Truck
        </h2>
        <p className="text-dark-400 text-sm mt-1">Add a new truck to the logistics network</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Truck ID *</label>
            <input
              className="input-field"
              placeholder="e.g. T1"
              {...register('truck_id', { required: 'Required' })}
            />
            {errors.truck_id && <p className="text-red-400 text-xs mt-1">{errors.truck_id.message}</p>}
          </div>

          <div>
            <label className="label">Capacity (Tons) *</label>
            <input
              type="number"
              step="0.1"
              className="input-field"
              placeholder="20"
              {...register('capacity', { required: 'Required', min: 0.1, max: 100 })}
            />
            {errors.capacity && <p className="text-red-400 text-xs mt-1">Valid capacity required</p>}
          </div>

          <div>
            <label className="label">Preferred Rate (₹/km) *</label>
            <input
              type="number"
              step="0.5"
              className="input-field"
              placeholder="45 (capped 0–200)"
              {...register('preferred_rs_per_km', { required: 'Required', min: 0, max: 200 })}
            />
            {errors.preferred_rs_per_km && (
              <p className="text-red-400 text-xs mt-1">Rate must be 0–200 ₹/km</p>
            )}
          </div>

          <div>
            <label className="label">Starting Node ID *</label>
            <input
              className="input-field"
              placeholder="e.g. N1"
              {...register('starting_node_id', { required: 'Required' })}
            />
            {errors.starting_node_id && <p className="text-red-400 text-xs mt-1">{errors.starting_node_id.message}</p>}
          </div>

          <div>
            <label className="label">Available From Time *</label>
            <input
              type="time"
              className="input-field"
              {...register('available_from_time', { required: 'Required' })}
            />
            {errors.available_from_time && <p className="text-red-400 text-xs mt-1">{errors.available_from_time.message}</p>}
          </div>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <p className="text-blue-400 text-sm font-medium">📋 Registration Notes</p>
          <ul className="text-xs text-dark-400 mt-2 space-y-1">
            <li>• Truck will be INACTIVE until driver starts a session</li>
            <li>• Rate is capped between ₹0 – ₹200 per km</li>
            <li>• Starting node must exist in the map</li>
          </ul>
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          <Save size={16} />
          {loading ? 'Registering...' : 'Register Truck'}
        </button>
      </form>
    </div>
  )
}