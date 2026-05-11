import { Home, PlusCircle, List, User, Eye, Heart, Edit, Trash2, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import ScoreBadge from '../../components/ui/ScoreBadge'
import { mesAnnonces } from '../../data/mockData'

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
}
const statusLabel = { VALIDEE: 'Validée ✓', EN_ATTENTE: 'En attente...', SUSPENDUE: 'Suspendue !' }

export default function MesAnnonces({ isDark, onToggleTheme }) {
  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Mes Annonces</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{mesAnnonces.length} annonce{mesAnnonces.length > 1 ? 's' : ''} au total</p>
        </div>
        <Link to="/publier-annonce" className="btn-primary flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> Nouvelle
        </Link>
      </div>

      <div className="space-y-4">
        {mesAnnonces.map(a => (
          <div key={a.id} className="glass-light rounded-2xl p-5 flex gap-5 items-center">
            <img src={a.image} alt={a.titre} className="w-20 h-20 rounded-xl object-cover flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-gray-900 dark:text-white text-sm truncate">{a.titre}</h3>
                  <p className="text-gray-400 text-xs">{a.ville} · {a.loyer.toLocaleString()} MAD/mois · Publiée le {a.datePublication}</p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${statusColors[a.statut]}`}>
                  {statusLabel[a.statut]}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <ScoreBadge score={a.scoreConfiance} size="sm" />
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {a.vues} vues</span>
                  <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" /> {a.favoris} favoris</span>
                </div>
              </div>
              {a.statut === 'SUSPENDUE' && (
                <div className="flex items-center gap-2 mt-2 text-xs text-red-600 dark:text-red-400">
                  <AlertCircle className="w-3.5 h-3.5" /> Annonce suspendue après signalements multiples.
                  <Link to="/score-rejet" className="underline hover:no-underline">Voir les détails</Link>
                </div>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-300 transition-all">
                <Edit className="w-4 h-4" />
              </button>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  )
}
