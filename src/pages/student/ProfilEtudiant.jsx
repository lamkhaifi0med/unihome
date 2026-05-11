import { useState } from 'react'
import { Heart, Home, Search, User, MessageCircle, Camera, Save } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { universites, villes } from '../../data/mockData'

const sidebarLinks = [
  { to: '/dashboard-etudiant', label: 'Tableau de bord', icon: Home },
  { to: '/favoris', label: 'Mes favoris', icon: Heart },
  { to: '/profil', label: 'Mon profil', icon: User },
  { to: '/search', label: 'Rechercher', icon: Search },
  { to: '/chatbot', label: 'Assistant IA', icon: MessageCircle },
]

export default function ProfilEtudiant({ isDark, onToggleTheme }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    nom: user?.nom || '',
    email: user?.email || '',
    universite: user?.universite || '',
    ville: '',
    budgetMax: '',
    telephone: '',
  })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleSave = (e) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Mon Profil</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gérez vos informations et préférences</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar */}
        <div className="glass-light rounded-2xl p-6 text-center h-fit">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-3xl font-bold">
              {user?.nom?.[0] || 'U'}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/20 flex items-center justify-center text-gray-500 hover:text-primary-600 transition-colors shadow-sm">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-display font-bold text-gray-900 dark:text-white">{user?.nom}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{user?.email}</p>
          <span className="inline-block mt-3 px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs rounded-full font-medium">
            Étudiant
          </span>
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/10">
            <p className="text-xs text-gray-400">Membre depuis</p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Janvier 2026</p>
          </div>
        </div>

        {/* Form */}
        <div className="lg:col-span-2 glass-light rounded-2xl p-6">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-5">Informations personnelles</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nom complet</label>
                <input type="text" value={form.nom} onChange={set('nom')} className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Téléphone</label>
                <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="+212 6..." className="input-field" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="input-field" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Université</label>
                <select value={form.universite} onChange={set('universite')} className="input-field">
                  <option value="">Sélectionner</option>
                  {universites.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Ville recherchée</label>
                <select value={form.ville} onChange={set('ville')} className="input-field">
                  <option value="">Sélectionner</option>
                  {villes.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Budget maximum (MAD/mois)</label>
              <input type="number" value={form.budgetMax} onChange={set('budgetMax')} placeholder="Ex: 2500" className="input-field" />
            </div>

            <div className="flex items-center justify-between pt-2">
              {saved && <span className="text-emerald-600 dark:text-emerald-400 text-sm">✓ Profil sauvegardé !</span>}
              <button type="submit" className="btn-primary flex items-center gap-2 ml-auto">
                <Save className="w-4 h-4" /> Sauvegarder
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  )
}
