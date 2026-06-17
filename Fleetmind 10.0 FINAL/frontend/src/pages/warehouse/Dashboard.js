import { useState } from 'react';
import { Warehouse, Package, Truck, MapPin } from 'lucide-react';
import { usePolling } from '../../hooks/usePolling';
import { getWarehouseDetails, getWarehouseActiveLoads, getWarehouseSchedule, getMap } from '../../services/api';
import { getCurrentUser } from '../../services/auth'; // <-- use this
import StatCard from '../../components/common/StatCard';
import MapVisualizer from '../../components/map/MapVisualizer';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function WarehouseDashboard() {
  // Read user directly from localStorage
  const user = getCurrentUser();
  const warehouseId = user?.id;

  const [warehouse, setWarehouse] = useState(null);
  const [activeLoads, setActiveLoads] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [mapData, setMapData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!warehouseId) {
      setLoading(false);
      return;
    }
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
      if (err.response?.status === 404) {
        setWarehouse(null);
      } else {
        toast.error('Failed to load warehouse data');
      }
    } finally {
      setLoading(false);
    }
  };

  usePolling(fetchData, 30000, [warehouseId]);

  if (loading) return <LoadingSpinner />;
  if (!warehouse) {
    return (
      <div className="p-8 text-center">
        <p className="text-lg text-text-light">No warehouse registered.</p>
        <p className="text-sm text-text-light mt-2">Please register a warehouse from the sidebar.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-primary">Warehouse Dashboard</h2>
          <p className="text-text-light text-sm">{warehouse.warehouse_id} – Node {warehouse.node_id}</p>
        </div>
        <button onClick={fetchData} className="btn-secondary">Refresh</button>
      </div>

      {/* Map – only this warehouse */}
      <div className="card p-4">
        <h3 className="font-semibold text-primary mb-2 flex items-center gap-2"><MapPin size={16} /> Location</h3>
        <MapVisualizer
          nodes={mapData.nodes}
          edges={mapData.edges}
          warehouses={[{ warehouse_id: warehouse.warehouse_id, node_id: warehouse.node_id }]}
          role="warehouse"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Warehouse ID" value={warehouse.warehouse_id} icon={Warehouse} />
        <StatCard title="Active Loads" value={activeLoads.length} icon={Package} />
        <StatCard title="Scheduled Trucks" value={schedule.length} icon={Truck} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4">Active Loads</h3>
        {activeLoads.length === 0 ? (
          <p className="text-text-light">No active loads.</p>
        ) : (
          <div className="space-y-2">
            {activeLoads.slice(0, 10).map(load => (
              <div key={load.load_id} className="flex justify-between items-center border-b border-border py-2">
                <span className="font-mono">{load.load_id}</span>
                <span className="text-sm text-text-light">{load.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}