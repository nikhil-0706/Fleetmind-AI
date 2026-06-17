export default function StatCard({ title, value, subtitle, icon: Icon, trend }) {
  return (
    <div className="bg-white border border-border rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-light font-medium uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-primary mt-1">{value}</p>
          {subtitle && <p className="text-xs text-text-light mt-0.5">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="p-2 bg-accent/10 rounded-lg">
            <Icon size={20} className="text-accent" />
          </div>
        )}
      </div>
      {trend && (
        <div className={`text-xs font-medium mt-2 ${trend > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
          {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last period
        </div>
      )}
    </div>
  );
}