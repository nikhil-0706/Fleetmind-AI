import { useState, useEffect } from 'react';
import { Package, TrendingUp, Clock, CheckCircle, Bell, MapPin } from 'lucide-react';
import { getShipperLoads, getShipperMapData, getMap } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import MapVisualizer from '../../components/MapVisualizer';
import toast from 'react-hot-toast';

export default function ShipperDashboard() {
  const [loads, setLoads] = useState([]);
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });
  const [mapOverlay, setMapOverlay] = useState({ pickupWarehouses: [], dropWarehouses: [], trucks: [] });
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const shipperId = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!shipperId) return;
      try {
        const [loadsRes, mapBaseRes, overlayRes] = await Promise.all([
          getShipperLoads(shipperId),
          getMap(),
          getShipperMapData(shipperId)
        ]);
        setLoads(loadsRes.data.loads);
        setMapData(mapBaseRes.data);
        setMapOverlay(overlayRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [shipperId]);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

  const stats = {
    total: loads.length,
    enRoute: loads.filter(l => l.status === 'EN_ROUTE' || l.status === 'ASSIGNED').length,
    waiting: loads.filter(l => l.status === 'PENDING' || l.status === 'WAITING').length,
    delivered: loads.filter(l => l.status === 'DELIVERED').length,
  };

  // Priority loads: near deadline, delayed, near finish
  const now = new Date();
  const priorityLoads = loads.filter(l => {
    if (!l.delivery_deadline) return false;
    const [h,m] = l.delivery_deadline.split(':');
    const deadline = new Date(); deadline.setHours(parseInt(h), parseInt(m), 0);
    const diff = (deadline - now) / 60000;
    return diff < 60 || l.status === 'DELAYED' || (l.status === 'EN_ROUTE' && diff < 30);
  }).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-primary">Shipper Dashboard</h2><p className="text-text-light text-sm">Manage your loads and track shipments</p></div>
        <button onClick={() => window.location.reload()} className="btn-secondary">Refresh</button>
      </div>

      {/* Map */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><MapPin size={16} /> Live Shipment Map</h3>
        <MapVisualizer
          nodes={mapData.nodes}
          edges={mapData.edges}
          warehouses={mapOverlay.pickupWarehouses?.map(n => ({ node_id: n })) || []}
          loads={loads.map(l => ({ load_id: l.load_id, pickup_node_id: l.pickup_node_id }))}
          activeTrucks={mapOverlay.trucks?.map(t => ({ truck_id: t.truck_id, current_edge_id: t.current_edge_id, progress_km: t.progress_km })) || []}
        />
      </div>

      {/* Priority Cards */}
      {priorityLoads.length > 0 && (
        <div className="card p-4">
          <h3 className="font-semibold text-primary mb-3">Important Loads</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {priorityLoads.map(load => (
              <div key={load.load_id} className="card-sm border-l-4 border-l-accent cursor-pointer hover:shadow-md transition">
                <div className="flex justify-between items-start"><p className="font-bold">{load.load_id}</p><StatusBadge status={load.status} /></div>
                <p className="text-xs text-text-light">{load.pickup_node_id} → {load.drop_node_id}</p>
                <p className="text-xs text-accent mt-1">Deadline: {load.delivery_deadline}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Loads" value={stats.total} icon={Package} />
        <StatCard title="En Route" value={stats.enRoute} icon={TrendingUp} />
        <StatCard title="Waiting" value={stats.waiting} icon={Clock} />
        <StatCard title="Delivered" value={stats.delivered} icon={CheckCircle} />
      </div>

      {/* Activity Feed (recent events) */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><Bell size={16} /> Recent Activity</h3>
        <div className="max-h-40 overflow-y-auto space-y-1 text-sm">
          {loads.slice(0,5).map(l => (
            <div key={l.load_id} className="border-b border-border py-1">Load {l.load_id} – {l.status}</div>
          ))}
          {loads.length === 0 && <p className="text-text-light">No activity</p>}
        </div>
      </div>
    </div>
  );
}