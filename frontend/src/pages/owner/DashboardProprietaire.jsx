/**
 * Dashboard propriétaire — Control Room, itération "santé d'abord".
 * Le tableau lit la santé du parc : score moyen, diagnostic de l'annonce
 * la plus fragile, et une liste triée par urgence (la plus faible en tête)
 * avec le critère faible nommé et l'action à prendre.
 * Animations : motion (lib) — stagger d'entrée, gated reduced-motion.
 */
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Heart,
  Home,
  List,
  PlusCircle,
  Shield,
  ShieldAlert,
  Sparkles,
  Star,
  User,
  Wrench,
  XCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "motion/react";
import DashboardLayout from "../../layouts/DashboardLayout";
import ScoreBadge from "../../components/ui/ScoreBadge";
import ScoreGauge from "../../components/ui/ScoreGauge";
import { CriteriaChart, PipelineChart } from "../../components/ui/charts";
import { MiniFunnel, verdictColor } from "../../components/ui/instruments";
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
      "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  },
  EN_ATTENTE: {
    label: "En vérification",
    icon: Clock,
    className:
      "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  REJETEE: {
    label: "Rejetée",
    icon: XCircle,
    className: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300",
  },
  SUSPENDUE: {
    label: "Suspendue",
    icon: ShieldAlert,
    className: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-300",
  },
  ARCHIVEE: {
    label: "Archivée",
    icon: List,
    className: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  },
};

const CRITERIA_LABELS = {
  justificatif: "justificatif",
  photos: "photos",
  prix: "prix",
  description: "description",
  texte: "description",
  coherence: "cohérence",
};

const CRITERIA_ADVICE = {
  justificatif: "Ajoutez un justificatif d'adresse net et lisible.",
  photos: "Ajoutez des photos claires et variées (2 à 10).",
  prix: "Alignez le loyer sur le marché de votre quartier.",
  description: "Détaillez la description : surface, quartier, conditions.",
  texte: "Détaillez la description : surface, quartier, conditions.",
  coherence: "Vérifiez la cohérence entre photos, prix et description.",
};

function weakestCriterion(detailScore) {
  if (!detailScore || Object.keys(detailScore).length === 0) return null;
  let weakest = null;
  for (const [key, value] of Object.entries(detailScore)) {
    if (!(key in CRITERIA_LABELS)) continue;
    const num = Number(value);
    if (Number.isNaN(num)) continue;
    if (!weakest || num < weakest.value) {
      weakest = { key, value: num };
    }
  }
  return weakest;
}

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

/**
 * One row of the health list: thumbnail, identity, status, score readout,
 * weakest criterion and the concrete action.
 */
