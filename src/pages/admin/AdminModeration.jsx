import { useState } from 'react'
import { LayoutDashboard, Shield, Flag, Users, CheckCircle, XCircle, Eye, AlertTriangle } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import ScoreBadge from '../../components/ui/ScoreBadge'
import { annonces } from '../../data/mockData'

const sidebarLinks = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/moderation', label: 'Modération', icon: Shield },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
]

export default function AdminModeration({ isDark, onToggleTheme }) {
  const [decisions, setDecisions] = useState({})
  const moderation = annonces.filter(a => a.scoreConfiance >= 40 && a.scoreConfiance < 70)

  const decide = (id, action) => setDecisions(prev => ({ ...prev, [id]: action }))

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Modération des annonces</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Annonces en zone grise (score 40–69) — {moderation.length} en attente</p>
      </div>

      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Ces annonces ont un score entre 40 et 69</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">Elles nécessitent une vérification manuelle avant publication. Examinez chaque annonce soigneusement.</p>
        </div>
      </div>

      <div className="space-y-4">
        {moderation.map(a => (
          <div key={a.id} className={`glass-light rounded-2xl p-5 transition-all ${decisions[a.id] ? 'opacity-60' : ''}`}>
            <div className="flex gap-5">
              <img src={a.images[0]} alt={a.titre} className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div>
                    <h3 className="font-display font-semibold text-gray-900 dark:text-white">{a.titre}</h3>
                    <p className="text-gray-400 text-sm">{a.ville} · {a.loyer.toLocaleString()} MAD/mois · {a.type}</p>
                  </div>
                  <ScoreBadge score={a.scoreConfiance} />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm line-clamp-2 mb-3">{a.description}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">Propriétaire: <strong className="text-gray-600 dark:text-gray-200">{a.proprietaire.nom}</strong></span>
                  {a.proprietaire.verifie && <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><Shield className="w-3 h-3" /> CIN vérifiée</span>}
                </div>
              </div>
            </div>

            {decisions[a.id] ? (
              <div className={`mt-4 p-3 rounded-xl text-sm font-medium text-center ${decisions[a.id] === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                {decisions[a.id] === 'approved' ? '✓ Annonce validée' : '✗ Annonce rejetée'}
              </div>
            ) : (
              <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                <button onClick={() => decide(a.id, 'approved')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
                  <CheckCircle className="w-4 h-4" /> Valider
                </button>
                <button className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/20 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 text-sm transition-colors flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Voir
                </button>
                <button onClick={() => decide(a.id, 'rejected')} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                  <XCircle className="w-4 h-4" /> Rejeter
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
