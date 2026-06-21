import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Map,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react'
import SearchBar from '../../components/forms/SearchBar'
import AnnonceCard from '../../components/listing/AnnonceCard'
import SearchMap from '../../components/listing/SearchMap'
import { ownerApi } from '../../api/ownerApi'
import { searchApi } from '../../api/searchApi'

const PAGE_SIZE = 12

function normalizePageResponse(data) {
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.content)) return data.content
  return []
}

function sortAnnonces(items, sortBy) {
  return [...items].sort((a, b) => {
    if (sortBy === 'prix-asc') return Number(a.loyer || 0) - Number(b.loyer || 0)
    if (sortBy === 'prix-desc') return Number(b.loyer || 0) - Number(a.loyer || 0)
    if (sortBy === 'score') return Number(b.scoreConfiance || 0) - Number(a.scoreConfiance || 0)
    return Number(a.distanceMetres ?? Infinity) - Number(b.distanceMetres ?? Infinity)
  })
}

function filterAnnonces(items, filters) {
  return items.filter((annonce) => {
    if (annonce.statut !== 'VALIDEE') return false
    if (filters.ville && annonce.ville !== filters.ville) return false
    if (filters.budgetMax && Number(annonce.loyer || 0) > Number(filters.budgetMax)) return false
    if (filters.surfaceMin && Number(annonce.superficie || 0) < Number(filters.surfaceMin)) return false
    if (filters.type && annonce.typeLogement !== filters.type) return false
    if (filters.equipements?.length) {
      const available = annonce.equipements || []
      return filters.equipements.every((equipement) => available.includes(equipement))
    }
    return true
  })
}

