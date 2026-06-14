export default function StatCard({ title, value, subtitle, icon: Icon, color = 'text-primary-400', trend }) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-dark-400 font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-dark-100 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-dark-500 mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-2.5 bg-dark-800 rounded-lg ${color}`}>
            <Icon size={20} />
          </div>
        )}
      </div>
      {trend && (
        <div className={`text-xs font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs yesterday
        </div>
      )}
    </div>
  )
}