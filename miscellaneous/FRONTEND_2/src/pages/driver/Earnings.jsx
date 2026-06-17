import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Package } from 'lucide-react';
import { getEarnings, getEarningsBreakdown, getDriverTruck } from '../../services/api';
import { getCurrentUser } from '../../services/auth';
import StatCard from '../../components/StatCard';
import ExportButton from '../../components/ExportButton';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

export default function Earnings() {
  const [earnings, setEarnings] = useState({ monthly: {}, total: 0 });
  const [breakdown, setBreakdown] = useState([]);
  const [period, setPeriod] = useState('monthly');
  const [chartData, setChartData] = useState([]);
  const user = getCurrentUser();

  const fetchEarnings = async () => {
    if (!user) return;
    try {
      const truckRes = await getDriverTruck(user.id);
      const driverId = user.id;
      const earnRes = await getEarnings(driverId, period);
      const breakdownRes = await getEarningsBreakdown(driverId);
      setEarnings(earnRes.data);
      setBreakdown(breakdownRes.data.loads || []);
      // Prepare chart data (monthly)
      if (period === 'monthly' && earnRes.data.monthly) {
        const data = Object.entries(earnRes.data.monthly).map(([month, amount]) => ({ month, amount }));
        setChartData(data);
      } else if (period === 'yearly' && earnRes.data.yearly) {
        const data = Object.entries(earnRes.data.yearly).map(([year, amount]) => ({ year, amount }));
        setChartData(data);
      } else if (period === 'today') {
        setChartData([{ label: 'Today', amount: earnRes.data.total || 0 }]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load earnings');
    }
  };

  useEffect(() => { fetchEarnings(); }, [period]);

  const totalMonthly = period === 'monthly' ? Object.values(earnings.monthly || {}).reduce((a,b)=>a+b,0) : earnings.total;
  const yearlyEstimate = (totalMonthly / (Object.keys(earnings.monthly || {}).length || 1)) * 12;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><div><h2 className="text-2xl font-bold text-primary">Earnings Dashboard</h2><p className="text-text-light text-sm">Track your income across deliveries</p></div>
      <select className="input-field w-32" value={period} onChange={(e) => setPeriod(e.target.value)}><option value="today">Today</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Earnings" value={`₹${totalMonthly.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="This Period" value={`₹${(period === 'today' ? earnings.total || 0 : (Object.values(earnings.monthly || {}).pop() || 0)).toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="Est. Yearly" value={`₹${yearlyEstimate.toLocaleString()}`} icon={Package} />
      </div>

      {chartData.length > 0 && (<div className="card p-5"><h3 className="font-semibold text-primary mb-4">Earnings Trend</h3><ResponsiveContainer width="100%" height={300}><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey={period === 'monthly' ? 'month' : period === 'yearly' ? 'year' : 'label'} /><YAxis /><Tooltip /><Line type="monotone" dataKey="amount" stroke="#F39C12" /></LineChart></ResponsiveContainer></div>)}

      <div className="card p-5"><div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-primary">Per-Load Breakdown</h3><ExportButton data={breakdown} filename="earnings_breakdown.csv" /></div>
      {breakdown.length === 0 ? <p className="text-text-light text-center py-4">No completed deliveries yet.</p> : (<table className="w-full text-sm"><thead><tr className="border-b border-border"><th className="text-left py-2">Load ID</th><th className="text-left py-2">Distance</th><th className="text-left py-2">Rate (₹/km)</th><th className="text-right py-2">Earnings</th></tr></thead><tbody>{breakdown.map((item) => (<tr key={item.load_id} className="border-b border-border"><td className="py-2 font-mono">{item.load_id}</td><td className="py-2">{item.distance_km} km</td><td className="py-2">₹{item.rate_per_km}</td><td className="py-2 text-right font-bold text-accent">₹{item.earnings}</td></tr>))}</tbody><tfoot><tr className="border-t-2 border-border"><td colSpan={3} className="py-2 font-semibold">Total</td><td className="py-2 text-right font-bold text-primary">₹{breakdown.reduce((s,i)=>s+i.earnings,0)}</td></tr></tfoot></table>)}</div>
    </div>
  );
}