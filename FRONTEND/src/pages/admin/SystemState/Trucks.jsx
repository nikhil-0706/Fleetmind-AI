import { useState, useEffect } from 'react';
import { adminGetTrucks } from '../../../services/api';
import StatusBadge from '../../../components/StatusBadge';
import ExportButton from '../../../components/ExportButton';
import toast from 'react-hot-toast';

export default function Trucks() {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminGetTrucks();
        setTrucks(res.data.trucks);
      } catch (err) { toast.error('Failed to load trucks'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Trucks</h2><p className="text-text-light text-sm">All registered trucks</p></div><ExportButton data={trucks} filename="trucks.csv" /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Truck ID</th><th>Driver ID</th><th>Status</th><th>Current Node</th><th>Capacity (T)</th><th>Preferred Rate</th></tr></thead><tbody>{trucks.map(t => (<tr key={t.truck_id} className="border-b border-border"><td className="p-3 font-mono">{t.truck_id}</td><td className="p-3">{t.driver_id}</td><td className="p-3"><StatusBadge status={t.status} /></td><td className="p-3">{t.current_node_id || '-'}</td><td className="p-3">{t.remaining_capacity}</td><td className="p-3">₹{t.preferred_rs_per_km}</td></tr>))}</tbody></table></div>
    </div>
  );
}