function HealthRow({ annonce }) {
  const image = annonce.photos?.[0];
  const score = Number(annonce.scoreConfiance ?? 0);
  const weak = weakestCriterion(annonce.detailScore);
  const needsWork = weak && weak.value < 70 && annonce.statut !== "ARCHIVEE";

  return (
    <article className="group flex gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-shadow hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        {image ? (
          <img
            src={image}
            alt={annonce.titre}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-500">
            <Home className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-geist text-base font-bold text-zinc-950 dark:text-zinc-50">
              {annonce.titre}
            </h3>
            <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
              {annonce.ville} ·{" "}
              {Number(annonce.loyer || 0).toLocaleString("fr-FR")} MAD
            </p>
          </div>
          <StatusPill statut={annonce.statut} />
        </div>

        {/* score line */}
        <div className="mt-2.5 flex items-center gap-3">
          <span
            className="font-mono text-sm font-semibold tabular-nums"
            style={{ color: verdictColor(score) }}
          >
            {score}
          </span>
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(score, 100)}%`,
                backgroundColor: verdictColor(score),
              }}
            />
          </div>
          <MiniFunnel
            vues={Number(annonce.nbVues || 0)}
            favoris={Number(annonce.favoris || 0)}
          />
        </div>

        {/* weakest criterion + action, or all-clear */}
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
          {needsWork ? (
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-amber-700 dark:text-amber-300">
              <Wrench className="h-3 w-3" />
              point faible : {CRITERIA_LABELS[weak.key]} ({weak.value}/100)
            </span>
          ) : (
            <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              {annonce.nbSignalements > 0 ? (
                <span className="inline-flex items-center gap-1 text-red-600 dark:text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {annonce.nbSignalements} signalement
                  {annonce.nbSignalements > 1 ? "s" : ""}
                </span>
              ) : (
                `publiée ${formatDate(annonce.datePublication)}`
              )}
            </span>
          )}
          <Link
            to="/mes-annonces"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 dark:text-blue-400"
          >
            Gérer
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function DashboardProprietaire({ isDark, onToggleTheme }) {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
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

  // Weakest scored listing that has a real per-criteria breakdown — the
  // "Diagnostic IA" subject. Prefer non-archived listings.
  const diagnostic = useMemo(() => {
    const candidates = annonces.filter(
      (a) =>
        a.detailScore &&
        Object.keys(a.detailScore).length > 0 &&
        a.statut !== "ARCHIVEE",
    );
    if (!candidates.length) return null;
    return candidates.reduce((min, a) =>
      Number(a.scoreConfiance ?? 101) < Number(min.scoreConfiance ?? 101)
        ? a
        : min,
    );
  }, [annonces]);

  // Health list: non-archived listings, weakest score first, top 4.
  const healthList = useMemo(() => {
    return annonces
      .filter((a) => a.statut !== "ARCHIVEE")
      .slice()
      .sort(
        (a, b) =>
          Number(a.scoreConfiance ?? 101) - Number(b.scoreConfiance ?? 101),
      )
      .slice(0, 4);
  }, [annonces]);

  const ownerName = profile?.prenom || profile?.nom || "propriétaire";
  const note =
    profile?.noteMoyenne !== null && profile?.noteMoyenne !== undefined
      ? `${Number(profile.noteMoyenne).toFixed(1)}/5`
      : null;

  const diagnosticAdvice = useMemo(() => {
    if (!diagnostic) return null;
    const weak = weakestCriterion(diagnostic.detailScore);
    if (!weak || weak.value >= 70) return null;
    return CRITERIA_ADVICE[weak.key];
  }, [diagnostic]);

  // motion choreography — one stagger container, gated on reduced motion
  const containerVariants = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduced ? 0 : 0.09 },
    },
  };
  const cardVariants = {
    hidden: reduced ? { opacity: 1 } : { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
            Bonjour, {ownerName}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            La santé de vos annonces, ce qui bloque, et comment l'améliorer.
          </p>
        </div>
        <Link
          to="/publier-annonce"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700"
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
        <>
          <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="h-10 w-10 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-4 h-6 w-1/2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-3/4 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
        </>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* Hero instrument row: gauge + Diagnostic IA */}
          <div className="relative mb-6 grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <div className="pointer-events-none absolute -top-16 left-1/3 h-48 w-96 rounded-full bg-blue-600/[0.07] blur-3xl" />

            <motion.section
              variants={cardVariants}
              className="relative flex flex-col items-center justify-center rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)] dark:border-zinc-800 dark:bg-zinc-900"
            >
              <ScoreGauge score={stats.averageScore} label="Score IA moyen" />
              <div className="mt-4 flex w-full items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                <span className="inline-flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  {note ? (
                    <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                      {note}
                    </span>
                  ) : (
                    "Aucune note"
                  )}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span className="font-mono font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
                    {stats.favorites}
                  </span>
                  favoris
                </span>
              </div>
            </motion.section>

            <motion.section
              variants={cardVariants}
              className="relative rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="flex items-center gap-2 font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Diagnostic IA
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    {diagnostic
                      ? `Votre annonce la plus fragile : « ${diagnostic.titre} »`
                      : "Les 5 critères analysés à chaque publication."}
                  </p>
                </div>
                {diagnostic && (
                  <ScoreBadge
                    score={Number(diagnostic.scoreConfiance || 0)}
                    size="sm"
                  />
                )}
              </div>
              <div className="mt-5">
                {diagnostic ? (
                  <CriteriaChart detail={diagnostic.detailScore} />
                ) : (
                  <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400">
                    Publiez une annonce — l'IA la note sur 5 critères
                    (justificatif ×0.35, photos ×0.20, prix ×0.20, description
                    ×0.15, cohérence ×0.10) en ~30 secondes.
                  </div>
                )}
              </div>
              {(diagnosticAdvice || diagnostic?.raisonStatut) && (
                <div className="mt-4 rounded-xl bg-blue-50 px-4 py-3 text-[13px] leading-relaxed text-blue-900 dark:bg-blue-500/10 dark:text-blue-200">
                  {diagnosticAdvice && (
                    <p className="flex items-start gap-2 font-medium">
                      <Wrench className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                      {diagnosticAdvice}
                    </p>
                  )}
                  {diagnostic?.raisonStatut && (
                    <p className={diagnosticAdvice ? "mt-2 opacity-80" : ""}>
                      {diagnostic.raisonStatut}
                    </p>
                  )}
                </div>
              )}
            </motion.section>
          </div>

          {/* Status pipeline */}
          <motion.section
            variants={cardVariants}
            className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-geist text-base font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
                Pipeline de vos annonces
              </h2>
              <span className="font-mono text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                {annonces.length} au total
              </span>
            </div>
            <PipelineChart
              segments={[
                {
                  key: "VALIDEE",
                  label: "publiées",
                  count: stats.active,
                  color: "#059669",
                },
                {
                  key: "EN_ATTENTE",
                  label: "en vérification",
                  count: stats.pending,
                  color: "#d97706",
                },
                {
                  key: "BLOQUEE",
                  label: "rejetées / suspendues",
                  count: stats.rejected,
                  color: "#ef4444",
                },
                {
                  key: "ARCHIVEE",
                  label: "archivées",
                  count: annonces.filter((a) => a.statut === "ARCHIVEE").length,
                  color: "#d4d4d8",
                },
              ]}
              onNavigate={() => navigate("/mes-annonces")}
            />
          </motion.section>

          <div className="mb-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
            {/* Health list — weakest first */}
            <motion.section
              variants={cardVariants}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
                    Santé de vos annonces
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Triées par urgence — la plus fragile en premier.
                  </p>
                </div>
                <Link
                  to="/mes-annonces"
                  className="text-sm font-semibold text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
                >
                  Voir tout
                </Link>
              </div>

              {healthList.length > 0 ? (
                <div className="space-y-4">
                  {healthList.map((annonce) => (
                    <HealthRow key={annonce.id} annonce={annonce} />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:bg-zinc-800/60">
                  <Home className="mx-auto h-9 w-9 text-zinc-400 dark:text-zinc-500" />
                  <h3 className="mt-3 font-geist text-base font-semibold text-zinc-950 dark:text-zinc-50">
                    Aucune annonce pour le moment
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
                    Publiez votre premier logement pour commencer à suivre sa
                    validation ici.
                  </p>
                  <Link
                    to="/publier-annonce"
                    className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700"
                  >
                    <PlusCircle className="h-4 w-4" />
                    Publier une annonce
                  </Link>
                </div>
              )}
            </motion.section>

            <motion.aside variants={cardVariants} className="space-y-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                      profile?.estVerifieCin
                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                    }`}
                  >
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-geist font-semibold text-zinc-950 dark:text-zinc-50">
                      {profile?.estVerifieCin
                        ? "Profil vérifié"
                        : "Vérification CIN"}
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      {profile?.estVerifieCin
                        ? "Votre badge propriétaire est actif."
                        : "Validation admin encore requise."}
                    </p>
                  </div>
                </div>
                <Link
                  to="/profil-proprietaire"
                  className="mt-4 inline-flex text-sm font-semibold text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
                >
                  Ouvrir mon profil
                </Link>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
                <h3 className="font-geist font-semibold text-zinc-950 dark:text-zinc-50">
                  Résumé de modération
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Score IA moyen
                    </span>
                    <span className="font-mono text-[13px] font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {stats.averageScore} / 100
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Annonces bloquées
                    </span>
                    <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {stats.rejected}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 dark:text-zinc-400">
                      Signalements
                    </span>
                    <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                      {stats.reports}
                    </span>
                  </div>
                </div>
              </div>
            </motion.aside>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
