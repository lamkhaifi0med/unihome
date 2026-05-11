import { Home, Heart, User, Search, MessageCircle, Sparkles, MapPin, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import AnnonceCard from '../../components/listing/AnnonceCard'
import StatCard from '../../components/ui/StatCard'
import { annonces } from '../../data/mockData'
import { useAuth } from '../../hooks/useAuth'
import { useFavoris } from '../../hooks/useFavoris'

const sidebarLinks = [
  { to: '/dashboard-etudiant', label: 'Tableau de bord', icon: Home },
  { to: '/favoris', label: 'Mes favoris', icon: Heart },
  { to: '/profil', label: 'Mon profil', icon: User },
  { to: '/search', label: 'Rechercher', icon: Search },
  { to: '/chatbot', label: 'Assistant IA', icon: MessageCircle },
]

export default function DashboardEtudiant({ isDark, onToggleTheme }) {
  const { user } = useAuth()
  const { favoris } = useFavoris()
  const recommandations = annonces.filter(a => a.scoreConfiance >= 70).slice(0, 3)

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">
          Bonjour, {user?.nom?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{user?.universite || 'Étudiant UniHome'}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Heart} label="Favoris sauvegardés" value={favoris.length} color="red" />
        <StatCard icon={Search} label="Recherches effectuées" value={12} color="indigo" trend={8} />
        <StatCard icon={MapPin} label="Villes explorées" value={3} color="purple" />
        <StatCard icon={TrendingUp} label="Annonces consultées" value={47} color="green" />
      </div>

      {/* Recommandations IA */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary-500" />
          <h2 className="font-display font-bold text-lg text-gray-900 dark:text-white">Recommandations IA pour vous</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {recommandations.map(a => <AnnonceCard key={a.id} annonce={a} />)}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          { to: '/search', icon: Search, label: 'Nouvelle recherche', desc: 'Trouver un logement', color: 'indigo' },
          { to: '/favoris', icon: Heart, label: 'Mes favoris', desc: `${favoris.length} annonces sauvegardées`, color: 'red' },
          { to: '/chatbot', icon: MessageCircle, label: 'Assistant IA', desc: 'Obtenir de l\'aide', color: 'purple' },
        ].map(({ to, icon: Icon, label, desc, color }) => {
          const colors = { indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', red: 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400', purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400' }
          return (
            <Link key={to} to={to} className="glass-light rounded-2xl p-5 card-hover flex items-center gap-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-display font-semibold text-gray-900 dark:text-white text-sm">{label}</p>
                <p className="text-gray-400 text-xs">{desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </DashboardLayout>
  )
}
