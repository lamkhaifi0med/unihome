/**
 * ResultRow — a listing as an instrument row for the search console.
 * Photo → identity → mono readout column (distance / prix / score ruler).
 * Rows excluded by the trust lens dim instead of vanishing.
 */
import { Link } from "react-router-dom";
import { BadgeCheck, Heart, Home, MapPin } from "lucide-react";
import { useFavoris } from "../../hooks/useFavoris";
import { ScoreRuler, verdictColor, verdictLabel } from "../ui/instruments";

function formatDistance(annonce) {
  const m = annonce.distanceMetres;
  if (m === null || m === undefined) return null;
  const km = Number(m) / 1000;
  return km < 1 ? `${Math.round(Number(m))} m` : `${km.toFixed(1)} km`;
}

export default function ResultRow({ annonce, dimmed = false, onHover }) {
  const { toggleFavori, isFavori } = useFavoris();
  const fav = isFavori(annonce.id);
  const images = annonce.photos || annonce.images || [];
  const score = Number(annonce.scoreConfiance || 0);
  const loyer = Number(annonce.loyer || 0).toLocaleString("fr-FR");
  const distance = formatDistance(annonce);

  return (
    <article
      onMouseEnter={onHover}
      onFocus={onHover}
      className={`group relative rounded-2xl border border-zinc-200 bg-white transition-all duration-300 hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)] dark:border-zinc-800 dark:bg-zinc-900 ${
        dimmed ? "opacity-35 saturate-50" : ""
      }`}
    >
      <div className="flex gap-4 p-3 sm:p-4">
        {/* photo */}
        <Link
          to={`/annonces/${annonce.id}`}
          className="relative block h-24 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:h-28 sm:w-40 dark:bg-zinc-800"
          tabIndex={-1}
          aria-hidden="true"
        >
          {images[0] ? (
            <img
              src={images[0]}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-600">
              <Home className="h-8 w-8" />
            </div>
          )}
        </Link>

        {/* identity */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <Link to={`/annonces/${annonce.id}`} className="min-w-0">
              <h3 className="line-clamp-1 font-geist text-[15px] font-bold tracking-[-0.01em] text-zinc-950 transition-colors group-hover:text-blue-700 dark:text-zinc-50 dark:group-hover:text-blue-300">
                {annonce.titre}
              </h3>
              <p className="mt-0.5 line-clamp-1 flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                <MapPin className="h-3 w-3 flex-shrink-0" />
                {[annonce.ville, annonce.adresse].filter(Boolean).join(" · ")}
              </p>
            </Link>
            <button
              type="button"
              onClick={() => toggleFavori(annonce.id)}
              aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={fav}
              className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border transition-colors ${
                fav
                  ? "border-red-200 bg-red-50 text-red-500 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400"
                  : "border-zinc-200 bg-white text-zinc-400 hover:text-red-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} />
            </button>
          </div>

          {annonce.proprietaireVerifie && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <BadgeCheck className="h-3 w-3" />
              Propriétaire vérifié
            </p>
          )}

          {/* mono readout */}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {distance && (
              <span>
                <span className="font-medium text-zinc-900 tabular-nums dark:text-zinc-100">
                  {distance}
                </span>{" "}
                du campus
              </span>
            )}
            <span>
              <span className="font-medium text-zinc-900 tabular-nums dark:text-zinc-100">
                {loyer}
              </span>{" "}
              DH/mois
            </span>
            {annonce.superficie ? (
              <span>
                <span className="font-medium text-zinc-900 tabular-nums dark:text-zinc-100">
                  {annonce.superficie}
                </span>{" "}
                m²
              </span>
            ) : null}
          </div>
        </div>

        {/* verdict column */}
        <div className="hidden w-32 flex-shrink-0 flex-col justify-center gap-1.5 border-l border-zinc-100 pl-4 sm:flex dark:border-zinc-800">
          <div className="flex items-baseline justify-between">
            <span
              className="font-mono text-lg font-semibold tabular-nums"
              style={{ color: verdictColor(score) }}
            >
              {score}
            </span>
            <span
              className="text-[10px] font-semibold"
              style={{ color: verdictColor(score) }}
            >
              {verdictLabel(score)}
            </span>
          </div>
          <ScoreRuler score={score} />
        </div>
      </div>
    </article>
  );
}
