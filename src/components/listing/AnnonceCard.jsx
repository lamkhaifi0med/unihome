import { Link } from 'react-router-dom'
import { MapPin, Wifi, Heart, Maximize2 } from 'lucide-react'
import ScoreBadge from '../ui/ScoreBadge'
import { useFavoris } from '../../hooks/useFavoris'

export default function AnnonceCard({ annonce }) {
  const { toggleFavori, isFavori } = useFavoris()
  const fav = isFavori(annonce.id)

  const typeColors = {
    STUDIO: 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
    CHAMBRE: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
    COLOCATION: 'bg-teal-100 text-teal-700 dark:bg-teal-500/20 dark:text-teal-400',
    APPARTEMENT: 'bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400',
  }

  return (
    <div className="glass-light rounded-2xl overflow-hidden card-hover group">
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gray-100 dark:bg-dark-700">
        <img
          src={annonce.images[0]}
          alt={annonce.titre}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {/* Overlays */}
        <div className="absolute top-3 left-3">
          <ScoreBadge score={annonce.scoreConfiance} size="sm" />
        </div>
        <button
          onClick={(e) => { e.preventDefault(); toggleFavori(annonce.id) }}
          className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${fav ? 'bg-red-500 text-white' : 'bg-white/80 dark:bg-dark-700/80 text-gray-500 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
        </button>
        <span className={`absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg ${typeColors[annonce.type]}`}>
          {annonce.type}
        </span>
        {annonce.images.length > 1 && (
          <span className="absolute bottom-3 right-3 text-xs text-white/80 bg-black/40 px-2 py-0.5 rounded-md flex items-center gap-1">
            <Maximize2 className="w-3 h-3" /> {annonce.images.length}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2">
            {annonce.titre}
          </h3>
          <div className="flex-shrink-0 text-right">
            <p className="font-display font-bold text-primary-600 dark:text-primary-400 text-sm whitespace-nowrap">
              {annonce.loyer.toLocaleString()} MAD
            </p>
            <p className="text-xs text-gray-400">/mois</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mb-3">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="truncate">{annonce.adresse}</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Wifi className="w-3.5 h-3.5" />
            <span>{annonce.superficie} m²</span>
            <span>· {annonce.distance} km campus</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
          {annonce.equipements.slice(0, 3).map(eq => (
            <span key={eq} className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
              {eq}
            </span>
          ))}
          {annonce.equipements.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-400">
              +{annonce.equipements.length - 3}
            </span>
          )}
        </div>

        <Link to={`/annonces/${annonce.id}`} className="block w-full text-center text-sm font-display font-semibold text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-900/50 py-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all">
          Voir les détails →
        </Link>
      </div>
    </div>
  )
}
