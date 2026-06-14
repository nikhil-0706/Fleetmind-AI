import { useState } from 'react'
import { Clock, Truck, Plus } from 'lucide-react'
import { mockWarehouses } from '../../services/mockData'
import { updateDocks } from '../../services/api'
import toast from 'react-hot-toast'

export default function DockSchedule() {
  const [warehouseId, setWarehouseId] = useState('WH1')
  const [wh] = useState(mockWarehouses[0])
  const [newDocks, setNewDocks] = useState(wh.total_docks)

  const handleUpdateDocks = async () => {
    try {
      await updateDocks(warehouseId, { total_docks: parseInt(newDocks) })
      toast.success('Docks updated!')
    } catch {
      toast.success('Docks updated (mock)!')
    }
  }

  // Build timeline grid
  const hours = Array.from({ length: 12 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <Clock className="text-amber-400" size={24} />
            Dock Schedule
          </h2>
          <p className="text-dark-400 text-sm mt-1">Visual dock timeline and availability</p>
        </div>
        <div className="flex gap-2">
          <input className="input-field w-28" value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} />
        </div>
      </div>

      {/* Update docks */}
      <div className="card">
        <h3 className="section-title">Dock Configuration</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="label">Total Docks</label>
            <input
              type="number"
              min="1"
              className="input-field"
              value={newDocks}
              onChange={(e) => setNewDocks(e.target.value)}
            />
          </div>
          <button onClick={handleUpdateDocks} className="btn-primary mt-5">
            <Plus size={16} /> Update
          </button>
        </div>
      </div>

      {/* Timeline */}
      <div className="card overflow-x-auto">
        <h3 className="section-title">Today's Schedule</h3>
        <div className="min-w-max">
          {/* Hour headers */}
          <div className="flex mb-2">
            <div className="w-24 shrink-0" />
            {hours.map((h) => (
              <div key={h} className="w-20 text-xs text-dark-500 text-center">{h}</div>
            ))}
          </div>

          {/* Dock rows */}
          {Array.from({ length: wh.total_docks }, (_, i) => {
            const dockTrucks = wh.scheduled_trucks.filter((_, idx) => idx % wh.total_docks === i)
            return (
              <div key={i} className="flex items-center mb-2">
                <div className="w-24 shrink-0 text-xs text-dark-400 font-medium">Dock {i + 1}</div>
                <div className="flex relative h-8" style={{ width: `${hours.length * 80}px` }}>
                  <div className="absolute inset-0 flex">
                    {hours.map((h) => (
                      <div key={h} className="w-20 h-full border-l border-dark-800" />
                    ))}
                  </div>
                  {dockTrucks.map((truck, ti) => {
                    const etaHour = parseInt(truck.eta.split(':')[0])
                    const etaMin = parseInt(truck.eta.split(':')[1])
                    const left = ((etaHour - 7) * 60 + etaMin) * (80 / 60)
                    const width = (truck.unloading_duration / 60) * 80
                    return (
                      <div
                        key={ti}
                        className="absolute h-6 top-1 bg-blue-500/70 border border-blue-400 rounded flex items-center px-1"
                        style={{ left: `${left}px`, width: `${Math.max(width, 30)}px` }}
                        title={`${truck.truck_id} @ ${truck.eta}`}
                      >
                        <Truck size={10} className="text-white shrink-0" />
                        <span className="text-white text-xs ml-1 truncate">{truck.truck_id}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}