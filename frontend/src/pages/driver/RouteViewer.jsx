import { useState } from 'react'
import { Route, MapPin, Package, Truck, Navigation, Play, CheckCircle } from 'lucide-react'
import { getTruckRoute, depart, arrive, completeDelivery } from '../../services/api'
import toast from 'react-hot-toast'
import MapVisualizer from '../../components/MapVisualizer'

const mockRoute = {
  stops: [
    { node_id: 'N1', type: 'pickup', load_id: 'L1', eta: '10:30', status: 'DONE' },
    { node_id: 'N2', type: 'drop', load_id: 'L1', eta: '13:00', status: 'CURRENT' },
    { node_id: 'N3', type: 'pickup', load_id: 'L4', eta: '15:00', status: 'PENDING' },
    { node_id: 'N5', type: 'drop', load_id: 'L4', eta: '17:30', status: 'PENDING' },
  ],
}

export default function RouteViewer() {
  const [truckId, setTruckId] = useState('T1')
  const [route, setRoute] = useState(mockRoute)
  const [locationData, setLocationData] = useState({ edge_id: 'E1', progress_km: 75 })
  const [loading, setLoading] = useState(false)

  const fetchRoute = async () => {
    try {
      const r = await getTruckRoute(truckId)
      setRoute(r.data)
    } catch {
      toast.error('Using mock route')
    }
  }

  const handleDepart = async () => {
    const nextPending = route.stops.find((s) => s.status === 'PENDING')
    if (!nextPending) return toast.error('No pending stop')
    setLoading(true)
    try {
      await depart(truckId, { to_node_id: nextPending.node_id })
      toast.success(`Departed towards ${nextPending.node_id}`)
    } catch {
      toast.success(`Departed towards ${nextPending.node_id} (mock)`)
    } finally {
      setLoading(false)
    }
  }

  const handleLocationUpdate = async () => {
    try {
      const r = await updateLocation(truckId, locationData)
      toast.success('Location updated')
    } catch {
      toast.success('Location updated (mock)')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <Route className="text-blue-400" size={24} />
            Route Viewer
          </h2>
          <p className="text-dark-400 text-sm mt-1">Track and manage planned stops</p>
        </div>
        <div className="flex gap-2">
          <input className="input-field w-28" value={truckId} onChange={(e) => setTruckId(e.target.value)} />
          <button onClick={fetchRoute} className="btn-primary">
            <Navigation size={16} /> Load Route
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Route stops */}
        <div className="card">
          <h3 className="section-title">Planned Stops</h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-dark-700" />
            <div className="space-y-4">
              {route.stops.map((stop, idx) => (
                <div key={idx} className="flex items-start gap-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center z-10 shrink-0
                    ${stop.status === 'DONE' ? 'bg-emerald-500/20 border-2 border-emerald-500' :
                      stop.status === 'CURRENT' ? 'bg-blue-500/20 border-2 border-blue-500 animate-pulse' :
                      'bg-dark-800 border-2 border-dark-600'}`}>
                    {stop.status === 'DONE'
                      ? <CheckCircle size={16} className="text-emerald-400" />
                      : stop.type === 'pickup'
                        ? <Package size={16} className={stop.status === 'CURRENT' ? 'text-blue-400' : 'text-dark-500'} />
                        : <MapPin size={16} className={stop.status === 'CURRENT' ? 'text-blue-400' : 'text-dark-500'} />
                    }
                  </div>
                  <div className={`flex-1 card-sm ${stop.status === 'CURRENT' ? 'border-blue-500/50' : ''}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-dark-100">{stop.node_id}</p>
                        <p className="text-xs text-dark-400 mt-0.5">
                          {stop.type.toUpperCase()} · Load {stop.load_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-dark-200 font-mono">{stop.eta}</p>
                        <span className={
                          stop.status === 'DONE' ? 'badge-active' :
                          stop.status === 'CURRENT' ? 'badge-info' : 'badge-inactive'
                        }>{stop.status}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button onClick={handleDepart} disabled={loading} className="btn-primary flex-1 justify-center">
              <Play size={16} /> Depart
            </button>
          </div>
        </div>

        {/* Location update + map */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="section-title">Update Location</h3>
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
            <button onClick={handleLocationUpdate} className="btn-secondary mt-3 w-full justify-center">
              <Navigation size={16} /> Update Position
            </button>
          </div>

          <div className="card">
            <h3 className="section-title">Map</h3>
            <MapVisualizer />
          </div>
        </div>
      </div>
    </div>
  )
}