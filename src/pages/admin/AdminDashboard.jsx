import { LayoutDashboard, Shield, Flag, Users, TrendingUp, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import StatCard from '../../components/ui/StatCard'
import { adminStats, signalements, mesAnnonces } from '../../data/mockData'

const sidebarLinks = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/moderation', label: 'Modération', icon: Shield },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
]

export default function AdminDashboard({ isDark, onToggleTheme }) {
  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Tableau de bord Admin</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Vue d'ensemble de la plateforme UniHome</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Utilisateurs inscrits" value={adminStats.totalUtilisateurs.toLocaleString()} color="indigo" trend={12} />
        <StatCard icon={Shield} label="Annonces totales" value={adminStats.totalAnnonces.toLocaleString()} color="green" trend={8} />
        <StatCard icon={Clock} label="En attente de modération" value={adminStats.annoncesEnAttente} color="orange" />
        <StatCard icon={Flag} label="Signalements ouverts" value={adminStats.signalements} color="red" />
        <StatCard icon={TrendingUp} label="Nouveaux aujourd'hui" value={adminStats.nouvellesToday} color="purple" trend={5} />
        <StatCard icon={AlertTriangle} label="Taux de fraude détecté" value={`${adminStats.tauxFraude}%`} color="red" />
      </div>

      {/* Recent signals */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-light rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Signalements récents</h2>
            <Link to="/admin/signalements" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {signalements.slice(0, 3).map(s => (
              <div key={s.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${s.statut === 'OUVERT' ? 'bg-red-500' : s.statut === 'TRAITE' ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.annonce}</p>
                  <p className="text-xs text-gray-400">{s.motif} · {s.signalePar}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${s.statut === 'OUVERT' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' : s.statut === 'TRAITE' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'}`}>
                  {s.statut}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-light rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Annonces à modérer</h2>
            <Link to="/admin/moderation" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Voir tout</Link>
          </div>
          <div className="space-y-3">
            {mesAnnonces.filter(a => a.statut === 'EN_ATTENTE').map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
                <img src={a.image} alt={a.titre} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{a.titre}</p>
                  <p className="text-xs text-gray-400">Score: {a.scoreConfiance}/100 · {a.ville}</p>
                </div>
                <div className="flex gap-1.5">
                  <button className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-200 transition-colors">
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 transition-colors">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {mesAnnonces.filter(a => a.statut === 'EN_ATTENTE').length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Aucune annonce en attente</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
