import { useState, useEffect } from 'react';
import { Truck, Clock, Package, Navigation, Activity } from 'lucide-react';
import { getDriverTruck, getTruckStatus, getPendingDeliveries, getNextAction } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import MapVisualizer from '../../components/MapVisualizer';
import { getMap } from '../../services/api';
import toast from 'react-hot-toast';

export default function DriverDashboard() {
  const [truckId, setTruckId] = useState(null);
  const [truckData, setTruckData] = useState(null);
  const [pendingDeliveries, setPendingDeliveries] = useState([]);
  const [nextAction, setNextAction] = useState(null);
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Get truck ID for this driver
        const truckRes = await getDriverTruck(user.id);
        const tid = truckRes.data.truck_id;
        setTruckId(tid);

        // Fetch truck status
        const statusRes = await getTruckStatus(tid);
        setTruckData(statusRes.data);

        // Fetch pending deliveries
        const pendingRes = await getPendingDeliveries(tid);
        setPendingDeliveries(pendingRes.data.pending || []);

        // Fetch next action from backhaul agent
        const actionRes = await getNextAction(tid);
        setNextAction(actionRes.data);

        // Fetch map data
        const mapRes = await getMap();
        setMapData(mapRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!truckData) return <div className="p-8 text-center">No truck registered. Please register a truck first.</div>;

  const activeSession = truckData.status !== 'INACTIVE';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Driver Dashboard</h2>
          <p className="text-text-light text-sm">Monitor your truck and active deliveries</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-secondary">
          <Activity size={16} /> Refresh
        </button>
      </div>

      {/* Status Card */}
      <div className="card border-l-4 border-l-accent p-5">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-xl"><Truck size={28} className="text-accent" /></div>
            <div><h3 className="text-xl font-bold text-primary">{truckData.truck_id}</h3><StatusBadge status={truckData.status} /></div>
          </div>
          <div className="text-right">
            <p className="text-xs text-text-light">Current Edge / Node</p>
            <p className="font-mono text-sm">{truckData.current_edge_id || truckData.current_node_id || '—'}</p>
            {truckData.progress_km !== undefined && <p className="text-xs text-text-light mt-1">Progress: {truckData.progress_km} km</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6 mt-6">
          <div><div className="flex justify-between text-sm mb-1"><span className="text-text-light">Capacity Remaining</span><span className="font-medium">{truckData.remaining_capacity}T</span></div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${(truckData.remaining_capacity / 20) * 100}%` }} /></div></div>
          <div><div className="flex justify-between text-sm mb-1"><span className="text-text-light">Active Pairs</span><span className="font-medium">{pendingDeliveries.length}</span></div></div>
        </div>
      </div>

      {/* Next Action Suggestion */}
      {nextAction && nextAction.action !== 'wait' && (
        <div className="card p-4 bg-accent/10 border-accent">
          <p className="text-sm font-semibold text-primary">Suggested Next Action</p>
          <p className="text-sm">{nextAction.action === 'pickup' ? `Pickup load ${nextAction.load_id} at ${nextAction.target_node_id}` : nextAction.action === 'drop' ? `Deliver load ${nextAction.load_id} at ${nextAction.target_node_id}` : nextAction.action}</p>
        </div>
      )}

      {/* Map */}
      <div className="card p-4"><h3 className="font-semibold text-primary mb-2">Live Map</h3><MapVisualizer nodes={mapData.nodes} edges={mapData.edges} activeTrucks={truckData ? [{ truck_id: truckData.truck_id, current_edge_id: truckData.current_edge_id, progress_km: truckData.progress_km }] : []} /></div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Remaining Capacity" value={`${truckData.remaining_capacity}T`} icon={Package} />
        <StatCard title="Active Pairs" value={pendingDeliveries.length} icon={Navigation} />
        <StatCard title="Next Stop" value={truckData.next_destination || '—'} icon={Navigation} />
        <StatCard title="Status" value={truckData.status} icon={Clock} />
      </div>

      {/* Pending Deliveries */}
      <div className="card">
        <h3 className="font-semibold text-primary mb-4">Pending Deliveries</h3>
        {!activeSession ? <div className="text-center py-8 text-text-light"><Package size={32} className="mx-auto mb-2 opacity-50" /><p>Start a session first to see pending deliveries.</p></div>
        : pendingDeliveries.length === 0 ? <div className="text-center py-8 text-text-light"><Package size={32} className="mx-auto mb-2 opacity-50" /><p>No pending deliveries.</p></div>
        : <div className="space-y-3">{pendingDeliveries.map(pair => (<div key={pair.pair_id} className="card-sm"><p className="font-mono text-sm">Pair ID: {pair.pair_id}</p><p className="text-xs text-text-light">Load: {pair.load_id} | From {pair.pickup_node_id} → {pair.drop_node_id}</p></div>))}</div>}
      </div>
    </div>
  );
}