import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  Archive,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Home,
  Images,
  List,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  PlusCircle,
  ShieldAlert,
  User,
  XCircle,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout from '../../layouts/DashboardLayout'
import ScoreBadge from '../../components/ui/ScoreBadge'
import { useAuth } from '../../hooks/useAuth'
import { ownerApi } from '../../api/ownerApi'

const sidebarLinks = [
  { to: '/dashboard-proprietaire', label: 'Tableau de bord', icon: Home },
  { to: '/publier-annonce', label: 'Publier une annonce', icon: PlusCircle },
  { to: '/mes-annonces', label: 'Mes annonces', icon: List },
  { to: '/profil-proprietaire', label: 'Mon profil', icon: User },
]

const statusMeta = {
  VALIDEE: {
    label: 'Publiee',
    icon: CheckCircle,
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
    tone: 'border-emerald-200 dark:border-emerald-500/20',
  },
  EN_ATTENTE: {
    label: 'En verification',
    icon: Clock,
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
    tone: 'border-amber-200 dark:border-amber-500/20',
  },
  REJETEE: {
    label: 'Rejetee',
    icon: XCircle,
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    tone: 'border-red-200 dark:border-red-500/20',
  },
  SUSPENDUE: {
    label: 'Suspendue',
    icon: ShieldAlert,
    className: 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300',
    tone: 'border-red-200 dark:border-red-500/20',
  },
  ARCHIVEE: {
    label: 'Archivee',
    icon: Archive,
    className: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300',
    tone: 'border-gray-200 dark:border-white/10',
  },
}

const contactIcons = {
  TELEPHONE: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  FACEBOOK: MessageCircle,
  INSTAGRAM: MessageCircle,
}

function formatDate(value) {
  if (!value) return 'Date inconnue'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function StatusPill({ statut }) {
  const meta = statusMeta[statut] || statusMeta.EN_ATTENTE
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  )
}

