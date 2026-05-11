import { useState } from 'react'
import { Grid3X3, List, SlidersHorizontal } from 'lucide-react'
import AnnonceCard from '../../components/listing/AnnonceCard'
import SearchBar from '../../components/forms/SearchBar'
import { annonces } from '../../data/mockData'

export default function Listing() {
  const [view, setView] = useState('grid')
  const [filtered, setFiltered] = useState(annonces)
  const [sortBy, setSortBy] = useState('score')

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'score') return b.scoreConfiance - a.scoreConfiance
    if (sortBy === 'prix-asc') return a.loyer - b.loyer
    if (sortBy === 'prix-desc') return b.loyer - a.loyer
    if (sortBy === 'distance') return a.distance - b.distance
    return 0
  })

  const handleSearch = (filters) => {
    let res = annonces
    if (filters.ville) res = res.filter(a => a.ville === filters.ville)
    if (filters.universite) res = res.filter(a => a.universite === filters.universite)
    if (filters.budgetMax) res = res.filter(a => a.loyer <= Number(filters.budgetMax))
    if (filters.type) res = res.filter(a => a.type === filters.type)
    setFiltered(res)
  }

  return (
    <div className="page-container py-8">
      <div className="mb-8">
        <h1 className="section-title mb-2">Toutes les annonces</h1>
        <p className="text-gray-500 dark:text-gray-400">{sorted.length} logement{sorted.length > 1 ? 's' : ''} disponible{sorted.length > 1 ? 's' : ''}</p>
      </div>

      <div className="mb-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field text-sm py-2 w-auto">
            <option value="score">Meilleur score</option>
            <option value="prix-asc">Prix croissant</option>
            <option value="prix-desc">Prix décroissant</option>
            <option value="distance">Distance campus</option>
          </select>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 rounded-xl p-1">
          <button onClick={() => setView('grid')} className={`p-2 rounded-lg transition-all ${view === 'grid' ? 'bg-white dark:bg-white/20 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')} className={`p-2 rounded-lg transition-all ${view === 'list' ? 'bg-white dark:bg-white/20 shadow-sm text-primary-600 dark:text-primary-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20">
          <SlidersHorizontal className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-gray-500 dark:text-gray-400 text-lg">Aucun résultat</h3>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6' : 'flex flex-col gap-4'}>
          {sorted.map(a => <AnnonceCard key={a.id} annonce={a} />)}
        </div>
      )}
    </div>
  )
}