export default function SearchPage({
  defaultSearched = false,
  title = 'Rechercher un logement',
  subtitle = 'Recherche ancrée sur les campus marocains, avec annonces validées, score IA et distance depuis l’université.',
}) {
  const [searchParams] = useSearchParams()
  const [universites, setUniversites] = useState([])
  const [equipements, setEquipements] = useState([])
  const [results, setResults] = useState([])
  const [filters, setFilters] = useState({
    ville: searchParams.get('ville') || '',
    universiteId: searchParams.get('universiteId') || '',
    budgetMax: searchParams.get('budgetMax') || '',
    surfaceMin: searchParams.get('surfaceMin') || '',
    type: searchParams.get('type') || '',
    rayon: searchParams.get('rayon') || '5000',
    equipements: [],
  })
  const [searched, setSearched] = useState(defaultSearched || Boolean(searchParams.toString()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sortBy, setSortBy] = useState('distance')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [selectedId, setSelectedId] = useState(null)

  const cityOptions = useMemo(() => {
    return [...new Set(universites.map((universite) => universite.ville).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    )
  }, [universites])

  const selectedCampus = useMemo(() => {
    return universites.find((universite) => String(universite.id) === String(filters.universiteId)) || null
  }, [universites, filters.universiteId])

  const sortedResults = useMemo(() => sortAnnonces(results, sortBy), [results, sortBy])
  const visibleResults = sortedResults.slice(0, visibleCount)
  const hasMore = visibleCount < sortedResults.length

  const runSearch = async (nextFilters, keepSilent = false) => {
    if (!keepSilent) setSearched(true)
    setLoading(true)
    setError(null)
    setSelectedId(null)
    setVisibleCount(PAGE_SIZE)

    try {
      const response = nextFilters.universiteId
        ? await searchApi.searchNearUniversity({
            universiteId: nextFilters.universiteId,
            rayon: nextFilters.rayon || 5000,
            page: 0,
            size: 120,
          })
        : await searchApi.getAnnonces()

      const data = normalizePageResponse(response.data)
      setResults(filterAnnonces(data, nextFilters))
    } catch (err) {
      setError(err?.response?.data?.detail || 'La recherche est actuellement indisponible. Veuillez réessayer plus tard.')
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let mounted = true

    const loadInitialData = async () => {
      try {
        setLoading(true)
        setError(null)
        const [universitesRes, equipementsRes] = await Promise.all([
          ownerApi.getUniversites(),
          ownerApi.getEquipements(),
        ])
        if (!mounted) return

        setUniversites(universitesRes.data || [])
        setEquipements(equipementsRes.data || [])
        await runSearch(filters, !searched)
      } catch (err) {
        if (mounted) {
          setError(err?.response?.data?.detail || 'Impossible de charger les annonces.')
          setLoading(false)
        }
      }
    }

    loadInitialData()
    return () => {
      mounted = false
    }
  }, [])

  const handleSearch = (nextFilters) => {
    setFilters(nextFilters)
    runSearch(nextFilters)
  }

  const scoreAverage = sortedResults.length
    ? Math.round(sortedResults.reduce((sum, item) => sum + Number(item.scoreConfiance || 0), 0) / sortedResults.length)
    : 0
  const lowestBudget = sortedResults.length
    ? Math.min(...sortedResults.map((item) => Number(item.loyer || 0))).toLocaleString('fr-FR')
    : null

  return (
    <div className="page-container py-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Annonces validées uniquement
          </div>
          <h1 className="section-title mb-2">{title}</h1>
          <p className="max-w-3xl text-sm leading-relaxed text-gray-500 dark:text-gray-400">{subtitle}</p>
        </div>
      </div>

      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          cityOptions={cityOptions}
          universites={universites}
          equipements={equipements}
          initialFilters={filters}
          loading={loading}
        />
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50/80 p-5 shadow-sm shadow-emerald-900/5 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Résultats validés
          </div>
          <p className="mt-1 text-2xl font-bold text-emerald-900 dark:text-emerald-100">{sortedResults.length}</p>
        </div>
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/80 p-5 shadow-sm shadow-indigo-900/5 dark:border-indigo-500/20 dark:bg-indigo-500/10">
          <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">Score IA moyen</p>
          <p className="mt-1 text-2xl font-bold text-indigo-900 dark:text-indigo-100">{scoreAverage}%</p>
        </div>
        <div className="rounded-3xl border border-gray-100 bg-white/90 p-5 shadow-sm shadow-slate-900/5 dark:border-white/10 dark:bg-white/5">
          <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">Budget le plus bas</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
            {lowestBudget ? `${lowestBudget} MAD` : '-'}
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {searched ? `${sortedResults.length} annonce${sortedResults.length > 1 ? 's' : ''} trouvée${sortedResults.length > 1 ? 's' : ''}` : 'Recherche prête'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Affichage par lots de 12, avec carte campus et distance quand une université est choisie.
          </p>
        </div>

        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="input-field w-auto py-2 text-sm">
          <option value="distance">Distance campus</option>
          <option value="prix-asc">Prix croissant</option>
          <option value="prix-desc">Prix décroissant</option>
          <option value="score">Score IA</option>
        </select>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_500px] 2xl:grid-cols-[minmax(0,1fr)_540px]">
        <section className="min-w-0">
          {loading ? (
            <div className="glass-light flex h-72 items-center justify-center rounded-2xl text-gray-500 dark:text-gray-400">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Chargement des annonces...
            </div>
          ) : !searched ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 py-24 text-center dark:border-white/10 dark:bg-white/5">
              <Search className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <h3 className="font-display text-xl font-semibold text-gray-500 dark:text-gray-400">Lancez une recherche</h3>
              <p className="mt-2 text-sm text-gray-400">Choisissez une université, un budget, un rayon ou des équipements.</p>
            </div>
          ) : sortedResults.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50/70 py-24 text-center dark:border-white/10 dark:bg-white/5">
              <SlidersHorizontal className="mx-auto mb-4 h-16 w-16 text-gray-300 dark:text-gray-600" />
              <h3 className="font-display text-xl font-semibold text-gray-500 dark:text-gray-400">Aucun resultat</h3>
              <p className="mt-2 text-sm text-gray-400">Essayez un rayon plus large, un autre budget ou une autre ville.</p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-5">
                {visibleResults.map((annonce) => (
                  <div
                    key={annonce.id}
                    onMouseEnter={() => setSelectedId(annonce.id)}
                    onFocus={() => setSelectedId(annonce.id)}
                  >
                    <AnnonceCard annonce={annonce} list />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((current) => current + PAGE_SIZE)}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-800 shadow-sm transition-all hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                  >
                    Charger plus
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        <SearchMap
          annonces={visibleResults}
          campus={selectedCampus}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </div>

      <div className="mt-4 flex items-center gap-2 text-xs text-gray-400 xl:hidden">
        <Map className="h-4 w-4" />
        La carte est disponible sur grand écran pour comparer les logements autour du campus.
      </div>
    </div>
  )
}
