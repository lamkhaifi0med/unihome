import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Heart,
  Home,
  Loader2,
  MessageCircle,
  Save,
  Search,
  User,
} from 'lucide-react'
import DashboardLayout from '../../layouts/DashboardLayout'
import { useAuth } from '../../hooks/useAuth'
import { usersApi } from '../../api/usersApi'
import { ownerApi } from '../../api/ownerApi'

const sidebarLinks = [
  { to: '/dashboard-etudiant', label: 'Tableau de bord', icon: Home },
  { to: '/favoris', label: 'Mes favoris', icon: Heart },
  { to: '/profil', label: 'Mon profil', icon: User },
  { to: '/search', label: 'Rechercher', icon: Search },
  { to: '/chatbot', label: 'Assistant IA', icon: MessageCircle },
]

const emptyForm = {
  nom: '',
  prenom: '',
  email: '',
  universiteId: '',
  villeRecherche: '',
  budgetMax: '',
}

export default function ProfilEtudiant({ isDark, onToggleTheme }) {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState(emptyForm)
  const [universites, setUniversites] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let mounted = true

    const loadProfile = async () => {
      try {
        setLoading(true)
        const [profileRes, universitesRes] = await Promise.all([
          usersApi.getMe(),
          ownerApi.getUniversites(),
        ])

        if (!mounted) return

        const profile = profileRes.data || {}
        setForm({
          nom: profile.nom || '',
          prenom: profile.prenom || '',
          email: profile.email || '',
          universiteId: profile.universiteId || '',
          villeRecherche: profile.villeRecherche || '',
          budgetMax: profile.budgetMax ?? '',
        })
        setUniversites(universitesRes.data || [])
        updateUser(profile)
      } catch (error) {
        if (mounted) {
          setMessage({
            type: 'error',
            text: error?.response?.data?.detail || 'Impossible de charger votre profil.',
          })
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProfile()
    return () => {
      mounted = false
    }
  }, [updateUser])

  const cityOptions = useMemo(() => {
    return [...new Set(universites.map((u) => u.ville).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    )
  }, [universites])

  const selectedUniversity = universites.find((u) => String(u.id) === String(form.universiteId))
  const completedItems = [
    form.nom.trim(),
    form.prenom.trim(),
    form.universiteId,
    form.villeRecherche,
    form.budgetMax,
  ].filter(Boolean).length
  const completion = Math.round((completedItems / 5) * 100)

  const set = (key) => (event) => {
    const value = event.target.value
    setForm((current) => ({ ...current, [key]: value }))
    setMessage(null)
  }

  const handleUniversityChange = (event) => {
    const universiteId = event.target.value
    const universite = universites.find((u) => String(u.id) === String(universiteId))
    setForm((current) => ({
      ...current,
      universiteId,
      villeRecherche: universite?.ville || current.villeRecherche,
    }))
    setMessage(null)
  }

  const handleSave = async (event) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        universiteId: form.universiteId || null,
        villeRecherche: form.villeRecherche || null,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
      }
      const response = await usersApi.updateMe(payload)
      const savedProfile = response.data || {}
      updateUser(savedProfile)
      setForm((current) => ({
        ...current,
        ...savedProfile,
        universiteId: savedProfile.universiteId || current.universiteId,
        budgetMax: savedProfile.budgetMax ?? current.budgetMax,
      }))
      setMessage({ type: 'success', text: 'Profil sauvegarde avec succes.' })
    } catch (error) {
      setMessage({
        type: 'error',
        text: error?.response?.data?.detail || 'Impossible de sauvegarder votre profil.',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">Mon profil</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Completez vos informations pour recevoir des annonces mieux adaptees.
        </p>
      </div>

      <div className="grid xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="glass-light rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-primary-500/20">
              {(form.prenom || form.nom || user?.nom || 'E')[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-gray-900 dark:text-white truncate">
                {[form.prenom, form.nom].filter(Boolean).join(' ') || 'Etudiant'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{form.email}</p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Profil complete</span>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-300">{completion}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Universite, ville et budget aident UniHome a classer les logements les plus pertinents.
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/70 dark:bg-indigo-500/10 p-4">
            <div className="flex items-start gap-3">
              <GraduationCap className="w-5 h-5 text-indigo-600 dark:text-indigo-300 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {selectedUniversity?.nom || 'Universite non definie'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {form.villeRecherche || 'Ville recherchee non definie'}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="glass-light rounded-2xl p-6">
          {loading ? (
            <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Chargement du profil...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/10">
                <div>
                  <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">
                    Informations et preferences
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Ces champs remplissent votre ligne etudiant dans la base.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Sauvegarder
                </button>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                    message.type === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300'
                  }`}
                >
                  {message.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Prenom
                  </label>
                  <input type="text" value={form.prenom} onChange={set('prenom')} className="input-field" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Nom
                  </label>
                  <input type="text" value={form.nom} onChange={set('nom')} className="input-field" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Email
                </label>
                <input type="email" value={form.email} disabled className="input-field opacity-70 cursor-not-allowed" />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Universite
                  </label>
                  <select value={form.universiteId} onChange={handleUniversityChange} className="input-field">
                    <option value="">Selectionner une universite</option>
                    {universites.map((universite) => (
                      <option key={universite.id} value={universite.id}>
                        {universite.nom} - {universite.ville}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Ville recherchee
                  </label>
                  <select value={form.villeRecherche} onChange={set('villeRecherche')} className="input-field">
                    <option value="">Selectionner une ville</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                  Budget maximum mensuel
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={form.budgetMax}
                    onChange={set('budgetMax')}
                    placeholder="Ex: 2500"
                    className="input-field pr-16"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
                    MAD
                  </span>
                </div>
              </div>
            </form>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
