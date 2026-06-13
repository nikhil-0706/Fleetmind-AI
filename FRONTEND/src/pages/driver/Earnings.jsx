import { useState } from 'react'
import { DollarSign, TrendingUp, Package } from 'lucide-react'
import { getEarnings, getEarningsBreakdown, getCompletedDeliveries } from '../../services/api'
import StatCard from '../../components/StatCard'

const mockEarnings = {
  daily: { '2025-01-13': 980, '2025-01-14': 1450, '2025-01-15': 1250 },
  weekly: { 'Week 1': 6200, 'Week 2': 7100, 'Week 3': 5800 },
  total: 19100,
}

const mockBreakdown = [
  { load_id: 'L1', earnings: 7800, distance_km: 150, rate: 52 },
  { load_id: 'L3', earnings: 7200, distance_km: 120, rate: 60 },
  { load_id: 'L5', earnings: 3600, distance_km: 80, rate: 45 },
]

export default function Earnings() {
  const [driverId, setDriverId] = useState('D1')
  const [earnings, setEarnings] = useState(mockEarnings)
  const [breakdown, setBreakdown] = useState(mockBreakdown)

  const fetchEarnings = async () => {
    try {
      const res = await getEarnings(driverId)
      setEarnings(res.data)
    } catch {
      setEarnings(mockEarnings)
    }
    try {
      const res = await getEarningsBreakdown(driverId)
      setBreakdown(res.data.loads)
    } catch {
      setBreakdown(mockBreakdown)
    }
  }

  const dailyData = Object.entries(earnings.daily).map(([date, amount]) => ({ date: date.slice(5), amount }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Earnings Dashboard</h2>
          <p className="text-text-light text-sm">Track your income across deliveries</p>
        </div>
        <div className="flex gap-2">
          <input className="input-field w-28" value={driverId} onChange={(e) => setDriverId(e.target.value)} placeholder="Driver ID" />
          <button onClick={fetchEarnings} className="btn-primary">
            <TrendingUp size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Earnings" value={`₹${earnings.total.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Today" value={`₹${Object.values(earnings.daily).at(-1)?.toLocaleString() || 0}`} icon={TrendingUp} />
        <StatCard title="This Week" value={`₹${Object.values(earnings.weekly).at(-1)?.toLocaleString() || 0}`} icon={Package} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4">Per-Load Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-2">Load ID</th>
              <th className="text-left py-2">Distance</th>
              <th className="text-left py-2">Rate (₹/km)</th>
              <th className="text-right py-2">Earnings</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item) => (
              <tr key={item.load_id} className="border-b border-border">
                <td className="py-2 font-mono">{item.load_id}</td>
                <td className="py-2">{item.distance_km} km</td>
                <td className="py-2">₹{item.rate}</td>
                <td className="py-2 text-right font-bold text-accent">₹{item.earnings}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-border">
              <td colSpan={3} className="py-2 font-semibold">Total</td>
              <td className="py-2 text-right font-bold text-primary text-lg">
                ₹{breakdown.reduce((s, i) => s + i.earnings, 0)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4">Daily Earnings</h3>
        <div className="space-y-2">
          {dailyData.map((d) => (
            <div key={d.date} className="flex justify-between items-center">
              <span className="text-sm">{d.date}</span>
              <div className="flex-1 mx-4 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-accent rounded-full" style={{ width: `${(d.amount / Math.max(...dailyData.map(x => x.amount))) * 100}%` }} />
              </div>
              <span className="text-sm font-medium">₹{d.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}