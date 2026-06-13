import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Warehouse, Save, Plus, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { registerWarehouse } from '../../services/api'

export default function RegisterWarehouse() {
  const [loading, setLoading] = useState(false)
  const [loadTypes, setLoadTypes] = useState(['general'])
  const [newType, setNewType] = useState('')
  const { register, handleSubmit, reset } = useForm()

  const addType = () => {
    if (newType && !loadTypes.includes(newType)) {
      setLoadTypes([...loadTypes, newType])
      setNewType('')
    }
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
    } catch {} finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
          <Warehouse className="text-amber-400" size={24} />
          Register Warehouse
        </h2>
        <p className="text-dark-400 text-sm mt-1">Add a new warehouse node to the network</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Warehouse ID *</label>
            <input className="input-field" placeholder="e.g. WH1" {...register('warehouse_id', { required: true })} />
          </div>
          <div>
            <label className="label">Node ID *</label>
            <input className="input-field" placeholder="e.g. N3" {...register('node_id', { required: true })} />
          </div>
          <div>
            <label className="label">Total Docks *</label>
            <input type="number" min="1" className="input-field" placeholder="4" {...register('total_docks', { required: true })} />
          </div>
        </div>

        <div>
          <label className="label">Compatible Load Types</label>
          <div className="flex gap-2 flex-wrap mb-2">
            {loadTypes.map((t) => (
              <span key={t} className="badge-info flex items-center gap-1">
                {t}
                <button type="button" onClick={() => setLoadTypes(loadTypes.filter((x) => x !== t))}>
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="input-field"
              placeholder="Add type..."
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