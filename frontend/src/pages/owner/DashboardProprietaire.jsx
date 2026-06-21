import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Heart,
  Home,
  List,
  Loader2,
  MapPin,
  PlusCircle,
  Shield,
  ShieldAlert,
  Star,
  User,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import ScoreBadge from "../../components/ui/ScoreBadge";
import { useAuth } from "../../hooks/useAuth";
import { ownerApi } from "../../api/ownerApi";
import { usersApi } from "../../api/usersApi";

const sidebarLinks = [
  { to: "/dashboard-proprietaire", label: "Tableau de bord", icon: Home },
  { to: "/publier-annonce", label: "Publier une annonce", icon: PlusCircle },
  { to: "/mes-annonces", label: "Mes annonces", icon: List },
  { to: "/profil-proprietaire", label: "Mon profil", icon: User },
];

const statusMeta = {
  VALIDEE: {
    label: "Publiée",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  EN_ATTENTE: {
    label: "En vérification",
    icon: Clock,
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  },
  REJETEE: {
    label: "Rejetée",
    icon: XCircle,
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  SUSPENDUE: {
    label: "Suspendue",
    icon: ShieldAlert,
    className: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  },
  ARCHIVEE: {
    label: "Archivée",
    icon: List,
    className: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
  },
};

function formatDate(value) {
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusPill({ statut }) {
  const meta = statusMeta[statut] || statusMeta.EN_ATTENTE;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function RecentAnnonce({ annonce }) {
  const image = annonce.photos?.[0];

  return (
    <article className="flex gap-4 rounded-2xl border border-gray-100 bg-white/75 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-white/5">
      <div className="h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
        {image ? (
          <img
            src={image}
            alt={annonce.titre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-400">
            <Home className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-display text-base font-bold text-gray-900 dark:text-white">
              {annonce.titre}
            </h3>
            <p className="mt-1 flex min-w-0 items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {annonce.ville} - {annonce.adresse}
              </span>
            </p>
          </div>
          <div className="flex-shrink-0">
            <StatusPill statut={annonce.statut} />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-900 dark:bg-white/10 dark:text-white">
            {Number(annonce.loyer || 0).toLocaleString("fr-FR")} MAD
          </span>
          <ScoreBadge score={annonce.scoreConfiance || 0} size="sm" />
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-600 dark:bg-white/10 dark:text-gray-300">
            <Heart className="h-3.5 w-3.5" />
            {annonce.favoris ?? 0}
          </span>
          {annonce.nbSignalements > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-600 dark:bg-red-500/10 dark:text-red-300">
              <AlertCircle className="h-3.5 w-3.5" />
              {annonce.nbSignalements}
            </span>
          )}
        </div>

        <p className="mt-3 text-xs text-gray-400">
          Publiée {formatDate(annonce.datePublication)}
        </p>
      </div>
    </article>
  );
}

export default function DashboardProprietaire({ isDark, onToggleTheme }) {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(user || null);
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileRes = await usersApi.getMe();
        if (!mounted) return;

        const loadedProfile = profileRes.data || {};
        setProfile(loadedProfile);
        updateUser(loadedProfile);

        const annoncesRes = await ownerApi.getOwnerAnnonces(loadedProfile.id);
        if (!mounted) return;
        setAnnonces(annoncesRes.data || []);
      } catch (err) {
        if (mounted) {
          setError(
            err?.response?.data?.detail ||
              "Impossible de charger le tableau de bord.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      mounted = false;
    };
  }, [updateUser]);

  const stats = useMemo(() => {
    const active = annonces.filter(
      (annonce) => annonce.statut === "VALIDEE",
    ).length;
    const pending = annonces.filter(
      (annonce) => annonce.statut === "EN_ATTENTE",
    ).length;
    const rejected = annonces.filter(
      (annonce) =>
        annonce.statut === "REJETEE" || annonce.statut === "SUSPENDUE",
    ).length;
    const favorites = annonces.reduce(
      (sum, annonce) => sum + Number(annonce.favoris || 0),
      0,
    );
    const reports = annonces.reduce(
      (sum, annonce) => sum + Number(annonce.nbSignalements || 0),
      0,
    );
    const scored = annonces.filter(
      (annonce) =>
        annonce.scoreConfiance !== null && annonce.scoreConfiance !== undefined,
    );
    const averageScore = scored.length
      ? Math.round(
          scored.reduce(
            (sum, annonce) => sum + Number(annonce.scoreConfiance || 0),
            0,
          ) / scored.length,
        )
      : 0;

    return { active, pending, rejected, favorites, reports, averageScore };
  }, [annonces]);

  const recentAnnonces = annonces.slice(0, 3);
  const ownerName = profile?.prenom || profile?.nom || "propriétaire";
  const note =
    profile?.noteMoyenne !== null && profile?.noteMoyenne !== undefined
      ? `${Number(profile.noteMoyenne).toFixed(1)}/5`
      : "-/5";

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
            Bonjour, {ownerName}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Suivez vos annonces, vos validations et les signaux importants.
          </p>
        </div>
        <Link
          to="/publier-annonce"
          className="btn-primary inline-flex items-center justify-center gap-2 text-sm"
        >
          <PlusCircle className="h-4 w-4" />
          Nouvelle annonce
        </Link>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="glass-light flex h-72 items-center justify-center rounded-2xl text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement du tableau de bord...
        </div>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={List}
              label="Annonces validées"
              value={stats.active}
              color="indigo"
            />
            <StatCard
              icon={Clock}
              label="En vérification"
              value={stats.pending}
              color="orange"
            />
            <StatCard
              icon={Heart}
              label="Favoris reçus"
              value={stats.favorites}
              color="red"
            />
            <StatCard
              icon={Star}
              label="Note moyenne"
              value={note}
              color="green"
            />
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="glass-light rounded-2xl p-6">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                    Annonces récentes
                  </h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Les dernières publications liées à votre compte.
                  </p>
                </div>
                <Link
                  to="/mes-annonces"
                  className="text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  Voir tout
                </Link>
              </div>

              {recentAnnonces.length > 0 ? (
                <div className="space-y-4">
                  {recentAnnonces.map((annonce) => (
                    <RecentAnnonce key={annonce.id} annonce={annonce} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 p-8 text-center dark:border-white/10 dark:bg-white/5">
                  <Home className="mx-auto h-9 w-9 text-gray-400" />
                  <h3 className="mt-3 font-display text-base font-semibold text-gray-900 dark:text-white">
                    Aucune annonce pour le moment
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
                    Publiez votre premier logement pour commencer à suivre sa
                    validation ici.
                  </p>
                  <Link
                    to="/publier-annonce"
                    className="btn-primary mt-4 inline-flex items-center gap-2 text-sm"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Publier une annonce
                  </Link>
                </div>
              )}
            </section>

            <aside className="space-y-6">
              <div className="glass-light rounded-2xl p-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                      profile?.estVerifieCin
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300"
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-gray-900 dark:text-white">
                      {profile?.estVerifieCin
                        ? "Profil vérifié"
                        : "Vérification CIN"}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {profile?.estVerifieCin
                        ? "Votre badge propriétaire est actif."
                        : "Validation admin encore requise."}
                    </p>
                  </div>
                </div>
                <Link
                  to="/profil-proprietaire"
                  className="mt-4 inline-flex text-sm font-semibold text-primary-600 hover:underline dark:text-primary-400"
                >
                  Ouvrir mon profil
                </Link>
              </div>

              <div className="glass-light rounded-2xl p-6">
                <h3 className="font-display font-semibold text-gray-900 dark:text-white">
                  Résumé de modération
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Score IA moyen
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.averageScore}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Annonces bloquées
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.rejected}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Signalements
                    </span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {stats.reports}
                    </span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
