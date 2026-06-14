export default function ScoreBar({ label, score, max = 100, color }) {
  const pct = Math.min(100, (score / max) * 100)
  const getColor = () => {
    if (color) return color
    if (pct >= 80) return 'bg-emerald-500'
    if (pct >= 60) return 'bg-blue-500'
    if (pct >= 40) return 'bg-amber-500'
    return 'bg-red-500'
  }

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-dark-400">{label}</span>
        <span className="text-xs font-medium text-dark-200">{score?.toFixed(1)}</span>
      </div>
      <div className="score-bar">
        <div
          className={`score-fill ${getColor()}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}