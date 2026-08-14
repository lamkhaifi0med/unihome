import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Shield,
  Flag,
  Users,
  Clock,
  ArrowRight,
  ChevronDown,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { ScoreRuler, verdictColor } from "../../components/ui/instruments";
import { CriteriaChart, DonutChart } from "../../components/ui/charts";
import { adminApi } from "../../api/adminApi";

const sidebarLinks = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/moderation", label: "Modération", icon: Shield },
  { to: "/admin/signalements", label: "Signalements", icon: Flag },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

function QueueRow({ annonce, expanded, onToggle }) {
  const score = Number(annonce.scoreConfiance ?? 0);
  const hasDetail =
    annonce.detailScore && Object.keys(annonce.detailScore).length > 0;
  const reports = Number(annonce.nbSignalements || 0);

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        {annonce.photos?.[0] ? (
          <img
            src={annonce.photos[0]}
            alt={annonce.titre}
            className="h-14 w-14 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="h-14 w-14 flex-shrink-0 rounded-lg bg-zinc-100 dark:bg-zinc-800" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {annonce.titre}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {annonce.ville}
                {annonce.proprietaireNom && (
                  <>
                    <span className="mx-1.5 text-zinc-300 dark:text-zinc-600">
                      ·
                    </span>
                    {annonce.proprietairePrenom} {annonce.proprietaireNom}
                    {annonce.proprietaireVerifieCin && (
                      <span className="ml-1 text-emerald-600 dark:text-emerald-400">
                        ✓ CIN
                      </span>
                    )}
                  </>
                )}
              </p>
            </div>
            <div className="flex flex-shrink-0 items-center gap-2">
              <span
                className="font-mono text-sm font-semibold tabular-nums"
                style={{ color: verdictColor(score) }}
              >
                {score} / 100
              </span>
              {hasDetail && (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded={expanded}
                  aria-label={
                    expanded ? "Masquer le détail IA" : "Voir le détail IA"
                  }
                  className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 dark:text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
                >
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
                  />
                </button>
              )}
            </div>
          </div>
          <div className="mt-2 max-w-xs">
            <ScoreRuler score={score} />
          </div>
          {reports > 0 && (
            <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-500/10 px-2.5 py-1 text-[11px] font-medium text-red-700 dark:text-red-300">
              <AlertTriangle className="h-3 w-3" />
              {reports}/3 signalements — suspension automatique à 3
            </p>
          )}
          {expanded && hasDetail && (
            <div className="mt-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 p-4">
              <CriteriaChart detail={annonce.detailScore} height={160} />
              <Link
                to="/admin/moderation"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline"
              >
                Ouvrir dans la modération
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard({ isDark, onToggleTheme }) {
  const [stats, setStats] = useState(null);
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    Promise.all([adminApi.getStats(), adminApi.getQueue()])
      .then(([statsRes, queueRes]) => {
        setStats(statsRes.data);
        setQueue(queueRes.data);
        const first = (queueRes.data || []).find(
          (a) =>
            a.statut === "EN_ATTENTE" &&
            a.detailScore &&
            Object.keys(a.detailScore).length > 0,
        );
        if (first) setExpandedId(first.id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <DashboardLayout
        sidebarLinks={sidebarLinks}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      >
        <div className="mb-8">
          <div className="h-7 w-72 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="mt-3 h-4 w-52 animate-pulse rounded-full bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="h-96 animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
            <div className="h-40 animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const enAttente = queue.filter((a) => a.statut === "EN_ATTENTE");
  const donutItems = [
    {
      label: "validées",
      count: Number(stats?.annoncesValidees ?? 0),
      color: "#059669",
    },
    {
      label: "en attente",
      count: Number(stats?.annoncesEnAttente ?? 0),
      color: "#d97706",
    },
    {
      label: "suspendues",
      count: Number(stats?.annoncesSuspendues ?? 0),
      color: "#ef4444",
    },
    {
      label: "autres",
      count: Math.max(
        Number(stats?.totalAnnonces ?? 0) -
          Number(stats?.annoncesValidees ?? 0) -
          Number(stats?.annoncesEnAttente ?? 0) -
          Number(stats?.annoncesSuspendues ?? 0),
        0,
      ),
      color: "#d4d4d8",
    },
  ];

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="relative mb-8">
        <div className="pointer-events-none absolute -top-10 left-1/4 h-40 w-96 rounded-full bg-blue-600/[0.06] blur-3xl" />
        <h1 className="relative font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
          Tableau de bord Admin
        </h1>
        {/* Slim mono stat strip */}
        <div className="relative mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
          <span>
            <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
              {stats?.totalUtilisateurs?.toLocaleString("fr-FR") ?? "…"}
            </span>{" "}
            utilisateurs
          </span>
          <span className="text-zinc-200">|</span>
          <span>
            <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
              {stats?.totalAnnonces?.toLocaleString("fr-FR") ?? "…"}
            </span>{" "}
            annonces
          </span>
          <span className="text-zinc-200">|</span>
          <span>
            <span
              className={`tabular-nums font-semibold ${
                Number(stats?.signalements) > 0
                  ? "text-red-500"
                  : "text-zinc-900 dark:text-zinc-100"
              }`}
            >
              {stats?.signalements ?? "…"}
            </span>{" "}
            signalements
          </span>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* À traiter — the admin's actual job, dominant */}
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.2)]">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <h2 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
                À traiter
              </h2>
              {enAttente.length > 0 && (
                <span className="rounded-full bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums text-amber-700 dark:text-amber-300">
                  {enAttente.length}
                </span>
              )}
            </div>
            <Link
              to="/admin/moderation"
              className="text-sm font-semibold text-blue-600 dark:text-blue-400 underline-offset-4 hover:underline"
            >
              Modération complète
            </Link>
          </div>

          {enAttente.length > 0 ? (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {enAttente.slice(0, 5).map((a) => (
                <QueueRow
                  key={a.id}
                  annonce={a}
                  expanded={expandedId === a.id}
                  onToggle={() =>
                    setExpandedId((cur) => (cur === a.id ? null : a.id))
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 p-10 text-center">
              <Shield className="mx-auto h-8 w-8 text-emerald-500" />
              <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                File de modération vide
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Toutes les annonces en zone 40–69 ont été traitées.
              </p>
            </div>
          )}
        </section>

        <aside className="space-y-6">
          {/* Plateforme donut */}
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
            <h2 className="mb-5 font-geist text-base font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
              État de la plateforme
            </h2>
            <DonutChart items={donutItems} height={180} />
          </section>

          {/* Quick actions */}
          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            {[
              {
                to: "/admin/signalements",
                icon: Flag,
                tone: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
                title: `${stats?.signalements ?? 0} signalement(s)`,
                desc: "Traiter les signalements",
              },
              {
                to: "/admin/utilisateurs",
                icon: Users,
                tone: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
                title: `${stats?.totalUtilisateurs ?? 0} utilisateurs`,
                desc: "Gérer les comptes",
              },
              {
                to: "/admin/moderation",
                icon: Clock,
                tone: "bg-amber-50 dark:bg-amber-500/10 text-amber-600",
                title: `${stats?.annoncesEnAttente ?? 0} en attente`,
                desc: "File de modération",
              },
            ].map(({ to, icon: Icon, tone, title, desc }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg ${tone}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {title}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {desc}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600" />
              </Link>
            ))}
          </section>
        </aside>
      </div>
    </DashboardLayout>
  );
}
