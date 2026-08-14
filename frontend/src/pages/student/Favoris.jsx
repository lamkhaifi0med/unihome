import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Heart,
  Home,
  Search,
  User,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import AnnonceCard from "../../components/listing/AnnonceCard";
import { useFavoris } from "../../hooks/useFavoris";
import { searchApi } from "../../api/searchApi";

const sidebarLinks = [
  { to: "/dashboard-etudiant", label: "Tableau de bord", icon: Home },
  { to: "/favoris", label: "Mes favoris", icon: Heart },
  { to: "/profil", label: "Mon profil", icon: User },
  { to: "/search", label: "Rechercher", icon: Search },
  { to: "/chatbot", label: "Assistant IA", icon: MessageCircle },
];

export default function Favoris({ isDark, onToggleTheme }) {
  const { favoris, loadingFavoris } = useFavoris();
  const [annonces, setAnnonces] = useState([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoadingAnnonces(true);
        const response = await searchApi.getAnnonces();
        if (mounted) setAnnonces(response.data || []);
      } catch {
        if (mounted) setAnnonces([]);
      } finally {
        if (mounted) setLoadingAnnonces(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const favsAnnonces = useMemo(() => {
    return annonces.filter((annonce) =>
      favoris.some((id) => String(id) === String(annonce.id)),
    );
  }, [annonces, favoris]);

  const stats = useMemo(() => {
    if (favsAnnonces.length === 0) return null;
    const loyers = favsAnnonces
      .map((a) => Number(a.loyer || 0))
      .filter((v) => v > 0);
    const scores = favsAnnonces
      .map((a) => Number(a.scoreConfiance || 0))
      .filter((v) => v > 0);
    return {
      minLoyer: loyers.length ? Math.min(...loyers) : null,
      maxLoyer: loyers.length ? Math.max(...loyers) : null,
      avgScore: scores.length
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : null,
    };
  }, [favsAnnonces]);

  const loading = loadingFavoris || loadingAnnonces;

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
      >
        <div>
          <h1 className="font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
            Mes favoris
          </h1>
          <p className="mt-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {favsAnnonces.length}
            </span>{" "}
            annonce{favsAnnonces.length > 1 ? "s" : ""} sauvegardée
            {favsAnnonces.length > 1 ? "s" : ""}
            {stats?.minLoyer != null && (
              <>
                {" "}
                <span className="text-zinc-300 dark:text-zinc-600">|</span>{" "}
                <span className="tabular-nums">
                  {stats.minLoyer === stats.maxLoyer
                    ? `${stats.minLoyer.toLocaleString("fr-FR")} MAD`
                    : `${stats.minLoyer.toLocaleString("fr-FR")}–${stats.maxLoyer.toLocaleString("fr-FR")} MAD`}
                </span>
              </>
            )}
            {stats?.avgScore != null && (
              <>
                {" "}
                <span className="text-zinc-300 dark:text-zinc-600">|</span>{" "}
                score moyen{" "}
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-white">
                  {stats.avgScore}/100
                </span>
              </>
            )}
          </p>
        </div>
        <Link
          to="/search"
          className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700"
        >
          <Search className="h-4 w-4" />
          Rechercher plus
        </Link>
      </motion.div>

      {loading ? (
        <div className="flex h-72 items-center justify-center rounded-2xl border border-zinc-200 bg-white font-mono text-xs text-zinc-400 dark:border-zinc-800 dark:bg-zinc-900">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          chargement des favoris…
        </div>
      ) : favsAnnonces.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Heart className="mx-auto mb-5 h-14 w-14 text-zinc-200 dark:text-zinc-700" />
          <h3 className="font-geist mb-2 text-lg font-bold tracking-[-0.01em] text-zinc-700 dark:text-zinc-300">
            Aucun favori pour le moment
          </h3>
          <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
            Sauvegardez des annonces depuis la recherche ou la page détail.
          </p>
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700"
          >
            <Search className="h-4 w-4" />
            Explorer les annonces
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {favsAnnonces.map((annonce, i) => (
            <motion.div
              key={annonce.id}
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.35,
                ease: "easeOut",
                delay: Math.min(i * 0.05, 0.3),
              }}
            >
              <AnnonceCard annonce={annonce} />
            </motion.div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
