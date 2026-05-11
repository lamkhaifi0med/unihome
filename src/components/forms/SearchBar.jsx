import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, GraduationCap, Banknote, Home, SlidersHorizontal } from 'lucide-react'
import { villes, universites, typesLogement } from '../../data/mockData'

export default function SearchBar({ onSearch, compact = false }) {
  const navigate = useNavigate()
  const [filters, setFilters] = useState({
    ville: '',
    universite: '',
    budgetMax: '',
    type: '',
  })

  const set = (key) => (e) => setFilters(f => ({ ...f, [key]: e.target.value }))

  const handleSearch = () => {
    if (onSearch) onSearch(filters)
    else navigate('/annonces')
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <select value={filters.ville} onChange={set('ville')} className="input-field text-sm py-2">
          <option value="">Ville</option>
          {villes.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
        <button onClick={handleSearch} className="btn-primary text-sm py-2 whitespace-nowrap">
          Rechercher
        </button>
      </div>
    )
  }

  return (
    <div className="glass-light rounded-2xl p-3 shadow-xl shadow-black/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filters.ville} onChange={set('ville')} className="input-field pl-9 text-sm">
            <option value="">Ville / Campus</option>
            {villes.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <div className="relative">
          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select value={filters.universite} onChange={set('universite')} className="input-field pl-9 text-sm">
            <option value="">Université</option>
            {universites.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <div className="relative">
          <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="number"
            placeholder="Budget max (MAD)"
            value={filters.budgetMax}
            onChange={set('budgetMax')}
            className="input-field pl-9 text-sm"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Home className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select value={filters.type} onChange={set('type')} className="input-field pl-9 text-sm">
              <option value="">Type</option>
              {typesLogement.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button onClick={handleSearch} className="btn-primary text-sm whitespace-nowrap flex items-center gap-1.5">
            <SlidersHorizontal className="w-4 h-4" />
            Filtrer
          </button>
        </div>
      </div>
    </div>
  )
}
