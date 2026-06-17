import { useState, useMemo } from 'react';
import { Truck, Package, Navigation, Clock, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePolling } from '../../hooks/usePolling';
import { getTruckStatus, getPendingDeliveries, getNextAction, getMap, adminGetLoads, adminGetWarehouses } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import MapVisualizer from '../../components/map/MapVisualizer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const { truckId, refreshTruck } = useApp();
  const [truckData, setTruckData] = useState(null);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });
  const [allLoads, setAllLoads] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!truckId) { await refreshTruck(); setLoading(false);return; }
    try {
      const [statusRes, pendingRes, actionRes, mapRes, loadsRes, whRes] = await Promise.all([
        getTruckStatus(truckId),
        getPendingDeliveries(truckId),
        getNextAction(truckId),
        getMap(),
        adminGetLoads(),
        adminGetWarehouses()
      ]);
      setTruckData(statusRes.data);
      setPendingDeliveries(pendingRes.data.pending || []);
      setNextAction(actionRes.data);
      setMapData(mapRes.data);
      setAllLoads(loadsRes.data.loads || []);
      setAllWarehouses(whRes.data.warehouses || []);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 30000, [truckId]);

  const nearbyLoads = useMemo(() => {
    if (!truckData) return [];
    return allLoads.filter(l => l.status === 'PENDING').slice(0, 10);
  }, [allLoads, truckData]);

  if (loading) return <LoadingSpinner />;
  if (!truckData) return <div className="p-8 text-center">No truck registered. Please register a truck first.</div>;

  const activeSession = truckData.status !== 'INACTIVE';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-primary">Driver Dashboard</h2><p className="text-text-light text-sm">Monitor your truck and active deliveries</p></div>
        <button onClick={fetchData} className="btn-secondary"><Activity size={16} /> Refresh</button>
      </div>
      <div className="card border-l-4 border-l-accent p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl"><Truck size={28} className="text-accent" /></div>
            <div><h3 className="text-xl font-bold text-primary">{truckData.truck_id}</h3><StatusBadge status={truckData.status} /></div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-light">Current Location</p>
            <p className="font-mono text-sm">{truckData.current_node_id || truckData.current_edge_id || '—'}</p>
            {truckData.progress_km !== undefined && <p className="text-xs text-text-light mt-1">Progress: {truckData.progress_km.toFixed(1)} km</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div><div className="flex justify-between text-sm mb-1"><span className="text-text-light">Capacity Remaining</span><span className="font-medium">{truckData.remaining_capacity}T</span></div><div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${(truckData.remaining_capacity / 20) * 100}%` }} /></div></div>
          <div><div className="flex justify-between text-sm mb-1"><span className="text-text-light">Active Pairs</span><span className="font-medium">{pendingDeliveries.length}</span></div></div>
        </div>
      </div>
      {nextAction && nextAction.action !== 'wait' && (
        <div className="card p-4 bg-accent/10 border-accent">
          <p className="text-sm font-semibold text-primary">Suggested Next Action</p>
          <p className="text-sm">{nextAction.action === 'pickup' ? `Pickup load ${nextAction.load_id} at ${nextAction.target_node_id}` : nextAction.action === 'drop' ? `Deliver load ${nextAction.load_id} at ${nextAction.target_node_id}` : nextAction.action}</p>
        </div>
      )}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2">Live Map</h3>
        <MapVisualizer
          nodes={mapData.nodes}
          edges={mapData.edges}
          trucks={truckData ? [{ truck_id: truckData.truck_id, current_node_id: truckData.current_node_id, current_edge_id: truckData.current_edge_id, progress_km: truckData.progress_km, status: truckData.status }] : []}
          warehouses={allWarehouses.map(w => ({ warehouse_id: w.warehouse_id, node_id: w.node_id }))}
          loads={nearbyLoads.map(l => ({ load_id: l.load_id, pickup_node_id: l.pickup_node_id, status: l.status }))}
          role="driver"
        />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Remaining Capacity" value={`${truckData.remaining_capacity}T`} icon={Package} />
        <StatCard title="Active Pairs" value={pendingDeliveries.length} icon={Navigation} />
        <StatCard title="Next Stop" value={nextAction?.target_node_id || '—'} icon={Navigation} />
        <StatCard title="Status" value={truckData.status} icon={Clock} />
      </div>
      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4">Pending Deliveries</h3>
        {!activeSession ? <div className="text-center py-8 text-text-light"><Package size={32} className="mx-auto mb-2 opacity-50" /><p>Start a session first to see pending deliveries.</p></div>
        : pendingDeliveries.length === 0 ? <div className="text-center py-8 text-text-light"><Package size={32} className="mx-auto mb-2 opacity-50" /><p>No pending deliveries.</p></div>
        : <div className="space-y-3">{pendingDeliveries.map(pair => (<div key={pair.pair_id} className="card-sm"><p className="font-mono text-sm">Pair ID: {pair.pair_id}</p><p className="text-xs text-text-light">Load: {pair.load_id} | From {pair.pickup_node_id} → {pair.drop_node_id}</p></div>))}</div>}
      </div>
    </div>
  );
}