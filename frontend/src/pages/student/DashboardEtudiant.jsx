import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Home,
  Heart,
  User,
  Search,
  MessageCircle,
  Sparkles,
  MapPin,
  ArrowRight,
  BarChart3,
  ShieldCheck,
  Eye,
  Pencil,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import AnnonceCard from "../../components/listing/AnnonceCard";
import { RadarRings, verdictColor } from "../../components/ui/instruments";
import { MarketChart } from "../../components/ui/charts";
import { useAuth } from "../../hooks/useAuth";
import { useFavoris } from "../../hooks/useFavoris";
import { usersApi } from "../../api/usersApi";
import { searchApi } from "../../api/searchApi";

const sidebarLinks = [
  { to: "/dashboard-etudiant", label: "Tableau de bord", icon: Home },
  { to: "/favoris", label: "Mes favoris", icon: Heart },
  { to: "/profil", label: "Mon profil", icon: User },
  { to: "/search", label: "Rechercher", icon: Search },
  { to: "/chatbot", label: "Assistant UniBot", icon: MessageCircle },
];

export default function DashboardEtudiant({ isDark, onToggleTheme }) {
  const { user } = useAuth();
  const { favoris } = useFavoris();
  const [recommandations, setRecommandations] = useState([]);
  const [loadingReco, setLoadingReco] = useState(true);
  const [stats, setStats] = useState({ nbConsultations: 0 });
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      // Load recommendations: nearest validated listings near student's university
      try {
        if (user?.universiteId) {
          const recoRes = await searchApi.searchNearUniversity({
            universiteId: user.universiteId,
            rayon: 5000,
            page: 0,
            size: 8,
          });
          if (mounted) setRecommandations(recoRes.data?.content || []);
        }
      } catch {
        if (mounted) setRecommandations([]);
      } finally {
        if (mounted) setLoadingReco(false);
      }

      // Load student stats (consultations count)
      try {
        const statsRes = await usersApi.getStats();
        if (mounted) setStats(statsRes.data || {});
      } catch {
        // silently ignore — stats are non-critical
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.universiteId]);

  const budget = user?.budgetMax ? Number(user.budgetMax) : null;

  const market = useMemo(
    () =>
      recommandations
        .filter((a) => Number(a.loyer) > 0)
        .map((a) => ({
          label: a.titre,
          short:
            (a.quartier || a.adresse || a.ville || a.titre || "")
              .split(",")[0]
              .trim()
              .slice(0, 12) || "—",
          loyer: Number(a.loyer),
          distanceKm:
            a.distanceMetres != null
              ? (Number(a.distanceMetres) / 1000).toFixed(1)
              : null,
        })),
    [recommandations],
  );

  const marketStats = useMemo(() => {
    if (market.length === 0) return null;
    const loyers = market.map((m) => m.loyer).sort((a, b) => a - b);
    const median =
      loyers.length % 2
        ? loyers[(loyers.length - 1) / 2]
        : Math.round(
            (loyers[loyers.length / 2 - 1] + loyers[loyers.length / 2]) / 2,
          );
    const inBudget =
      budget != null ? market.filter((m) => m.loyer <= budget).length : null;
    const scores = recommandations
      .map((a) => Number(a.scoreConfiance || 0))
      .filter((s) => s > 0);
    const avgScore = scores.length
      ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
      : null;
    return { median, inBudget, avgScore };
  }, [market, budget, recommandations]);

  const fadeUp = (delay = 0) => ({
    initial: reduceMotion ? false : { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: "easeOut", delay },
  });

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      {/* Header */}
      <motion.div {...fadeUp(0)} className="mb-6">
        <h1 className="font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
          Bonjour, {user?.prenom || user?.nom?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {user?.universiteNom || "Étudiant UniHome"}
        </p>
      </motion.div>

      {/* Mission control: the live search, not dead stats */}
      <motion.div
        {...fadeUp(0.05)}
        className="relative mb-8 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)]"
      >
        <style>{`.uh-dots-mc { background-image: radial-gradient(rgba(9,9,11,0.1) 1px, transparent 1px); background-size: 22px 22px; } .dark .uh-dots-mc { background-image: radial-gradient(rgba(250,250,250,0.12) 1px, transparent 1px); }`}</style>
        <div className="uh-dots-mc pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_80%_at_80%_50%,black,transparent)]" />
        <div className="relative grid items-center gap-6 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_170px]">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              recherche active
            </p>
            <p className="mt-2 max-w-xl font-geist text-xl font-bold leading-snug tracking-[-0.01em] text-zinc-950 dark:text-zinc-50 sm:text-2xl">
              {user?.universiteNom || "Votre campus"}
              <span className="text-zinc-300 dark:text-zinc-600"> · </span>
              <span className="whitespace-nowrap">
                {user?.budgetMax ? (
                  <>
                    ≤{" "}
                    <span className="tabular-nums">
                      {Number(user.budgetMax).toLocaleString("fr-FR")}
                    </span>{" "}
                    DH
                  </>
                ) : (
                  "budget libre"
                )}
              </span>
              <span className="text-zinc-300 dark:text-zinc-600"> · </span>
              <span className="whitespace-nowrap text-blue-600 dark:text-blue-400">
                rayon 5 km
              </span>
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/search"
                className="group inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700"
              >
                <Search className="h-4 w-4" />
                Relancer la recherche
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/profil"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-white dark:bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200 transition-colors hover:border-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <Pencil className="h-3.5 w-3.5" />
                Modifier mes critères
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                  {favoris.length}
                </span>
                favoris
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                <span className="tabular-nums font-semibold text-zinc-900 dark:text-zinc-100">
                  {stats.nbConsultations ?? 0}
                </span>
                annonces consultées
              </span>
              {marketStats?.avgScore != null && (
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck
                    className="h-3.5 w-3.5"
                    style={{ color: verdictColor(marketStats.avgScore) }}
                  />
                  score moyen 
                  <span
                    className="tabular-nums font-semibold"
                    style={{ color: verdictColor(marketStats.avgScore) }}
                  >
                    {marketStats.avgScore}/100
                  </span>
                </span>
              )}
              {user?.villeRecherche && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500" />
                  {user.villeRecherche}
                </span>
              )}
            </div>
          </div>
          <div className="hidden items-center justify-center lg:flex">
            <RadarRings size={160} />
          </div>
        </div>
      </motion.div>

      {/* Recommandations IA */}
      <motion.div {...fadeUp(0.1)} className="mb-8">
        <div className="mb-1 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h2 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
            Annonces près de votre campus
          </h2>
        </div>
        <p className="mb-4 ml-7 text-sm text-zinc-500 dark:text-zinc-400">
          {loadingReco
            ? "Recherche en cours autour de votre campus…"
            : recommandations.length > 0
              ? `${recommandations.length} annonce${recommandations.length > 1 ? "s" : ""} vérifiée${recommandations.length > 1 ? "s" : ""} dans un rayon de 5 km — les 3 plus proches ci-dessous`
              : "Aucun résultat dans votre rayon actuel"}
        </p>
        {loadingReco ? (
          <div className="grid gap-5 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
              >
                <div className="h-36 rounded-xl bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-4 h-4 w-3/4 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                <div className="mt-2 h-3 w-1/2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              </div>
            ))}
          </div>
        ) : recommandations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white dark:bg-zinc-900 p-10 text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Aucune annonce trouvée à proximité de votre campus.
            </p>
            <Link
              to="/search"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700"
            >
              <Search className="h-4 w-4" />
              Rechercher manuellement
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-3">
            {recommandations.slice(0, 3).map((a) => (
              <AnnonceCard key={a.id} annonce={a} />
            ))}
          </div>
        )}
      </motion.div>

      {/* Marché autour du campus */}
      {market.length >= 3 && (
        <motion.div
          {...fadeUp(0.15)}
          className="mb-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5"
        >
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <h3 className="font-geist text-sm font-bold text-zinc-950 dark:text-zinc-50">
                Le marché autour de votre campus
              </h3>
            </div>
            {marketStats && (
              <p className="font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
                loyer médian{" "}
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {marketStats.median.toLocaleString("fr-FR")} MAD
                </span>
                {budget != null && marketStats.inBudget != null && (
                  <>
                    {" "}
                    <span className="text-zinc-300 dark:text-zinc-600">
                      |
                    </span>{" "}
                    <span
                      className={`font-semibold tabular-nums ${marketStats.inBudget > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {marketStats.inBudget}/{market.length}
                    </span>{" "}
                    dans votre budget
                  </>
                )}
              </p>
            )}
          </div>
          <p className="mb-3 ml-6 text-xs text-zinc-500 dark:text-zinc-400">
            Loyers des annonces vérifiées à moins de 5 km
            {budget != null &&
              " — la ligne pointillée marque votre budget maximum"}
            .
          </p>
          <MarketChart items={market} budget={budget} height={210} />
        </motion.div>
      )}

      {/* UniBot prompt chips + quick actions */}
      <motion.div
        {...fadeUp(0.2)}
        className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]"
      >
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <h3 className="font-geist text-sm font-bold text-zinc-950 dark:text-zinc-50">
              Demandez à UniBot
            </h3>
            <span className="rounded-full bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
              FR · عربية · darija
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "bghit chy studio qrib l campus",
              "Un logement meublé avec WiFi à moins de 2000 DH",
              "شنو كاين قريب من الجامعة؟",
            ].map((prompt) => (
              <Link
                key={prompt}
                to={`/chatbot?q=${encodeURIComponent(prompt)}`}
                className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 px-4 py-2 text-[13px] text-zinc-700 dark:text-zinc-300 transition-colors hover:border-blue-300 dark:hover:border-blue-500/50 hover:text-blue-700 dark:hover:text-blue-300"
              >
                « {prompt} »
              </Link>
            ))}
          </div>
        </div>

        <Link
          to="/favoris"
          className="group flex items-center gap-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 transition-shadow hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <Heart className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-geist text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Mes favoris
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {favoris.length} annonce{favoris.length > 1 ? "s" : ""}{" "}
              sauvegardée{favoris.length > 1 ? "s" : ""}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 flex-shrink-0 text-zinc-300 dark:text-zinc-600 transition-all group-hover:translate-x-0.5 group-hover:text-blue-600" />
        </Link>
      </motion.div>
    </DashboardLayout>
  );
}
