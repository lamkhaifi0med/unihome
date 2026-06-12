import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Heart,
  Home,
  Search,
  User,
  MessageCircle,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useFavoris } from "../../hooks/useFavoris";
import { searchApi } from "../../api/searchApi";

const sidebarLinks = [
  { to: "/dashboard-etudiant", label: "Tableau de bord", icon: Home },
  { to: "/favoris", label: "Mes favoris", icon: Heart },
  { to: "/profil", label: "Mon profil", icon: User },
  { to: "/search", label: "Rechercher", icon: Search },
  { to: "/chatbot", label: "Assistant IA", icon: MessageCircle },
];

function getScoreLabel(score) {
  if (score >= 70) return "Annonce sérieuse";
  if (score >= 40) return "À vérifier";
  return "Annonce risquée";
}

function getScoreClass(score) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

function FavoriteCard({ annonce, onRemove }) {
  const images = annonce.photos || annonce.images || [];
  const score = Number(annonce.scoreConfiance || 0);
  const price = Number(annonce.loyer ?? annonce.prix ?? 0).toLocaleString(
    "fr-FR",
  );
  const addressText = [annonce.ville, annonce.adresse]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-500/10 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="relative aspect-[16/11] overflow-hidden bg-primary-50 dark:bg-white/5">
        <Link to={`/annonces/${annonce.id}`} className="absolute inset-0">
          {images[0] ? (
            <img
              src={images[0]}
              alt={annonce.titre}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary-300">
              <Home className="h-12 w-12" />
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={() => onRemove(annonce.id)}
          className="absolute right-3 top-3 rounded-full bg-white p-2 text-pink-500 shadow-lg transition-transform hover:scale-105 dark:bg-slate-900"
          aria-label="Retirer des favoris"
        >
          <Heart className="h-4 w-4 fill-current" />
        </button>

        <div className="absolute bottom-3 left-3 right-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-md ${getScoreClass(score)}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            Confiance {score} · {getScoreLabel(score)}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link to={`/annonces/${annonce.id}`}>
              <h2 className="line-clamp-2 font-display text-lg font-bold leading-snug text-gray-900 transition-colors hover:text-primary-600 dark:text-white">
                {annonce.titre}
              </h2>
            </Link>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">
                {addressText || "Logement proche campus"}
              </span>
            </div>
          </div>

          <div className="shrink-0 whitespace-nowrap text-right font-display text-xl font-bold text-primary-600 dark:text-primary-300">
            {price} DH
          </div>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-100 pt-4 text-sm dark:border-white/10">
          <div
            className={`flex min-w-0 items-center gap-1.5 ${annonce.proprietaireVerifie ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"}`}
          >
            <BadgeCheck className="h-4 w-4 shrink-0" />
            <span className="line-clamp-1">
              {annonce.proprietaireVerifie
                ? "Propriétaire vérifié"
                : "Propriétaire à confirmer"}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Phone className="h-4 w-4" />
            Contact
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Favoris({ isDark, onToggleTheme }) {
  const { favoris, loadingFavoris, toggleFavori } = useFavoris();
  const [annonces, setAnnonces] = useState([]);
  const [loadingAnnonces, setLoadingAnnonces] = useState(true);

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

  const loading = loadingFavoris || loadingAnnonces;

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary-500 dark:text-primary-300">
            Espace étudiant
          </p>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
            Mes favoris
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {favsAnnonces.length} annonce{favsAnnonces.length !== 1 ? "s" : ""}{" "}
            sauvegardée{favsAnnonces.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link to="/search" className="btn-primary w-fit">
          Rechercher plus
        </Link>
      </div>

      {loading ? (
        <div className="glass-light flex h-72 items-center justify-center rounded-2xl text-gray-500 dark:text-gray-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Chargement des favoris...
        </div>
      ) : favsAnnonces.length === 0 ? (
        <div className="glass-light rounded-2xl p-16 text-center">
          <Heart className="mx-auto mb-5 h-16 w-16 text-gray-300 dark:text-gray-600" />
          <h3 className="font-display mb-2 text-xl font-semibold text-gray-500 dark:text-gray-400">
            Aucun favori pour le moment
          </h3>
          <p className="mb-6 text-sm text-gray-400">
            Sauvegardez des annonces depuis la recherche ou la page detail.
          </p>
          <Link to="/annonces" className="btn-primary">
            Explorer les annonces
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {favsAnnonces.map((annonce) => (
            <FavoriteCard
              key={annonce.id}
              annonce={annonce}
              onRemove={(id) => toggleFavori(id).catch(() => {})}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
