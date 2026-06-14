import { useState } from 'react'
import { DollarSign, TrendingUp, Package } from 'lucide-react'
import { getEarnings, getEarningsBreakdown, getCompletedDeliveries } from '../../services/api'
import { mockEarnings } from '../../services/mockData'
import StatCard from '../../components/StatCard'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts'

export default function Earnings() {
  const [driverId, setDriverId] = useState('D1')
  const [earnings, setEarnings] = useState(mockEarnings)
  const [breakdown, setBreakdown] = useState([
    { load_id: 'L1', earnings: 350, distance_km: 150, rate: 52 },
    { load_id: 'L3', earnings: 480, distance_km: 120, rate: 60 },
    { load_id: 'L5', earnings: 420, distance_km: 140, rate: 45 },
  ])

  const fetchEarnings = async () => {
    try {
      const r = await getEarnings(driverId)
      setEarnings(r.data)
    } catch {}
    try {
      const r = await getEarningsBreakdown(driverId)
      setBreakdown(r.data.loads)
    } catch {}
  }

  const dailyData = Object.entries(earnings.daily).map(([date, amount]) => ({
    date: date.slice(5),
    amount,
  }))

  const weeklyData = Object.entries(earnings.weekly).map(([week, amount]) => ({
    week,
    amount,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark-100 flex items-center gap-3">
            <DollarSign className="text-emerald-400" size={24} />
            Earnings Dashboard
          </h2>
          <p className="text-dark-400 text-sm mt-1">Track your income across deliveries</p>
        </div>
        <div className="flex gap-2">
          <input className="input-field w-28" value={driverId} onChange={(e) => setDriverId(e.target.value)} placeholder="Driver ID" />
          <button onClick={fetchEarnings} className="btn-primary">
            <TrendingUp size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          title="Total Earnings"
          value={`₹${earnings.total.toLocaleString()}`}
          icon={DollarSign}
          color="text-emerald-400"
          trend={8}
        />
        <StatCard
          title="Today"
          value={`₹${Object.values(earnings.daily).at(-1)?.toLocaleString() || 0}`}
          icon={TrendingUp}
          color="text-blue-400"
        />
        <StatCard
          title="This Week"
          value={`₹${Object.values(earnings.weekly).at(-1)?.toLocaleString() || 0}`}
          icon={Package}
          color="text-amber-400"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="section-title">Daily Earnings</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Line type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="section-title">Weekly Comparison</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="week" stroke="#475569" tick={{ fontSize: 11 }} />
              <YAxis stroke="#475569" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
              <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="section-title">Per-Load Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="text-left p-3">Load ID</th>
              <th className="text-left p-3">Distance</th>
              <th className="text-left p-3">Rate (₹/km)</th>
              <th className="text-right p-3">Earnings</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item) => (
              <tr key={item.load_id} className="table-row">
                <td className="p-3 font-mono text-dark-200">{item.load_id}</td>
                <td className="p-3 text-dark-400">{item.distance_km} km</td>
                <td className="p-3 text-dark-400">₹{item.rate}</td>
                <td className="p-3 text-right font-bold text-emerald-400">₹{item.earnings}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-dark-600">
              <td colSpan={3} className="p-3 text-dark-300 font-semibold">Total</td>
              <td className="p-3 text-right font-bold text-emerald-400 text-lg">
                ₹{breakdown.reduce((s, i) => s + i.earnings, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}