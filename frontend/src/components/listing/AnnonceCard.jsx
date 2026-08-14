import { Link } from "react-router-dom";
import {
  BadgeCheck,
  Heart,
  Home,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { useFavoris } from "../../hooks/useFavoris";

function getScoreLabel(score) {
  if (score >= 70) return "Annonce sérieuse";
  if (score >= 40) return "À vérifier";
  return "Annonce risquée";
}

function getScoreClass(score) {
  if (score >= 70) return "bg-emerald-600/95";
  if (score >= 40) return "bg-amber-500/95";
  return "bg-red-500/95";
}

export default function AnnonceCard({ annonce }) {
  const { toggleFavori, isFavori } = useFavoris();
  const fav = isFavori(annonce.id);
  const images = annonce.photos || annonce.images || [];
  const score = Number(annonce.scoreConfiance || 0);
  const loyer = Number(annonce.loyer || 0).toLocaleString("fr-FR");
  const campusDistanceText =
    annonce.distanceMetres !== null && annonce.distanceMetres !== undefined
      ? `À ${(Number(annonce.distanceMetres) / 1000).toFixed(1)} km du campus sélectionné`
      : annonce.distance
        ? `À ${annonce.distance} km du campus sélectionné`
        : "";
  const addressText = [annonce.ville, annonce.adresse]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 font-geist transition-shadow hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)]">
      {campusDistanceText && (
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 px-4 py-3">
          <MapPin className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
          <span className="line-clamp-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {campusDistanceText}
          </span>
        </div>
      )}

      <div className="p-3">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          <Link
            to={`/annonces/${annonce.id}`}
            className="absolute inset-0 block"
          >
            {images[0] ? (
              <img
                src={images[0]}
                alt={annonce.titre}
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-600">
                <Home className="h-12 w-12" />
              </div>
            )}
          </Link>

          <div className="pointer-events-none absolute inset-0 flex items-end p-3">
            <div
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-md ${getScoreClass(score)}`}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Confiance {score} · {getScoreLabel(score)}
            </div>
          </div>

          <button
            type="button"
            onClick={(event) => {
              event.preventDefault();
              toggleFavori(annonce.id).catch(() => {});
            }}
            className="absolute right-3 top-3 rounded-full border border-zinc-200 dark:border-zinc-800 bg-white/95 p-2 shadow-sm backdrop-blur transition-transform hover:scale-105"
            aria-label="Ajouter aux favoris"
          >
            <Heart
              className={`h-4 w-4 ${fav ? "fill-current text-red-500" : "text-zinc-500 dark:text-zinc-400"}`}
            />
          </button>
        </div>

        <div className="mt-3 px-1 pb-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/annonces/${annonce.id}`}>
                <h3 className="line-clamp-1 font-semibold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50 transition-colors hover:text-blue-700 dark:hover:text-blue-300">
                  {annonce.titre}
                </h3>
              </Link>
              <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                {addressText || campusDistanceText || "Logement proche campus"}
              </p>
            </div>
            <span className="shrink-0 whitespace-nowrap text-lg font-bold tracking-[-0.01em] text-blue-600 dark:text-blue-400 tabular-nums">
              {loyer} DH
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs">
            <div
              className={`flex min-w-0 items-center gap-1.5 ${annonce.proprietaireVerifie ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"}`}
            >
              <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">
                {annonce.proprietaireVerifie
                  ? "Propriétaire vérifié"
                  : "Propriétaire à confirmer"}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-zinc-500 dark:text-zinc-400">
              <Phone className="h-3.5 w-3.5" />
              Contact direct
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
