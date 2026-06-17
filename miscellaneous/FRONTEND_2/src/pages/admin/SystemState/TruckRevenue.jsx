import { useState, useEffect } from 'react';
import { adminGetEarnings } from '../../../services/api';
import ExportButton from '../../../components/ExportButton';
import toast from 'react-hot-toast';

export default function TruckRevenue() {
  const [earnings, setEarnings] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await adminGetEarnings();
        setEarnings(res.data.earnings || {});
      } catch (err) { toast.error('Failed to load revenue'); }
      finally { setLoading(false); }
    };
    fetch();
  }, []);

  const data = Object.entries(earnings).map(([truckId, total]) => ({ truckId, total }));

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Truck Revenue</h2><p className="text-text-light text-sm">Total earnings per truck</p></div><ExportButton data={data} filename="truck_revenue.csv" /></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Truck ID</th><th>Total Earnings (₹)</th></tr></thead><tbody>{data.map(item => (<tr key={item.truckId} className="border-b border-border"><td className="p-3 font-mono">{item.truckId}</td><td className="p-3">₹{item.total.toLocaleString()}</td></tr>))}</tbody></table></div>
    </div>
  );
}