import { useState } from 'react'
import { MapPin, Package, Navigation, Play, CheckCircle } from 'lucide-react'
import { getTruckRoute, depart, updateLocation, arrive, completeDelivery } from '../../services/api'
import toast from 'react-hot-toast'
import StatusBadge from '../../components/StatusBadge'

export default function RouteViewer() {
  const [truckId, setTruckId] = useState('')
  const [route, setRoute] = useState({ stops: [] })
  const [locationData, setLocationData] = useState({ edge_id: '', progress_km: 0 })
  const [loading, setLoading] = useState(false)

  const fetchRoute = async () => {
    if (!truckId) {
      toast.error('Enter a Truck ID')
      return
    }
    setLoading(true)
    try {
      const res = await getTruckRoute(truckId)
      setRoute(res.data)
      toast.success('Route loaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load route')
      setRoute({ stops: [] })
    } finally {
      setLoading(false)
    }
  }

  const handleDepart = async () => {
    const nextPending = route.stops.find((s) => s.status === 'PENDING')
    if (!nextPending) return toast.error('No pending stop')
    setLoading(true)
    try {
      await depart(truckId, { to_node_id: nextPending.node_id })
      toast.success(`Departed towards ${nextPending.node_id}`)
      fetchRoute()
    } catch (err) {
      console.error(err)
      toast.error('Depart failed')
    } finally {
      setLoading(false)
    }
  }

  const handleLocationUpdate = async () => {
    if (!locationData.edge_id) {
      toast.error('Enter edge ID')
      return
    }
    try {
      await updateLocation(truckId, locationData)
      toast.success('Location updated')
      fetchRoute()
    } catch (err) {
      console.error(err)
      toast.error('Location update failed')
    }
  }

  const handleArrive = async (nodeId) => {
    try {
      await arrive(truckId, { node_id: nodeId })
      toast.success(`Arrived at ${nodeId}`)
      fetchRoute()
    } catch (err) {
      console.error(err)
      toast.error('Arrive failed')
    }
  }

  const handleCompleteDelivery = async (pairId) => {
    try {
      await completeDelivery({ truck_id: truckId, pair_id: pairId })
      toast.success('Delivery completed')
      fetchRoute()
    } catch (err) {
      console.error(err)
      toast.error('Completion failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Route Viewer</h2>
          <p className="text-text-light text-sm">Track and manage planned stops</p>
        </div>
        <div className="flex gap-2">
          <input className="input-field w-28" value={truckId} onChange={(e) => setTruckId(e.target.value)} placeholder="Truck ID" />
          <button onClick={fetchRoute} className="btn-primary">
            <Navigation size={16} /> Load Route
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route stops */}
        <div className="card p-5">
          <h3 className="font-semibold text-primary mb-4">Planned Stops</h3>
          {route.stops.length === 0 ? (
            <div className="text-center py-8 text-text-light">No route data – start a session and accept a proposal first.</div>
          ) : (
            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-4">
                {route.stops.map((stop, idx) => (
                  <div key={idx} className="flex items-start gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0
                      ${stop.status === 'DONE' ? 'bg-emerald-100 border-2 border-emerald-500' :
                        stop.status === 'CURRENT' ? 'bg-accent/20 border-2 border-accent' :
                        'bg-gray-100 border-2 border-border'}`}>
                      {stop.status === 'DONE'
                        ? <CheckCircle size={16} className="text-emerald-600" />
                        : stop.type === 'pickup'
                          ? <Package size={16} className={stop.status === 'CURRENT' ? 'text-accent' : 'text-text-light'} />
                          : <MapPin size={16} className={stop.status === 'CURRENT' ? 'text-accent' : 'text-text-light'} />
                      }
                    </div>
                    <div className={`flex-1 card-sm ${stop.status === 'CURRENT' ? 'border-accent' : ''}`}>
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <p className="font-semibold text-primary">{stop.node_id}</p>
                          <p className="text-xs text-text-light mt-0.5">
                            {stop.type.toUpperCase()} · Load {stop.load_id}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-mono">{stop.eta}</p>
                          <StatusBadge status={stop.status} />
                        </div>
                      </div>
                      {stop.status === 'CURRENT' && stop.type === 'drop' && (
                        <button onClick={() => handleCompleteDelivery(`pair_${stop.load_id}`)} className="btn-primary text-sm mt-2 w-full">
                          Complete Delivery
                        </button>
                      )}
                      {stop.status === 'CURRENT' && (
                        <button onClick={() => handleArrive(stop.node_id)} className="btn-secondary text-sm mt-2 w-full">
                          Arrive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button onClick={handleDepart} disabled={loading} className="btn-primary w-full mt-4 justify-center">
            <Play size={16} /> Depart
          </button>
        </div>

        {/* Location update */}
        <div className="space-y-4">
          <div className="card p-5">
            <h3 className="font-semibold text-primary mb-4">Update Location</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Edge ID</label>
                <input
                  className="input-field"
                  value={locationData.edge_id}
                  onChange={(e) => setLocationData({ ...locationData, edge_id: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Progress (km)</label>
                <input
                  type="number"
                  className="input-field"
                  value={locationData.progress_km}
                  onChange={(e) => setLocationData({ ...locationData, progress_km: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <button onClick={handleLocationUpdate} className="btn-secondary w-full mt-3 justify-center">
              <Navigation size={16} /> Update Position
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}