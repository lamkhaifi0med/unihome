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
  if (score >= 70) return "bg-emerald-500/90";
  if (score >= 40) return "bg-amber-500/90";
  return "bg-rose-500/90";
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
    <article className="relative mx-auto w-full max-w-md rounded-[2.5rem] border border-white/40 bg-white/70 p-3 shadow-2xl shadow-indigo-500/20 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-indigo-500/30 dark:border-white/10 dark:bg-white/[0.04]">
      <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-[#141433] dark:to-[#0f0f2d]">
        <div className="flex items-center gap-2 border-b border-slate-200/60 p-4 dark:border-white/10">
          {campusDistanceText && (
            <>
              <MapPin className="h-4 w-4 shrink-0 text-indigo-600 dark:text-indigo-300" />
              <span className="line-clamp-1 text-sm font-medium text-slate-700 dark:text-slate-200">
                {campusDistanceText}
              </span>
            </>
          )}
        </div>

        <div className="p-4">
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-200 via-violet-200 to-pink-200 dark:from-indigo-900 dark:via-violet-900 dark:to-pink-900">
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
                <div className="flex h-full w-full items-center justify-center text-indigo-300 dark:text-indigo-500">
                  <Home className="h-12 w-12" />
                </div>
              )}
            </Link>

            <div className="pointer-events-none absolute inset-0 flex items-end p-4">
              <div
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white shadow-md ${getScoreClass(score)}`}
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
              className="absolute right-3 top-3 rounded-full bg-white/90 p-2 backdrop-blur transition-transform hover:scale-105 dark:bg-black/40"
              aria-label="Ajouter aux favoris"
            >
              <Heart
                className={`h-4 w-4 text-pink-500 ${fav ? "fill-current" : ""}`}
              />
            </button>
          </div>

          <div className="mt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link to={`/annonces/${annonce.id}`}>
                  <h3 className="line-clamp-1 font-[Syne,sans-serif] font-semibold text-slate-800 transition-colors hover:text-indigo-700 dark:text-slate-100 dark:hover:text-indigo-200">
                    {annonce.titre}
                  </h3>
                </Link>
                <p className="line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                  {addressText ||
                    campusDistanceText ||
                    "Logement proche campus"}
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap font-[Syne,sans-serif] text-lg font-bold text-indigo-700 dark:text-indigo-200">
                {loyer} DH
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs">
              <div
                className={`flex min-w-0 items-center gap-1.5 ${annonce.proprietaireVerifie ? "text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400"}`}
              >
                <BadgeCheck className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">
                  {annonce.proprietaireVerifie
                    ? "Propriétaire vérifié"
                    : "Propriétaire à confirmer"}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2 text-slate-500 dark:text-slate-400">
                <Phone className="h-3.5 w-3.5" />
                Contact direct
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
