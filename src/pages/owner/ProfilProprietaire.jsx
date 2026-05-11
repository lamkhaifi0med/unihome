import { useState } from 'react'
import { Home, PlusCircle, List, User, Camera, Save, Shield, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'

const sidebarLinks = [
  { to: '/dashboard-proprietaire', label: 'Tableau de bord', icon: Home },
  { to: '/publier-annonce', label: 'Publier une annonce', icon: PlusCircle },
  { to: '/mes-annonces', label: 'Mes annonces', icon: List },
  { to: '/profil-proprietaire', label: 'Mon profil', icon: User },
]

export default function ProfilProprietaire({ isDark, onToggleTheme }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ nom: user?.nom || '', email: user?.email || '', telephone: '', cin: '' })

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))
  const handleSave = (e) => { e.preventDefault(); setSaved(true); setTimeout(() => setSaved(false), 2500) }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Mon Profil</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gérez vos informations et votre vérification CIN</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="glass-light rounded-2xl p-6 text-center h-fit">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
              {user?.nom?.[0] || 'P'}
            </div>
            <button className="absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-white dark:bg-dark-700 border border-gray-200 dark:border-white/20 flex items-center justify-center text-gray-500 hover:text-primary-600 shadow-sm">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <h3 className="font-display font-bold text-gray-900 dark:text-white">{user?.nom}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
          <span className="inline-block mt-3 px-3 py-1 bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 text-xs rounded-full font-medium">Propriétaire</span>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-left">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
              <Shield className="w-3.5 h-3.5" /> Vérification CIN en attente
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">Soumettez votre CIN pour obtenir le badge vérifié et booster votre score.</p>
          </div>
        </div>

        <div className="lg:col-span-2 glass-light rounded-2xl p-6">
          <h3 className="font-display font-semibold text-gray-900 dark:text-white mb-5">Informations personnelles</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Nom complet</label>
              <input type="text" value={form.nom} onChange={set('nom')} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={set('email')} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Téléphone</label>
              <input type="tel" value={form.telephone} onChange={set('telephone')} placeholder="+212 6..." className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Numéro CIN (pour vérification)</label>
              <input type="text" value={form.cin} onChange={set('cin')} placeholder="Ex: BE123456" className="input-field" />
              <p className="text-xs text-gray-400 mt-1">Votre CIN sera vérifiée par notre équipe sous 24-48h.</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              {saved && <span className="text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Sauvegardé !</span>}
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
