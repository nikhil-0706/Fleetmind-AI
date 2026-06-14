import { useState, useEffect } from 'react';
import { adminGetWarehouses } from '../../../services/api';
import ExportButton from '../../../components/ExportButton';
import toast from 'react-hot-toast';

export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminGetWarehouses();
        setWarehouses(res.data.warehouses);
      } catch (err) { toast.error('Failed to load warehouses'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Warehouses</h2><p className="text-text-light text-sm">All registered warehouses</p></div><ExportButton data={warehouses} filename="warehouses.csv" /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Warehouse ID</th><th>Node</th><th>Docks (fixed)</th><th>Compatible Types</th><th>Scheduled Trucks</th></tr></thead><tbody>{warehouses.map(w => (<tr key={w.warehouse_id} className="border-b border-border"><td className="p-3 font-mono">{w.warehouse_id}</td><td className="p-3">{w.node_id}</td><td className="p-3">5</td><td className="p-3">{w.compatible_load_types?.join(', ') || '-'}</td><td className="p-3">{w.scheduled_trucks?.length || 0}</td></tr>))}</tbody></table></div>
    </div>
  );
}