function AnnonceCard({ annonce }) {
  const [open, setOpen] = useState(false)
  const meta = statusMeta[annonce.statut] || statusMeta.EN_ATTENTE
  const image = annonce.photos?.[0]
  const contacts = annonce.contacts || []
  const equipements = annonce.equipements || []
  const photoCount = annonce.photos?.length || 0

  return (
    <article className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-white/5 ${meta.tone}`}>
      <div className="flex flex-col md:flex-row">
        <div
          className="relative flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-white/5"
          style={{ width: 168, height: 148, flexBasis: 168 }}
        >
          {image ? (
            <img src={image} alt={annonce.titre} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400">
              <Home className="h-8 w-8" />
            </div>
          )}
          {photoCount > 1 && (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-semibold text-white">
              <Images className="h-3 w-3" />
              {photoCount}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold leading-tight text-gray-900 dark:text-white">{annonce.titre}</h2>
                <StatusPill statut={annonce.statut} />
              </div>
              <div className="mt-2 flex min-w-0 items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{annonce.ville} · {annonce.adresse}</span>
              </div>
            </div>
            <button type="button" onClick={() => setOpen((value) => !value)} className="inline-flex shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 shadow-sm transition-colors hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200 dark:hover:text-primary-300">
              {open ? 'Masquer' : 'Details'}
            </button>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr_0.85fr]">
            <div className="rounded-xl bg-gray-50 px-4 py-3 dark:bg-white/5">
              <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Loyer mensuel</p>
              <p className="mt-1 font-display text-2xl font-bold leading-none text-gray-900 dark:text-white">
                {Number(annonce.loyer || 0).toLocaleString('fr-FR')} MAD
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {annonce.chargesIncluses ? 'Charges incluses' : 'Charges non incluses'}
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-white/10">
              <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Logement</p>
              <p className="mt-1 text-sm font-semibold text-gray-800 dark:text-gray-100">{annonce.typeLogement}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{annonce.superficie || '-'} m2</p>
            </div>
            <div className="rounded-xl border border-gray-200 px-4 py-3 dark:border-white/10">
              <p className="text-xs font-medium uppercase text-gray-400 dark:text-gray-500">Confiance</p>
              <div className="mt-2">
                <ScoreBadge score={annonce.scoreConfiance || 0} size="sm" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-white/10">
              <Eye className="h-3.5 w-3.5" /> Vues -
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 dark:bg-white/10">
              <Heart className="h-3.5 w-3.5" /> {annonce.favoris ?? 0} favoris
            </span>
            {equipements.slice(0, 6).map((equipement) => (
              <span key={equipement} className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                {equipement}
              </span>
            ))}
            {equipements.length > 6 && (
              <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-medium text-gray-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-300">
                +{equipements.length - 6}
              </span>
            )}
          </div>

          {annonce.raisonStatut && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{annonce.raisonStatut}</span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-white/10 dark:text-gray-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 dark:border-white/10">
              <CalendarDays className="h-3.5 w-3.5" />
              Publiee {formatDate(annonce.datePublication)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2.5 py-1 dark:border-white/10">
              <Images className="h-3.5 w-3.5" />
              {photoCount} photo{photoCount > 1 ? 's' : ''}
            </span>
          </div>

          {open && (
            <div className="mt-4 grid gap-4 border-t border-gray-200 pt-4 dark:border-white/10 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-white">Description</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{annonce.description}</p>
              </div>
              <div>
                <h3 className="font-display text-sm font-semibold text-gray-900 dark:text-white">Contacts</h3>
                <div className="mt-2 space-y-2">
                  {contacts.map((contact) => {
                    const Icon = contactIcons[contact.plateforme] || Phone
                    return (
                      <div key={`${contact.plateforme}-${contact.valeur}`} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Icon className="h-4 w-4 text-primary-500" />
                        <span className="font-medium">{contact.plateforme}</span>
                        <span>{contact.valeur}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default function MesAnnonces({ isDark, onToggleTheme }) {
  const { user } = useAuth()
  const [annonces, setAnnonces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('TOUTES')

  useEffect(() => {
    if (!user?.id) return
    let isMounted = true
    setLoading(true)
    ownerApi.getOwnerAnnonces(user.id)
      .then((res) => {
        if (isMounted) setAnnonces(res.data || [])
      })
      .catch((err) => {
        const serverMsg = err?.response?.data?.message || err?.response?.data?.detail
        if (isMounted) setError(serverMsg || 'Impossible de charger vos annonces.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [user?.id])

  const counts = useMemo(() => {
    return annonces.reduce((acc, annonce) => {
      acc.total += 1
      acc[annonce.statut] = (acc[annonce.statut] || 0) + 1
      return acc
    }, { total: 0 })
  }, [annonces])

  const filteredAnnonces = useMemo(() => {
    if (filter === 'TOUTES') return annonces
    return annonces.filter((annonce) => annonce.statut === filter)
  }, [annonces, filter])

  return (
    <DashboardLayout sidebarLinks={sidebarLinks} isDark={isDark} onToggleTheme={onToggleTheme}>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">Mes annonces</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Suivez la publication, la moderation et les details de vos logements.
          </p>
        </div>
        <Link to="/publier-annonce" className="btn-primary flex items-center justify-center gap-2 text-sm">
          <PlusCircle className="h-4 w-4" /> Nouvelle annonce
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <button type="button" onClick={() => setFilter('TOUTES')} className={`rounded-2xl border p-4 text-left transition-all ${filter === 'TOUTES' ? 'border-primary-300 bg-primary-50 dark:border-primary-500/40 dark:bg-primary-500/10' : 'border-gray-200 bg-white/70 dark:border-white/10 dark:bg-white/5'}`}>
          <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
          <p className="mt-1 font-display text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
        </button>
        {['VALIDEE', 'EN_ATTENTE', 'REJETEE', 'SUSPENDUE'].map((status) => {
          const meta = statusMeta[status]
          return (
            <button key={status} type="button" onClick={() => setFilter(status)} className={`rounded-2xl border p-4 text-left transition-all ${filter === status ? 'border-primary-300 bg-primary-50 dark:border-primary-500/40 dark:bg-primary-500/10' : 'border-gray-200 bg-white/70 dark:border-white/10 dark:bg-white/5'}`}>
              <p className="text-xs text-gray-500 dark:text-gray-400">{meta.label}</p>
              <p className="mt-1 font-display text-2xl font-bold text-gray-900 dark:text-white">{counts[status] || 0}</p>
            </button>
          )
        })}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />
          ))}
        </div>
      ) : filteredAnnonces.length > 0 ? (
        <div className="mx-auto max-w-5xl space-y-4">
          {filteredAnnonces.map((annonce) => (
            <AnnonceCard key={annonce.id} annonce={annonce} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-10 text-center dark:border-white/15 dark:bg-white/5">
          <Home className="mx-auto h-10 w-10 text-gray-400" />
          <h2 className="mt-4 font-display text-lg font-bold text-gray-900 dark:text-white">Aucune annonce trouvee</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            Publiez un logement ou changez le filtre de statut pour retrouver vos annonces.
          </p>
          <Link to="/publier-annonce" className="btn-primary mt-5 inline-flex">
            Publier une annonce
          </Link>
        </div>
      )}
    </DashboardLayout>
  )
}
