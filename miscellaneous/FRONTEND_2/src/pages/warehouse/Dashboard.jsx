import { useState, useEffect } from 'react';
import { Warehouse, Truck, Package, Clock, Bell, MapPin } from 'lucide-react';
import { getWarehouseDetails, getWarehouseActiveLoads, getWarehouseSchedule, getMap } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import StatCard from '../../components/StatCard';
import StatusBadge from '../../components/StatusBadge';
import MapVisualizer from '../../components/MapVisualizer';
import toast from 'react-hot-toast';

export default function WarehouseDashboard() {
  const [warehouse, setWarehouse] = useState(null);
  const [activeLoads, setActiveLoads] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const warehouseId = user?.id;

  useEffect(() => {
    const fetchData = async () => {
      if (!warehouseId) return;
      try {
        const [whRes, loadsRes, scheduleRes, mapRes] = await Promise.all([
          getWarehouseDetails(warehouseId),
          getWarehouseActiveLoads(warehouseId),
          getWarehouseSchedule(warehouseId),
          getMap()
        ]);
        setWarehouse(whRes.data);
        setActiveLoads(loadsRes.data.loads || []);
        setSchedule(scheduleRes.data.scheduled_trucks || []);
        setMapData(mapRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load warehouse data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, [warehouseId]);

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;
  if (!warehouse) return <div className="p-8 text-center">No warehouse registered. Please register a warehouse first.</div>;

  const activeCount = activeLoads.length;
  const scheduledCount = schedule.length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold text-primary">Warehouse Dashboard</h2><p className="text-text-light text-sm">{warehouse.warehouse_id} – Node {warehouse.node_id}</p></div>
        <button onClick={() => window.location.reload()} className="btn-secondary">Refresh</button>
      </div>

      {/* Map */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><MapPin size={16} /> Location & Incoming Trucks</h3>
        <MapVisualizer
          nodes={mapData.nodes}
          edges={mapData.edges}
          warehouses={[{ node_id: warehouse.node_id }]}
          activeTrucks={schedule.map(s => ({ truck_id: s.truck_id, current_edge_id: null, progress_km: 0 }))}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Warehouse ID" value={warehouse.warehouse_id} icon={Warehouse} />
        <StatCard title="Active Loads" value={activeCount} icon={Package} />
        <StatCard title="Scheduled Trucks" value={scheduledCount} icon={Truck} />
      </div>

      {/* Active Loads Table (paginated) */}
      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4">Active Loads</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr><th className="p-3 text-left">Load ID</th><th>Type</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {activeLoads.length === 0 ? <tr><td colSpan={4} className="p-3 text-center text-text-light">No active loads</td></tr>
              : activeLoads.map(load => (
                <tr key={load.load_id} className="border-b border-border"><td className="p-3 font-mono">{load.load_id}</td><td className="p-3">{load.type}</td><td className="p-3"><StatusBadge status={load.status} /></td><td className="p-3"><button className="btn-outline text-xs py-1">View</button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeLoads.length > 5 && <div className="mt-3 text-right"><button className="text-sm text-accent">Load more →</button></div>}
      </div>

      {/* Notifications (bell already exists in Layout) - placeholder */}
    </div>
  );
}