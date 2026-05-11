import { Home, PlusCircle, List, User, TrendingUp, Eye, Heart, Star, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import StatCard from '../../components/ui/StatCard'
import ScoreBadge from '../../components/ui/ScoreBadge'
import { mesAnnonces } from '../../data/mockData'
import { useAuth } from '../../hooks/useAuth'

const sidebarLinks = [
  { to: '/dashboard-proprietaire', label: 'Tableau de bord', icon: Home },
  { to: '/publier-annonce', label: 'Publier une annonce', icon: PlusCircle },
  { to: '/mes-annonces', label: 'Mes annonces', icon: List },
  { to: '/profil-proprietaire', label: 'Mon profil', icon: User },
]

const statusColors = {
  VALIDEE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400',
  EN_ATTENTE: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400',
  SUSPENDUE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
  REJETEE: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
}

const statusLabels = { VALIDEE: 'Validée', EN_ATTENTE: 'En attente', SUSPENDUE: 'Suspendue', REJETEE: 'Rejetée' }

export default function DashboardProprietaire({ isDark, onToggleTheme }) {
  const { user } = useAuth()

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">
            Bonjour, {user?.nom?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Gérez vos logements et suivez vos performances</p>
        </div>
        <Link to="/publier-annonce" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> Nouvelle annonce
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={List} label="Annonces actives" value={2} color="indigo" trend={15} />
        <StatCard icon={Eye} label="Vues ce mois" value={287} color="green" trend={22} />
        <StatCard icon={Heart} label="Favoris reçus" value={43} color="red" />
        <StatCard icon={Star} label="Note moyenne" value="4.6/5" color="orange" />
      </div>

      {/* Mes annonces */}
      <div className="glass-light rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Mes annonces récentes</h2>
          <Link to="/mes-annonces" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">Voir tout</Link>
        </div>
        <div className="space-y-4">
          {mesAnnonces.map(a => (
            <div key={a.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
              <img src={a.image} alt={a.titre} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-gray-900 dark:text-white text-sm truncate">{a.titre}</p>
                <p className="text-gray-400 text-xs">{a.ville} · {a.loyer.toLocaleString()} MAD/mois</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <ScoreBadge score={a.scoreConfiance} size="sm" />
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[a.statut]}`}>
                    {statusLabels[a.statut]}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-right text-xs text-gray-400">
                <p className="flex items-center gap-1"><Eye className="w-3 h-3" /> {a.vues}</p>
                <p className="flex items-center gap-1 mt-1"><Heart className="w-3 h-3" /> {a.favoris}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="glass-light rounded-2xl p-6 border border-indigo-100 dark:border-indigo-900/30">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-indigo-500" />
          <h3 className="font-display font-semibold text-gray-900 dark:text-white">Conseil UniHome</h3>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
          Faites vérifier votre CIN par notre équipe pour obtenir le badge « Propriétaire Vérifié ». Cela augmente significativement votre score de confiance et attire plus d'étudiants.
        </p>
        <Link to="/profil-proprietaire" className="inline-block mt-3 text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
          Demander la vérification →
        </Link>
      </div>
    </DashboardLayout>
  )
}
