import { useState, useEffect } from 'react';
import { adminGetPairs } from '../../../services/api';
import StatusBadge from '../../../components/StatusBadge';
import ExportButton from '../../../components/ExportButton';
import toast from 'react-hot-toast';

export default function Pairs() {
  const [pairs, setPairs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminGetPairs();
        setPairs(res.data.pairs);
      } catch (err) { toast.error('Failed to load pairs'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Truck-Load Pairs</h2><p className="text-text-light text-sm">Active and past assignments</p></div><ExportButton data={pairs} filename="pairs.csv" /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Pair ID</th><th>Truck</th><th>Load</th><th>Status</th><th>Pickup</th><th>Drop</th><th>Earnings</th></tr></thead><tbody>{pairs.map(p => (<tr key={p.pair_id} className="border-b border-border"><td className="p-3 font-mono text-xs">{p.pair_id}</td><td className="p-3">{p.truck_id}</td><td className="p-3">{p.load_id}</td><td className="p-3"><StatusBadge status={p.status} /></td><td className="p-3">{p.pickup_node_id}</td><td className="p-3">{p.drop_node_id}</td><td className="p-3">₹{p.earnings || 0}</td></tr>))}</tbody></table></div>
    </div>
  );
}