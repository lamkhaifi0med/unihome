import { useState } from 'react'
import { LayoutDashboard, Shield, Flag, Users, Search, Ban, CheckCircle } from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { utilisateursAdmin } from '../../data/mockData'

const sidebarLinks = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/admin/moderation', label: 'Modération', icon: Shield },
  { to: '/admin/signalements', label: 'Signalements', icon: Flag },
  { to: '/admin/utilisateurs', label: 'Utilisateurs', icon: Users },
]

const roleColors = {
  ETUDIANT: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400',
  PROPRIETAIRE: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  ADMIN: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
}

const statutColors = {
  ACTIF: 'text-emerald-600 dark:text-emerald-400',
  SUSPENDU: 'text-red-600 dark:text-red-400',
}

export default function AdminUtilisateurs({ isDark, onToggleTheme }) {
  const [search, setSearch] = useState('')
  const [users, setUsers] = useState(utilisateursAdmin)

  const filtered = users.filter(u =>
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const toggleSuspend = (id) => setUsers(prev => prev.map(u => u.id === id ? { ...u, statut: u.statut === 'ACTIF' ? 'SUSPENDU' : 'ACTIF' } : u))

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Gestion des Utilisateurs</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{users.length} utilisateurs inscrits</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Rechercher par nom ou email..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-11" />
      </div>

      {/* Table */}
      <div className="glass-light rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-gray-200 dark:border-white/10">
              <tr>
                {['Utilisateur', 'Rôle', 'Statut', 'Inscription', 'Actions'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {u.nom[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.nom}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-sm font-medium ${statutColors[u.statut]}`}>{u.statut}</span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">{u.dateInscription}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => toggleSuspend(u.id)} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${u.statut === 'ACTIF' ? 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200'}`}>
                      {u.statut === 'ACTIF' ? <><Ban className="w-3 h-3" /> Suspendre</> : <><CheckCircle className="w-3 h-3" /> Réactiver</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
