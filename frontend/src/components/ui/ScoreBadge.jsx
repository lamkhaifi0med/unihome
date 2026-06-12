import { Shield } from 'lucide-react'

export default function ScoreBadge({ score, size = 'md' }) {
  const getClass = () => {
    if (score >= 70) return 'score-badge-green'
    if (score >= 40) return 'score-badge-orange'
    return 'score-badge-red'
  }

  const getLabel = () => {
    if (score >= 70) return 'Vérifié'
    if (score >= 40) return 'En vérification'
    return 'Risqué'
  }

  const sizes = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-sm px-3 py-1 gap-1.5',
    lg: 'text-base px-4 py-1.5 gap-2',
  }

  return (
    <span className={`inline-flex items-center rounded-full font-display font-semibold ${getClass()} ${sizes[size]}`}>
      <Shield className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />
      <span>{score}%</span>
      {size !== 'sm' && <span className="opacity-70">· {getLabel()}</span>}
    </span>
  )
}
