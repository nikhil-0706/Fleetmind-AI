import { useState } from 'react'
import { DollarSign, TrendingUp, Package } from 'lucide-react'
import { getEarnings, getEarningsBreakdown } from '../../services/api'
import StatCard from '../../components/StatCard'
import toast from 'react-hot-toast'

export default function Earnings() {
  const [driverId, setDriverId] = useState('')
  const [earnings, setEarnings] = useState({ daily: {}, weekly: {}, total: 0 })
  const [breakdown, setBreakdown] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchEarnings = async () => {
    if (!driverId) {
      toast.error('Enter a Driver ID')
      return
    }
    setLoading(true)
    try {
      const [earnRes, breakdownRes] = await Promise.all([
        getEarnings(driverId),
        getEarningsBreakdown(driverId)
      ])
      setEarnings(earnRes.data)
      setBreakdown(breakdownRes.data.loads || [])
      toast.success('Earnings loaded')
    } catch (err) {
      console.error(err)
      toast.error('Failed to load earnings')
      setEarnings({ daily: {}, weekly: {}, total: 0 })
      setBreakdown([])
    } finally {
      setLoading(false)
    }
  }

  const dailyData = Object.entries(earnings.daily || {}).map(([date, amount]) => ({ date: date.slice(5), amount }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-primary">Earnings Dashboard</h2>
          <p className="text-text-light text-sm">Track your income across deliveries</p>
        </div>
        <div className="flex gap-2">
          <input
            className="input-field w-32"
            value={driverId}
            onChange={(e) => setDriverId(e.target.value)}
            placeholder="Driver ID"
          />
          <button onClick={fetchEarnings} disabled={loading} className="btn-primary">
            <TrendingUp size={16} /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Earnings" value={`₹${(earnings.total || 0).toLocaleString()}`} icon={DollarSign} />
        <StatCard title="Today" value={`₹${(Object.values(earnings.daily || {}).pop() || 0).toLocaleString()}`} icon={TrendingUp} />
        <StatCard title="This Week" value={`₹${(Object.values(earnings.weekly || {}).pop() || 0).toLocaleString()}`} icon={Package} />
      </div>

      <div className="card p-5">
        <h3 className="font-semibold text-primary mb-4">Per-Load Breakdown</h3>
        {breakdown.length === 0 ? (
          <p className="text-text-light text-center py-4">No completed deliveries yet.</p>
        ) : (
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
        )}
      </div>

      {/* Daily earnings chart */}
      {dailyData.length > 0 && (
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
      )}
    </div>
  )
}