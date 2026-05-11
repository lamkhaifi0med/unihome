import { useState } from 'react'
import SearchBar from '../../components/forms/SearchBar'
import AnnonceCard from '../../components/listing/AnnonceCard'
import { annonces } from '../../data/mockData'
import { Search, SlidersHorizontal } from 'lucide-react'

export default function SearchPage() {
  const [results, setResults] = useState([])
  const [searched, setSearched] = useState(false)

  const handleSearch = (filters) => {
    setSearched(true)
    let res = annonces
    if (filters.ville) res = res.filter(a => a.ville === filters.ville)
    if (filters.universite) res = res.filter(a => a.universite === filters.universite)
    if (filters.budgetMax) res = res.filter(a => a.loyer <= Number(filters.budgetMax))
    if (filters.type) res = res.filter(a => a.type === filters.type)
    setResults(res)
  }

  return (
    <div className="page-container py-8">
      <div className="mb-8">
        <h1 className="section-title mb-2">Rechercher un logement</h1>
        <p className="text-gray-500 dark:text-gray-400">Filtrez par ville, université, budget et type pour trouver votre logement idéal.</p>
      </div>

      <div className="mb-8">
        <SearchBar onSearch={handleSearch} />
      </div>

      {!searched ? (
        <div className="text-center py-24">
          <Search className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-gray-500 dark:text-gray-400 text-xl">Lancez une recherche</h3>
          <p className="text-gray-400 text-sm mt-2">Utilisez les filtres ci-dessus pour trouver votre logement idéal</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-24">
          <SlidersHorizontal className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="font-display font-semibold text-gray-500 dark:text-gray-400 text-xl">Aucun résultat</h3>
          <p className="text-gray-400 text-sm mt-2">Essayez de modifier vos critères de recherche</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{results.length} logement{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map(a => <AnnonceCard key={a.id} annonce={a} />)}
          </div>
        </>
      )}
    </div>
  )
}
