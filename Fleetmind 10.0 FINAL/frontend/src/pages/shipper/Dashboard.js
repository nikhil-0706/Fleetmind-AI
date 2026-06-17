import { useState } from 'react';
import { Package, TrendingUp, Clock, CheckCircle, MapPin } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { usePolling } from '../../hooks/usePolling';
import { getShipperLoads, getMap, adminGetWarehouses } from '../../services/api';
import StatCard from '../../components/common/StatCard';
import StatusBadge from '../../components/common/StatusBadge';
import MapVisualizer from '../../components/map/MapVisualizer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function ShipperDashboard() {
  const { user } = useApp();
  const [loads, setLoads] = useState([]);
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [loadsRes, mapRes, whRes] = await Promise.all([
        getShipperLoads(user.id),
        getMap(),
        adminGetWarehouses()
      ]);
      setLoads(loadsRes.data.loads || []);
      setMapData(mapRes.data);
      setAllWarehouses(whRes.data.warehouses || []);
    } catch (err) {
      if (err.response?.status !== 404) toast.error('Failed to load dashboard');
    } finally { setLoading(false); }
  };

  usePolling(fetchData, 30000, [user]);

  if (loading) return <LoadingSpinner />;

  const stats = {
    total: loads.length,
    enRoute: loads.filter(l => l.status === 'ASSIGNED' || l.status === 'PICKED_UP').length,
    waiting: loads.filter(l => l.status === 'PENDING').length,
    delivered: loads.filter(l => l.status === 'DELIVERED').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-primary">Shipper Dashboard</h2><p className="text-text-light text-sm">Manage your loads and track shipments</p></div>
        <button onClick={fetchData} className="btn-secondary">Refresh</button>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><MapPin size={16} /> Live Shipment Map</h3>
        <MapVisualizer
          nodes={mapData.nodes}
          edges={mapData.edges}
          warehouses={allWarehouses.map(w => ({ warehouse_id: w.warehouse_id, node_id: w.node_id }))}
          loads={loads.map(l => ({ load_id: l.load_id, pickup_node_id: l.pickup_node_id, status: l.status }))}
          role="shipper"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Loads" value={stats.total} icon={Package} />
        <StatCard title="En Route" value={stats.enRoute} icon={TrendingUp} />
        <StatCard title="Waiting" value={stats.waiting} icon={Clock} />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-3">Recent Loads</h3>
        {loads.length === 0 ? (
          <p className="text-text-light">No loads registered yet.</p>
        ) : (
          <div className="space-y-2">
            {loads.slice(0, 5).map(l => (
              <div key={l.load_id} className="flex justify-between items-center border-b border-border py-2">
                <div><span className="font-mono">{l.load_id}</span><span className="ml-3 text-xs text-text-light">{l.pickup_node_id} → {l.drop_node_id}</span></div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}