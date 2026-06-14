import { useState, useEffect } from 'react';
import { getWarehouseHistory, getWarehouseAnalytics } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import ExportButton from '../../components/ExportButton';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import StatCard from '../../components/StatCard';
import { Truck, Clock } from 'lucide-react';

export default function WarehouseHistory() {
  const [visits, setVisits] = useState([]);
  const [analytics, setAnalytics] = useState({ daily: {}, total: 0 });
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();
  const warehouseId = user?.id;

  useEffect(() => {
    const fetch = async () => {
      try {
        const [histRes, analyticsRes] = await Promise.all([
          getWarehouseHistory(warehouseId),
          getWarehouseAnalytics(warehouseId)
        ]);
        setVisits(histRes.data.visits || []);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        toast.error('Failed to load history');
      } finally { setLoading(false); }
    };
    fetch();
  }, [warehouseId]);

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const dailyData = Object.entries(analytics.daily || {}).map(([day, count]) => ({ day, count }));
  const yearlyEstimate = (analytics.total / (Object.keys(analytics.daily || {}).length || 1)) * 365;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Warehouse History</h2><p className="text-text-light text-sm">Completed truck visits</p></div><ExportButton data={visits} filename="warehouse_history.csv" /></div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Visits" value={analytics.total} icon={Truck} />
        <StatCard title="Avg Daily" value={Math.round(analytics.total / (Object.keys(analytics.daily || {}).length || 1))} icon={Clock} />
        <StatCard title="Est. Yearly" value={Math.round(yearlyEstimate)} icon={Truck} />
      </div>
      {dailyData.length > 0 && (<div className="card p-5"><h3 className="font-semibold text-primary mb-4">Daily Visits</h3><ResponsiveContainer width="100%" height={300}><BarChart data={dailyData.slice(-30)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="day" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#F39C12" /></BarChart></ResponsiveContainer></div>)}
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Timestamp</th><th>Event</th><th>Truck ID</th><th>Details</th></tr></thead><tbody>{visits.map((v, i) => (<tr key={i} className="border-b border-border"><td className="p-3">{new Date(v.timestamp).toLocaleString()}</td><td className="p-3">{v.event_type}</td><td className="p-3">{v.entity_id}</td><td className="p-3">{JSON.stringify(v.details)}</td></tr>))}</tbody></table></div>
    </div>
  );
}