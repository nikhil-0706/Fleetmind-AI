const colorMap = {
  accent: 'bg-accent/10 text-accent',
  blue: 'bg-blue-100 text-blue-700',
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  purple: 'bg-purple-100 text-purple-700',
  orange: 'bg-orange-100 text-orange-700',
  gray: 'bg-gray-100 text-gray-700',
};

export default function StatCard({ title, value, icon: Icon, color = 'accent' }) {
  const colorClass = colorMap[color] || colorMap.accent;
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass.split(' ')[0]}`}>
        <Icon size={24} className={colorClass.split(' ')[1]} />
      </div>
      <div>
        <p className="text-sm text-text-light">{title}</p>
        <p className="text-2xl font-bold text-primary">{value}</p>
      </div>
    </div>
  );
}