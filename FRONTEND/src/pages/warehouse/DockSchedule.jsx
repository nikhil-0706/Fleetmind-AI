import { useState, useEffect } from 'react'
import { Calendar, Truck, Clock } from 'lucide-react'
import { getWarehouseSchedule } from '../../services/api'
import { getCurrentUser } from '../../services/auth'
import { mockWarehouses } from '../../utils/mockData'
import toast from 'react-hot-toast'

export default function DockSchedule() {
  const [schedule, setSchedule] = useState([])
  const [warehouse, setWarehouse] = useState(null)
  const [loading, setLoading] = useState(false)
  const user = getCurrentUser()
  const warehouseId = user?.id || 'WH_MUM'

  const fetchSchedule = async () => {
    setLoading(true)
    try {
      const res = await getWarehouseSchedule(warehouseId)
      setSchedule(res.data.scheduled || [])
      const wh = mockWarehouses.find(w => w.warehouse_id === warehouseId)
      setWarehouse(wh)
    } catch {
      const wh = mockWarehouses.find(w => w.warehouse_id === warehouseId) || mockWarehouses[0]
      setWarehouse(wh)
      setSchedule(wh.scheduled_trucks || [])
      toast.error('Using mock data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedule()
  }, [])

  // Build time slots from 07:00 to 19:00
  const hours = Array.from({ length: 13 }, (_, i) => `${(i + 7).toString().padStart(2, '0')}:00`)
  const totalDocks = warehouse?.total_docks || 4

  // Helper to convert time string to minutes since 07:00
  const timeToMinutes = (timeStr) => {
    const [h, m] = timeStr.split(':').map(Number)
    return (h - 7) * 60 + m
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-primary">Dock Schedule</h2>
        <p className="text-text-light text-sm">Visual timeline of dock assignments</p>
      </div>

      <div className="card p-5 overflow-x-auto">
        <h3 className="font-semibold text-primary mb-4">Today's Schedule</h3>
        <div className="min-w-max">
          {/* Header row */}
          <div className="flex mb-2">
            <div className="w-24 shrink-0" />
            {hours.map((h) => (
              <div key={h} className="w-20 text-center">
                <span className="text-xs text-text-light">{h}</span>
              </div>
            ))}
          </div>

          {/* Dock rows */}
          {Array.from({ length: totalDocks }, (_, dockIdx) => {
            const dockTrucks = schedule.filter((_, idx) => idx % totalDocks === dockIdx)
            return (
              <div key={dockIdx} className="flex items-center mb-2">
                <div className="w-24 shrink-0 text-sm font-medium text-primary">Dock {dockIdx + 1}</div>
                <div className="relative h-10" style={{ width: `${hours.length * 80}px` }}>
                  {/* Time grid lines */}
                  <div className="absolute inset-0 flex">
                    {hours.map((h) => (
                      <div key={h} className="w-20 h-full border-l border-border" />
                    ))}
                  </div>
                  {/* Truck blocks */}
                  {dockTrucks.map((truck, ti) => {
                    const etaMinutes = timeToMinutes(truck.eta)
                    const left = etaMinutes * (80 / 60)
                    const duration = truck.unloading_duration || 30
                    const width = duration * (80 / 60)
                    return (
                      <div
                        key={ti}
                        className="absolute top-0.5 bg-accent/80 border border-accent rounded flex items-center px-1 text-white text-xs overflow-hidden"
                        style={{ left: `${left}px`, width: `${Math.max(width, 40)}px`, height: '36px' }}
                        title={`${truck.truck_id} @ ${truck.eta}`}
                      >
                        <Truck size={12} className="mr-1 shrink-0" />
                        <span className="truncate">{truck.truck_id}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-text-light mt-4">Each block shows truck ID and unloading duration. Hover for details.</p>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-3">Schedule Summary</h3>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-accent" />
            <span className="text-sm">{schedule.length} trucks scheduled</span>
          </div>
          <div className="flex items-center gap-2">
            <Truck size={14} className="text-secondary" />
            <span className="text-sm">{totalDocks} total docks</span>
          </div>
        </div>
      </div>
    </div>
  )
}