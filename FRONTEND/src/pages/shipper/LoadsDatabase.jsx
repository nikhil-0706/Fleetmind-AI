import { useState, useEffect } from 'react';
import { Package, Search } from 'lucide-react';
import { getShipperLoads } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import StatusBadge from '../../components/StatusBadge';
import ExportButton from '../../components/ExportButton';
import toast from 'react-hot-toast';

export default function LoadsDatabase() {
  const [loads, setLoads] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getShipperLoads(user.id);
        setLoads(res.data.loads);
      } catch (err) {
        toast.error('Failed to load loads');
      } finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const filtered = loads.filter(l => l.load_id.toLowerCase().includes(filter.toLowerCase()) || l.status.toLowerCase().includes(filter.toLowerCase()));

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Loads Database</h2><p className="text-text-light text-sm">All your shipments</p></div><ExportButton data={filtered} filename="loads.csv" /></div>
      <div className="flex gap-2"><Search size={20} className="text-text-light" /><input className="input-field" placeholder="Filter by ID or status" value={filter} onChange={e => setFilter(e.target.value)} /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Load ID</th><th>Type</th><th>Weight</th><th>Status</th><th>Pickup</th><th>Drop</th><th>Deadline</th></tr></thead><tbody>{filtered.map(l => (<tr key={l.load_id} className="border-b border-border"><td className="p-3 font-mono">{l.load_id}</td><td className="p-3">{l.type}</td><td className="p-3">{l.weight}T</td><td className="p-3"><StatusBadge status={l.status} /></td><td className="p-3">{l.pickup_node_id}</td><td className="p-3">{l.drop_node_id}</td><td className="p-3">{l.delivery_deadline}</td></tr>))}</tbody></table></div>
    </div>
  );
}