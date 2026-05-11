import { useState } from 'react'
import { LayoutDashboard, Shield, Flag, Users, CheckCircle, XCircle } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { signalements } from '../../data/mockData'

const sidebarLinks = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/moderation', label: 'Modération', icon: Shield },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
]

const statusColors = {
  OUVERT: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  TRAITE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  REJETE: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
}

export default function AdminSignalements({ isDark, onToggleTheme }) {
  const [filter, setFilter] = useState('TOUS')
  const [list, setList] = useState(signalements)

  const filtered = filter === 'TOUS' ? list : list.filter(s => s.statut === filter)
  const decide = (id, statut) => setList(prev => prev.map(s => s.id === id ? { ...s, statut } : s))

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Signalements</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{list.filter(s => s.statut === 'OUVERT').length} signalements ouverts</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['TOUS', 'OUVERT', 'TRAITE', 'REJETE'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/15'}`}>
            {f} {f !== 'TOUS' && <span className="ml-1 opacity-70">({list.filter(s => s.statut === f).length})</span>}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map(s => (
          <div key={s.id} className="glass-light rounded-2xl p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="font-display font-semibold text-gray-900 dark:text-white text-sm">{s.annonce}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                  Signalé par <strong>{s.signalePar}</strong> · {s.date}
                </p>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusColors[s.statut]}`}>
                {s.statut}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <Flag className="w-4 h-4 text-red-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Motif : <strong>{s.motif}</strong></span>
            </div>
            {s.statut === 'OUVERT' && (
              <div className="flex gap-3">
                <button onClick={() => decide(s.id, 'TRAITE')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors">
                  <CheckCircle className="w-4 h-4" /> Marquer traité
                </button>
                <button onClick={() => decide(s.id, 'REJETE')} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <XCircle className="w-4 h-4" /> Rejeter le signalement
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
