import { useState, useEffect } from 'react';
import { getWarehouseActiveLoads } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import StatusBadge from '../../components/common/StatusBadge';
import ExportButton from '../../components/common/ExportButton';
import toast from 'react-hot-toast';

export default function WarehouseLoads() {
  const user = getCurrentUser();
  const warehouseId = user?.id;
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getWarehouseActiveLoads(warehouseId);
        setLoads(res.data.loads || []);
      } catch (err) { toast.error('Failed to load loads'); }
      finally { setLoading(false); }
    };
    fetch();
  }, [warehouseId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Warehouse Loads</h2><p className="text-text-light text-sm">All active loads at this warehouse</p></div><ExportButton data={loads} filename="warehouse_loads.csv" /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Load ID</th><th>Type</th><th>Weight</th><th>Status</th><th>Pickup Node</th><th>Drop Node</th><th>Deadline</th></tr></thead><tbody>{loads.map(l => (<tr key={l.load_id} className="border-b border-border"><td className="p-3 font-mono">{l.load_id}</td><td className="p-3">{l.type}</td><td className="p-3">{l.weight}T</td><td className="p-3"><StatusBadge status={l.status} /></td><td className="p-3">{l.pickup_node_id}</td><td className="p-3">{l.drop_node_id}</td><td className="p-3">{l.delivery_deadline}</td></tr>))}</tbody></table></div>
    </div>
  );
}