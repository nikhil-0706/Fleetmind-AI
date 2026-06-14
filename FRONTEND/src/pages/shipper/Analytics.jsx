import { useState, useEffect } from 'react';
import { getShipperAnalytics } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatCard from '../../components/StatCard';
import { Package, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ShipperAnalytics() {
  const [analytics, setAnalytics] = useState({ total_loads: 0, monthly: {} });
  const [loading, setLoading] = useState(true);
  const user = getCurrentUser();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getShipperAnalytics(user.id);
        setAnalytics(res.data);
      } catch (err) {
        toast.error('Failed to load analytics');
      } finally { setLoading(false); }
    };
    fetch();
  }, [user]);

  const monthlyData = Object.entries(analytics.monthly || {}).map(([month, count]) => ({ month, count }));
  const yearlyEstimate = (analytics.total_loads / (Object.keys(analytics.monthly || {}).length || 1)) * 12;

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-primary">Load Analytics</h2><p className="text-text-light text-sm">Shipment volume trends</p></div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Loads" value={analytics.total_loads} icon={Package} />
        <StatCard title="This Month" value={Object.values(analytics.monthly || {}).pop() || 0} icon={Calendar} />
        <StatCard title="Est. Yearly" value={Math.round(yearlyEstimate)} icon={TrendingUp} />
      </div>
      {monthlyData.length > 0 && (<div className="card p-5"><h3 className="font-semibold text-primary mb-4">Monthly Load Volume</h3><ResponsiveContainer width="100%" height={300}><BarChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip /><Bar dataKey="count" fill="#F39C12" /></BarChart></ResponsiveContainer></div>)}
    </div>
  );
}