import { Heart, Home, Search, User, MessageCircle } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import AnnonceCard from '../../components/listing/AnnonceCard'
import { annonces } from '../../data/mockData'
import { useFavoris } from '../../hooks/useFavoris'
import { Link } from 'react-router-dom'

const sidebarLinks = [
  { to: '/dashboard-etudiant', label: 'Tableau de bord', icon: Home },
  { to: '/favoris', label: 'Mes favoris', icon: Heart },
  { to: '/profil', label: 'Mon profil', icon: User },
  { to: '/search', label: 'Rechercher', icon: Search },
  { to: '/chatbot', label: 'Assistant IA', icon: MessageCircle },
]

export default function Favoris({ isDark, onToggleTheme }) {
  const { favoris } = useFavoris()
  const favsAnnonces = annonces.filter(a => favoris.includes(a.id))

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white mb-1">Mes Favoris</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm">{favsAnnonces.length} annonce{favsAnnonces.length !== 1 ? 's' : ''} sauvegardée{favsAnnonces.length !== 1 ? 's' : ''}</p>
      </div>

      {favsAnnonces.length === 0 ? (
        <div className="glass-light rounded-2xl p-16 text-center">
          <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-5" />
          <h3 className="font-display font-semibold text-gray-500 dark:text-gray-400 text-xl mb-2">Aucun favori pour le moment</h3>
          <p className="text-gray-400 text-sm mb-6">Cliquez sur le ❤ d'une annonce pour la sauvegarder ici</p>
          <Link to="/annonces" className="btn-primary">Explorer les annonces</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favsAnnonces.map(a => <AnnonceCard key={a.id} annonce={a} />)}
        </div>
      )}
    </DashboardLayout>
  )
}
