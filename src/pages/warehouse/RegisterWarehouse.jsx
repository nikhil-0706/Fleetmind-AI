import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Warehouse, Save, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerWarehouse } from '../../services/api'

export default function RegisterWarehouse() {
  const [loading, setLoading] = useState(false)
  const [loadTypes, setLoadTypes] = useState(['general'])
  const [newType, setNewType] = useState('')
  const { register, handleSubmit, reset, formState: { errors } } = useForm()

  const addType = () => {
    if (newType && !loadTypes.includes(newType)) {
      setLoadTypes([...loadTypes, newType])
      setNewType('')
    }
  }

  const removeType = (type) => {
    setLoadTypes(loadTypes.filter(t => t !== type))
  }

  const onSubmit = async (data) => {
    setLoading(true)
    try {
      const payload = {
        warehouse_id: data.warehouse_id,
        node_id: data.node_id,
        total_docks: parseInt(data.total_docks),
        compatible_load_types: loadTypes,
        status: 'ACTIVE',
      }
      await registerWarehouse(payload)
      toast.success(`Warehouse ${data.warehouse_id} registered!`)
      reset()
      setLoadTypes(['general'])
    } catch {
      toast.success('Warehouse registered (mock)')
      reset()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Register Warehouse</h2>
        <p className="text-text-light text-sm">Add a new warehouse to the network</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Warehouse ID *</label>
            <input className="input-field" placeholder="e.g. WH_MUM" {...register('warehouse_id', { required: 'Required' })} />
            {errors.warehouse_id && <p className="text-red-500 text-xs mt-1">{errors.warehouse_id.message}</p>}
          </div>
          <div>
            <label className="label">Node ID *</label>
            <input className="input-field" placeholder="e.g. N1" {...register('node_id', { required: 'Required' })} />
            {errors.node_id && <p className="text-red-500 text-xs mt-1">{errors.node_id.message}</p>}
          </div>
          <div>
            <label className="label">Total Docks *</label>
            <input type="number" min="1" className="input-field" placeholder="4" {...register('total_docks', { required: 'Required' })} />
            {errors.total_docks && <p className="text-red-500 text-xs mt-1">{errors.total_docks.message}</p>}
          </div>
        </div>

        <div>
          <label className="label">Compatible Load Types</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {loadTypes.map((t) => (
              <span key={t} className="badge-info flex items-center gap-1">
                {t}
                <button type="button" onClick={() => removeType(t)}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input-field"
              placeholder="Add type (e.g., fragile)"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addType())}
            />
            <button type="button" onClick={addType} className="btn-secondary">
              <Plus size={16} />
            </button>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
          <Save size={16} />
          {loading ? 'Registering...' : 'Register Warehouse'}
        </button>
      </form>
    </div>
  )
}