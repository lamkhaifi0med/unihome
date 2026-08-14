/**
 * AnnonceDetail — « La Contre-Visite » (l'inspection rejouée).
 *
 * DIRECTION CONTRACT — candidate 3, seed a8de6f35, mode operate.
 * THESIS: la page détail est la machine qui rejoue son inspection devant
 *   l'étudiant — elle refuse le défaut galerie + sidebar + boîte contact.
 * OWN WORLD: Control Room — #fafafa, encre zinc, accent blue-600,
 *   Geist + JetBrains Mono pour la voix machine.
 * STORY (3 actes): I. L'immersion — galerie cinéma pleine largeur, verdict
 *   retenu. II. La révélation — l'unique bande sombre : le terminal rejoue
 *   les 5 critères réels (35/20/20/15/10), le score compte, le verdict se
 *   résout dans sa couleur méritée. III. Le coffre — les contacts scellés
 *   derrière un cadre, révélés par le vrai appel de consultation.
 * FIRST VIEWPORT: bande galerie cinématique, compteur mono 03/07,
 *   titre + ville + prix en voix machine, aucun verdict encore.
 * FORM: candidate 3, seed a8de6f35.
 * FINISH: flat-at-rest, motion gated on prefers-reduced-motion, vert mérité
 *   uniquement (≥70), zéro plat, dark: complet, copie française factuelle.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  Expand,
  Flag,
  Heart,
  Home,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
  Star,
  Unlock,
  X,
} from "lucide-react";
import {
  usePrefersReducedMotion,
  useCountUp,
  verdictColor,
  verdictLabel,
  ScoreRuler,
} from "../../components/ui/instruments";
import { annoncesApi } from "../../api/annoncesApi";
import { avisApi } from "../../api/avisApi";
import { signalerAnnonce } from "../../api/adminApi";
import { useFavoris } from "../../hooks/useFavoris";
import { useAuth } from "../../hooks/useAuth";

/* ---------------------------------------------------------------- helpers */

const contactIcons = {
  TELEPHONE: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  FACEBOOK: MessageCircle,
  INSTAGRAM: MessageCircle,
};

function formatContactHref(contact) {
  if (contact.plateforme === "TELEPHONE") return `tel:${contact.valeur}`;
  if (contact.plateforme === "EMAIL") return `mailto:${contact.valeur}`;
  if (contact.plateforme === "WHATSAPP")
    return `https://wa.me/${contact.valeur.replace(/\D/g, "")}`;
  return contact.valeur;
}

function formatAvisDate(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

/* -------------------------------------------------------- PhotoLightbox */

/**
 * Full-screen viewer — object-contain, so the photo shows its real
 * proportions with zero cropping. Esc / ← → / backdrop-click to drive.
 */
function PhotoLightbox({ images, index, setIndex, onClose }) {
  const count = images.length;
  const go = useCallback(
    (dir) => {
      if (count < 2) return;
      setIndex((i) => (i + dir + count) % count);
    },
    [count, setIndex],
  );

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [go, onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-zinc-950/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Visionneuse photos"
      onClick={onClose}
    >
      {/* top strip — machine voice counter + close */}
      <div className="flex items-center justify-between px-5 py-4">
        <p className="font-mono text-[12px] text-zinc-400">
          photo {pad2(index + 1)}/{pad2(count)}
          <span className="hidden text-zinc-600 sm:inline">
            {" "}
            · dimensions réelles
          </span>
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer la visionneuse"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-zinc-200 transition-colors hover:bg-white/20"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* the photo — no cropping */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
        <img
          src={images[index]}
          alt={`Photo ${index + 1}`}
          onClick={(e) => e.stopPropagation()}
          className="max-h-full max-w-full rounded-lg object-contain"
        />
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(-1);
              }}
              aria-label="Photo précédente"
              className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                go(1);
              }}
              aria-label="Photo suivante"
              className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* filmstrip */}
      {count > 1 && (
        <div
          className="flex justify-center gap-2 overflow-x-auto px-4 pb-5"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((img, i) => (
            <button
              key={img}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Photo ${i + 1}`}
              aria-current={i === index}
              className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-md border transition-all ${
                i === index
                  ? "border-blue-500 opacity-100"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------- Act I: CinemaGallery */

function CinemaGallery({
  annonce,
  images,
  activeImg,
  setActiveImg,
  fav,
  onToggleFavori,
  onOpenSignaler,
  onOpenLightbox,
  lightboxOpen,
}) {
  const touchX = useRef(null);
  const count = images.length;

  const go = useCallback(
    (dir) => {
      if (count < 2) return;
      setActiveImg((i) => (i + dir + count) % count);
    },
    [count, setActiveImg],
  );

  useEffect(() => {
    if (lightboxOpen) return; // the lightbox owns the arrows while open
    const onKey = (e) => {
      if (e.target.closest?.("input, textarea, select, [role='dialog']"))
        return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, lightboxOpen]);

  return (
    <section aria-label="Galerie du logement">
      <div
        className="group relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 48) go(dx > 0 ? -1 : 1);
          touchX.current = null;
        }}
      >
        <div className="relative aspect-[16/10] sm:aspect-[16/8]">
          {images[activeImg] ? (
            <button
              type="button"
              onClick={onOpenLightbox}
              aria-label="Voir la photo en plein écran, dimensions réelles"
              className="block h-full w-full cursor-zoom-in"
            >
              <img
                src={images[activeImg]}
                alt={annonce.titre}
                className="h-full w-full object-cover"
              />
            </button>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
              <Home className="h-12 w-12" strokeWidth={1.5} />
            </div>
          )}
          {/* legibility scrims */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-zinc-950/50 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-zinc-950/70 to-transparent" />

          {/* frame counter — machine voice */}
          <p className="absolute right-4 top-4 rounded-full bg-zinc-950/60 px-3 py-1 font-mono text-[11px] tracking-wider text-zinc-200 backdrop-blur">
            {pad2(activeImg + 1)}/{pad2(Math.max(count, 1))}
          </p>

          {/* expand hint — under the frame counter, clear of the overlay */}
          {images[activeImg] && (
            <button
              type="button"
              onClick={onOpenLightbox}
              aria-label="Plein écran"
              className="absolute right-4 top-12 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-950/60 text-zinc-200 backdrop-blur transition-opacity hover:bg-zinc-950/80 sm:opacity-0 sm:focus-visible:opacity-100 sm:group-hover:opacity-100"
            >
              <Expand className="h-4 w-4" />
            </button>
          )}

          {/* favori + signaler */}
          <div className="absolute left-4 top-4 flex gap-2">
            <button
              type="button"
              onClick={onToggleFavori}
              aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
              aria-pressed={fav}
              className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur transition-colors ${
                fav
                  ? "bg-red-500 text-white"
                  : "bg-zinc-950/60 text-zinc-200 hover:text-red-400"
              }`}
            >
              <Heart
                className={`h-[18px] w-[18px] ${fav ? "fill-current" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={onOpenSignaler}
              aria-label="Signaler cette annonce"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-950/60 text-zinc-200 backdrop-blur transition-colors hover:text-red-400"
            >
              <Flag className="h-[18px] w-[18px]" />
            </button>
          </div>

          {/* prev / next */}
          {count > 1 && (
            <>
              <button
                type="button"
                onClick={() => go(-1)}
                aria-label="Photo précédente"
                className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950/60 text-zinc-200 opacity-0 backdrop-blur transition-opacity hover:bg-zinc-950/80 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                aria-label="Photo suivante"
                className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-950/60 text-zinc-200 opacity-0 backdrop-blur transition-opacity hover:bg-zinc-950/80 focus-visible:opacity-100 group-hover:opacity-100"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}

          {/* identity overlay — no verdict yet, tension held for Act II */}
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-3 p-5 sm:p-7">
            <div className="min-w-0">
              <h1 className="max-w-2xl text-xl font-semibold leading-tight text-white sm:text-3xl">
                {annonce.titre}
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-zinc-300">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                <span className="truncate">
                  {annonce.adresse}
                  <span className="font-mono text-[12px] text-zinc-400">
                    {" "}
                    · {(annonce.typeLogement || "logement").toLowerCase()}
                  </span>
                </span>
              </p>
            </div>
            <p className="font-mono text-lg text-white sm:text-2xl">
              {Number(annonce.loyer || 0).toLocaleString("fr-FR")}{" "}
              <span className="text-sm text-zinc-300">MAD/mois</span>
            </p>
          </div>
        </div>
      </div>

      {/* filmstrip */}
      {count > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((img, index) => (
            <button
              key={img}
              type="button"
              onClick={() => setActiveImg(index)}
              aria-label={`Photo ${index + 1}`}
              aria-current={activeImg === index}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border transition-all ${
                activeImg === index
                  ? "border-blue-600 opacity-100"
                  : "border-zinc-200 opacity-55 hover:opacity-90 dark:border-zinc-800"
              }`}
            >
              <img src={img} alt="" className="h-full w-full object-cover" />
              <span className="absolute bottom-0.5 right-1 font-mono text-[9px] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.8)]">
                {pad2(index + 1)}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------ Act II: InspectionReplay */

const REPLAY_CRITERIA = [
  { key: "justificatif", label: "justificatif", weight: "0.35" },
  { key: "photos", label: "photos", weight: "0.20" },
  { key: "prix", label: "prix", weight: "0.20" },
  { key: "description", label: "description", weight: "0.15" },
  { key: "coherence", label: "cohérence", weight: "0.10" },
];

function InspectionReplay({ annonce }) {
  const reduced = usePrefersReducedMotion();
  const score = Math.max(0, Math.min(100, Number(annonce.scoreConfiance) || 0));
  const shown = useCountUp(score, 1300, !reduced);
  const [step, setStep] = useState(reduced ? 99 : 0);

  const detail = annonce.detailScore || {};
  const rows = REPLAY_CRITERIA.map((c) => ({
    ...c,
    value:
      c.key === "description"
        ? (detail.description ?? detail.texte ?? null)
        : (detail[c.key] ?? null),
  })).filter((r) => r.value != null);

  // staggered replay: one log line lands at a time
  useEffect(() => {
    if (reduced) return;
    if (step > rows.length + 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 350 : 420);
    return () => clearTimeout(t);
  }, [step, rows.length, reduced]);

  const color = verdictColor(score);
  const label = verdictLabel(score);
  const verdictVisible = reduced || step > rows.length;

  return (
    /* The page's ONE dark band — `dark` class forces dark variants inside. */
    <section aria-label="Inspection IA" className="dark">
      <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-[0_32px_80px_-40px_rgba(37,99,235,0.35)] ring-1 ring-transparent dark:border-zinc-700 dark:bg-black dark:ring-zinc-800">
        {/* terminal chrome */}
        <div className="flex items-center gap-2 border-b border-zinc-800 px-5 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
          <p className="ml-2 truncate font-mono text-[11px] text-zinc-500">
            inspection IA — rejouée pour vous
          </p>
        </div>

        <div className="grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_220px]">
          {/* replay log */}
          <div className="min-w-0 font-mono text-[13px] leading-relaxed">
            <p className="text-zinc-500">
              <span className="text-blue-400">$</span> inspection de cette
              annonce — 5 critères
            </p>
            <div className="mt-4 space-y-3">
              {rows.map((row, i) => {
                const landed = reduced || step > i;
                return (
                  <div
                    key={row.key}
                    className="transition-opacity duration-300"
                    style={{ opacity: landed ? 1 : 0.12 }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-zinc-400">
                        &gt; {row.label}{" "}
                        <span className="text-zinc-600">×{row.weight}</span>
                      </span>
                      <span
                        className="tabular-nums"
                        style={{
                          color: landed ? verdictColor(row.value) : "#52525b",
                        }}
                      >
                        {row.value}/100
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: landed ? `${row.value}%` : "0%",
                          backgroundColor: verdictColor(row.value),
                          transition: reduced
                            ? "none"
                            : "width 0.7s cubic-bezier(0.16,1,0.3,1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* verdict line resolves last */}
            <div
              className="mt-5 border-t border-zinc-800 pt-4 transition-opacity duration-500"
              style={{ opacity: verdictVisible ? 1 : 0.12 }}
            >
              <p>
                <span className="text-zinc-500">verdict —</span>{" "}
                <span style={{ color }}>{label.toLowerCase()}</span>
                <span className="text-zinc-600"> · seuils 70 / 40</span>
              </p>
              {annonce.raisonStatut && (
                <p className="mt-2 max-w-prose font-sans text-[13px] leading-6 text-zinc-400">
                  {annonce.raisonStatut}
                </p>
              )}
            </div>
          </div>

          {/* score column */}
          <div className="flex flex-col items-start justify-center gap-3 lg:items-end">
            <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
              score de confiance
            </p>
            <p
              className="font-mono text-6xl font-medium tabular-nums leading-none"
              style={{ color: verdictVisible ? color : "#a1a1aa" }}
            >
              {shown}
            </p>
            <div className="w-full max-w-[220px]">
              <ScoreRuler score={score} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Act III: ContactVault */

function ContactVault({ annonce, contactsLoading, favoriteError, onReveal }) {
  const unlocked = Boolean(annonce.contactsDisponibles);
  const contacts = annonce.contacts || [];

  return (
    <div
      id="contact-vault"
      className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
    >
      {/* owner identity */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-lg font-semibold text-white">
          {(annonce.proprietairePrenom || annonce.proprietaireNom || "P")[0]}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-semibold text-zinc-900 dark:text-zinc-100">
              {[annonce.proprietairePrenom, annonce.proprietaireNom]
                .filter(Boolean)
                .join(" ") || "Propriétaire"}
            </p>
            {annonce.proprietaireVerifie && (
              <BadgeCheck className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            )}
          </div>
          <p className="mt-0.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {annonce.proprietaireNote != null
              ? `${Number(annonce.proprietaireNote).toFixed(1)}/5 · ${annonce.proprietaireAvis || 0} avis`
              : `${annonce.proprietaireAvis || 0} avis`}
          </p>
        </div>
      </div>

      <div className="mt-4 border-t border-dashed border-zinc-200 pt-4 dark:border-zinc-800">
        <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {unlocked ? (
            <Unlock className="h-3 w-3" />
          ) : (
            <Lock className="h-3 w-3" />
          )}
          contacts {unlocked ? "révélés" : "scellés"}
        </p>

        {!unlocked ? (
          <>
            {/* sealed rows — masked placeholders, no real data behind */}
            <div className="mt-3 space-y-2" aria-hidden="true">
              {["téléphone", "whatsapp"].map((k) => (
                <div
                  key={k}
                  className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2.5 dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <Phone className="h-4 w-4 text-zinc-300 dark:text-zinc-600" />
                  <span className="font-mono text-sm tracking-widest text-zinc-300 blur-[2px] select-none dark:text-zinc-600">
                    +212 6•• ••• •••
                  </span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={onReveal}
              disabled={contactsLoading}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {contactsLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              Révéler les contacts
            </button>
            <p className="mt-2 text-center font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
              consultation enregistrée · débloque l'avis étudiant
            </p>
          </>
        ) : (
          <div className="mt-3 space-y-2">
            {contacts.map((contact) => {
              const Icon = contactIcons[contact.plateforme] || Phone;
              return (
                <a
                  key={`${contact.plateforme}-${contact.valeur}`}
                  href={formatContactHref(contact)}
                  className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-200"
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="min-w-0 truncate font-mono text-[13px]">
                    <span className="text-emerald-600/70 dark:text-emerald-300/60">
                      {contact.plateforme.toLowerCase()} ·{" "}
                    </span>
                    {contact.valeur}
                  </span>
                </a>
              );
            })}
            {contacts.length === 0 && (
              <p className="rounded-lg border border-dashed border-zinc-200 px-3 py-4 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                Aucun contact renseigné par le propriétaire.
              </p>
            )}
          </div>
        )}

        {favoriteError && (
          <p className="mt-3 text-sm text-red-600 dark:text-red-400">
            {favoriteError}
          </p>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- MiniMap */

function MiniMap({ annonce }) {
  if (!annonce.latitude || !annonce.longitude) return null;
  const lat = Number(annonce.latitude);
  const lng = Number(annonce.longitude);
  const zoom = 15;
  const x = Math.floor(((lng + 180) / 360) * 2 ** zoom);
  const y = Math.floor(
    (0.5 -
      Math.log(
        (1 + Math.sin((lat * Math.PI) / 180)) /
          (1 - Math.sin((lat * Math.PI) / 180)),
      ) /
        (4 * Math.PI)) *
      2 ** zoom,
  );

  return (
    <div className="relative h-48 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900">
      <img
        src={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`}
        alt={`Carte — ${annonce.ville}`}
        className="h-full w-full scale-150 object-cover dark:opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 to-transparent" />
      <div className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-full items-center justify-center rounded-lg border-2 border-white bg-blue-600 text-white shadow-md">
        <Home className="h-4 w-4" />
      </div>
      <p className="absolute bottom-2 left-2 right-2 truncate rounded-lg bg-white/90 px-2.5 py-1.5 font-mono text-[11px] text-zinc-700 backdrop-blur dark:bg-zinc-950/85 dark:text-zinc-300">
        {annonce.ville} · {annonce.adresse}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------- avis section */

function StarsDisplay({ value, size = "h-3.5 w-3.5" }) {
  const safe = Math.max(0, Math.min(5, Number(value) || 0));
  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${safe} sur 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${
            n <= safe
              ? "fill-current text-amber-500"
              : "text-zinc-300 dark:text-zinc-700"
          }`}
        />
      ))}
    </div>
  );
}

function AvisSection({
  avisList,
  avisLoading,
  eligibilite,
  isLoggedIn,
  user,
  annonce,
  formOpen,
  onOpenForm,
  onCloseForm,
  note,
  setNote,
  hover,
  setHover,
  commentaire,
  setCommentaire,
  submitting,
  error,
  onSubmit,
}) {
  const moyenne = annonce?.proprietaireNote;
  const isStudent = user?.role === "ETUDIANT";
  const canReview = Boolean(eligibilite?.canReview);
  const alreadyReviewed = Boolean(eligibilite?.alreadyReviewed);
  const hasViewedContacts = Boolean(eligibilite?.hasViewedContacts);

  let hint = null;
  if (!isLoggedIn) {
    hint = "Connectez-vous avec un compte étudiant pour laisser un avis.";
  } else if (!isStudent) {
    hint = "Seuls les étudiants peuvent laisser un avis sur une annonce.";
  } else if (alreadyReviewed) {
    hint = "Vous avez déjà laissé un avis pour cette annonce. Merci !";
  } else if (!hasViewedContacts) {
    hint =
      "Affichez d'abord les contacts du propriétaire pour pouvoir laisser un avis.";
  }

  return (
    <section
      aria-label="Avis des étudiants"
      className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Avis des étudiants
          </h2>
          <p className="mt-1 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
            {avisList.length} avis sur cette annonce
            {moyenne != null && Number(moyenne) > 0 && (
              <>
                {" "}
                · propriétaire {Number(moyenne).toFixed(1)}/5 (
                {annonce.proprietaireAvis || 0} au total)
              </>
            )}
          </p>
        </div>
        {canReview && !formOpen && (
          <button
            type="button"
            onClick={onOpenForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
          >
            <Star className="h-4 w-4" />
            Laisser un avis
          </button>
        )}
      </div>

      {hint && !formOpen && (
        <p className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          {hint}
        </p>
      )}

      {formOpen && (
        <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50/60 p-5 dark:border-blue-500/20 dark:bg-blue-500/5">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Votre avis sur cette annonce
          </h3>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            Soyez honnête et respectueux. Votre note aide d'autres étudiants.
          </p>

          <div className="mt-4">
            <label className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              note
            </label>
            <div className="mt-2 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setNote(n)}
                  className="rounded-full p-1 transition-transform hover:scale-110"
                  aria-label={`Note ${n} sur 5`}
                >
                  <Star
                    className={`h-6 w-6 ${
                      n <= (hover || note)
                        ? "fill-current text-amber-500"
                        : "text-zinc-300 dark:text-zinc-700"
                    }`}
                  />
                </button>
              ))}
              <span className="ml-3 font-mono text-sm text-zinc-700 dark:text-zinc-300">
                {note}/5
              </span>
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="avis-commentaire"
              className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
            >
              commentaire (optionnel)
            </label>
            <textarea
              id="avis-commentaire"
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              maxLength={2000}
              placeholder="Partagez votre expérience : accueil, état du logement, conformité à l'annonce, etc."
              className="mt-2 h-28 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
            />
            <p className="mt-1 text-right font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              {commentaire.length}/2000
            </p>
          </div>

          {error && (
            <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
              {error}
            </p>
          )}

          <div className="mt-5 flex gap-3">
            <button
              type="button"
              onClick={onCloseForm}
              disabled={submitting}
              className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Publier mon avis
            </button>
          </div>
        </div>
      )}

      <div className="mt-5 space-y-2.5">
        {avisLoading ? (
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement des avis…
          </div>
        ) : avisList.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            Aucun avis pour le moment. Soyez le premier à partager votre
            expérience.
          </p>
        ) : (
          avisList.map((avis) => {
            const initial = (avis.etudiantPrenom || "?")[0]?.toUpperCase();
            const author = [avis.etudiantPrenom, avis.etudiantNomInitiale]
              .filter(Boolean)
              .join(" ");
            return (
              <article
                key={avis.id}
                className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 dark:border-zinc-800 dark:bg-zinc-950"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                        {author || "Étudiant"}
                      </p>
                      <StarsDisplay value={avis.note} />
                      <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                        {formatAvisDate(avis.createdAt)}
                      </span>
                    </div>
                    {avis.commentaire && (
                      <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-300">
                        {avis.commentaire}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export default function AnnonceDetail() {
  const { id } = useParams();
  const { isLoggedIn, user } = useAuth();
  const { toggleFavori, isFavori } = useFavoris();
  const [annonce, setAnnonce] = useState(null);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [favoriteError, setFavoriteError] = useState(null);
  const [signalerOpen, setSignalerOpen] = useState(false);
  const [signalerRaison, setSignalerRaison] = useState("ARNAQUE");
  const [signalerDesc, setSignalerDesc] = useState("");
  const [signalerSubmitting, setSignalerSubmitting] = useState(false);
  const [signalerDone, setSignalerDone] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Avis (reviews)
  const [avisList, setAvisList] = useState([]);
  const [avisLoading, setAvisLoading] = useState(false);
  const [eligibilite, setEligibilite] = useState(null);
  const [avisFormOpen, setAvisFormOpen] = useState(false);
  const [avisNote, setAvisNote] = useState(5);
  const [avisHover, setAvisHover] = useState(0);
  const [avisCommentaire, setAvisCommentaire] = useState("");
  const [avisSubmitting, setAvisSubmitting] = useState(false);
  const [avisError, setAvisError] = useState(null);

  // The sticky bar only shows the score once Act II has been seen,
  // so the verdict is never leaked before the replay.
  const replayRef = useRef(null);
  const [replaySeen, setReplaySeen] = useState(false);
  useEffect(() => {
    const el = replayRef.current;
    if (!el || replaySeen) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setReplaySeen(true);
      },
      { threshold: 0.35 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [replaySeen, annonce]);

  const loadDetail = async (includeContacts = false) => {
    const response = await annoncesApi.getDetail(id, includeContacts);
    setAnnonce(response.data);
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const response = await annoncesApi.getDetail(id, false);
        if (mounted) setAnnonce(response.data);
      } catch (err) {
        if (mounted)
          setError(err?.response?.data?.detail || "Annonce introuvable.");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id]);

  // Load reviews + eligibility whenever the annonce id (or login state) changes.
  // Eligibility uses _silentAuth in the API client so a 401 (unauthenticated
  // visitor) does not trigger a global logout.
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setAvisLoading(true);
        const listRes = await avisApi.getByAnnonce(id);
        if (mounted) setAvisList(listRes.data || []);
      } catch {
        if (mounted) setAvisList([]);
      } finally {
        if (mounted) setAvisLoading(false);
      }

      if (!isLoggedIn) {
        if (mounted) setEligibilite(null);
        return;
      }
      try {
        const eligRes = await avisApi.getEligibilite(id);
        if (mounted) setEligibilite(eligRes.data);
      } catch {
        if (mounted) setEligibilite(null);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [id, isLoggedIn]);

  const images = annonce?.photos || [];
  const fav = annonce ? isFavori(annonce.id) || annonce.favori : false;

  const handleToggleFavori = async () => {
    setFavoriteError(null);
    try {
      await toggleFavori(annonce.id);
      setAnnonce((current) =>
        current ? { ...current, favori: !fav } : current,
      );
    } catch {
      setFavoriteError(
        "Connectez-vous avec un compte étudiant pour sauvegarder cette annonce.",
      );
    }
  };

  const handleSignaler = async () => {
    if (!isLoggedIn) {
      setError(
        "Connectez-vous avec un compte étudiant pour signaler cette annonce.",
      );
      setSignalerOpen(false);
      return;
    }
    setSignalerSubmitting(true);
    try {
      await signalerAnnonce(annonce.id, {
        raison: signalerRaison,
        description: signalerDesc,
      });
      setSignalerDone(true);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.response?.data?.message ||
          "Impossible d'envoyer le signalement.",
      );
    } finally {
      setSignalerSubmitting(false);
    }
  };

  const revealContacts = async () => {
    if (!isLoggedIn) {
      setError("Connectez-vous pour voir les contacts du propriétaire.");
      return;
    }
    try {
      setContactsLoading(true);
      await loadDetail(true);
      // Viewing contacts unlocks the review form, so refresh eligibility.
      try {
        const eligRes = await avisApi.getEligibilite(id);
        setEligibilite(eligRes.data);
      } catch {
        /* ignore */
      }
    } catch {
      setError("Impossible de charger les contacts.");
    } finally {
      setContactsLoading(false);
    }
  };

  const resetAvisForm = () => {
    setAvisNote(5);
    setAvisHover(0);
    setAvisCommentaire("");
    setAvisError(null);
  };

  const handleSubmitAvis = async () => {
    if (!isLoggedIn) {
      setAvisError(
        "Connectez-vous avec un compte étudiant pour laisser un avis.",
      );
      return;
    }
    setAvisSubmitting(true);
    setAvisError(null);
    try {
      await avisApi.create({
        annonceId: id,
        note: Number(avisNote),
        commentaire: avisCommentaire.trim() || null,
      });
      // Refresh the public list, the eligibility, and the annonce detail
      // (so the owner's nbAvis / proprietaireNote update on screen).
      const [listRes, eligRes] = await Promise.all([
        avisApi.getByAnnonce(id),
        avisApi.getEligibilite(id),
      ]);
      setAvisList(listRes.data || []);
      setEligibilite(eligRes.data);
      await loadDetail(annonce?.contactsDisponibles === true);
      setAvisFormOpen(false);
      resetAvisForm();
    } catch (err) {
      setAvisError(
        err?.response?.data?.message ||
          err?.response?.data?.detail ||
          "Impossible d'enregistrer votre avis.",
      );
    } finally {
      setAvisSubmitting(false);
    }
  };

  const scrollToVault = () => {
    document
      .getElementById("contact-vault")
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const score = Math.max(
    0,
    Math.min(100, Number(annonce?.scoreConfiance) || 0),
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#fafafa] font-mono text-sm text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        chargement de l'annonce…
      </div>
    );
  }

  if (error && !annonce) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#fafafa] px-4 text-center dark:bg-zinc-950">
        <p className="font-mono text-sm text-zinc-500 dark:text-zinc-400">
          annonce introuvable
        </p>
        <h2 className="mt-2 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
          {error}
        </h2>
        <Link
          to="/annonces"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux annonces
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] pb-16 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* breadcrumb — machine voice */}
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            to="/annonces"
            className="inline-flex items-center gap-2 font-mono text-[12px] text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            /annonces
          </Link>
          <p className="hidden font-mono text-[11px] text-zinc-400 sm:block dark:text-zinc-500">
            {annonce.ville}
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ACT I — l'immersion */}
        <CinemaGallery
          annonce={annonce}
          images={images}
          activeImg={activeImg}
          setActiveImg={setActiveImg}
          fav={fav}
          onToggleFavori={handleToggleFavori}
          onOpenSignaler={() => {
            setSignalerOpen(true);
            setSignalerDone(false);
            setSignalerDesc("");
          }}
          onOpenLightbox={() => setLightboxOpen(true)}
          lightboxOpen={lightboxOpen}
        />

        {/* sticky summary bar — prix · CTA; the score only joins once
            Act II has revealed it (verdict never leaks before the replay) */}
        <div className="sticky top-[72px] z-30 mt-4">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-2.5 shadow-[0_8px_24px_-16px_rgba(9,9,11,0.3)] backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/90">
            <p className="min-w-0 truncate font-mono text-[12px] text-zinc-600 dark:text-zinc-300">
              {replaySeen && (
                <>
                  <span
                    className="font-medium tabular-nums"
                    style={{ color: verdictColor(score) }}
                  >
                    {score}/100
                  </span>{" "}
                  <span className="text-zinc-300 dark:text-zinc-600">
                    ·
                  </span>{" "}
                </>
              )}
              {Number(annonce.loyer || 0).toLocaleString("fr-FR")} MAD/mois{" "}
              <span className="hidden text-zinc-300 sm:inline dark:text-zinc-600">
                ·
              </span>{" "}
              <span className="hidden sm:inline">{annonce.ville}</span>
            </p>
            <button
              type="button"
              onClick={scrollToVault}
              className="flex-shrink-0 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              {annonce.contactsDisponibles
                ? "Contacts"
                : "Révéler les contacts"}
            </button>
          </div>
        </div>

        {/* ACT II — la révélation */}
        <div className="mt-6" ref={replayRef}>
          <InspectionReplay annonce={annonce} />
        </div>

        {/* below the fold: readout + vault */}
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <main className="min-w-0 space-y-6">
            {/* fiche technique */}
            <section
              aria-label="Fiche du logement"
              className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                Fiche du logement
              </h2>
              <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-800">
                {[
                  { label: "type", value: annonce.typeLogement || "—" },
                  {
                    label: "surface",
                    value: annonce.superficie
                      ? `${annonce.superficie} m²`
                      : "—",
                  },
                  {
                    label: "charges",
                    value: annonce.chargesIncluses ? "incluses" : "en sus",
                  },
                  {
                    label: "loyer",
                    value: `${Number(annonce.loyer || 0).toLocaleString("fr-FR")} MAD`,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-white px-4 py-3 dark:bg-zinc-900"
                  >
                    <dt className="font-mono text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      {item.label}
                    </dt>
                    <dd className="mt-1 truncate font-mono text-[13px] text-zinc-900 dark:text-zinc-100">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>

              {annonce.description && (
                <p className="mt-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                  {annonce.description}
                </p>
              )}

              {(annonce.equipements || []).length > 0 && (
                <div className="mt-5">
                  <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    équipements
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {(annonce.equipements || []).map((equipement) => (
                      <span
                        key={equipement}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[13px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                      >
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        {equipement}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            <AvisSection
              avisList={avisList}
              avisLoading={avisLoading}
              eligibilite={eligibilite}
              isLoggedIn={isLoggedIn}
              user={user}
              annonce={annonce}
              formOpen={avisFormOpen}
              onOpenForm={() => {
                resetAvisForm();
                setAvisFormOpen(true);
              }}
              onCloseForm={() => {
                setAvisFormOpen(false);
                resetAvisForm();
              }}
              note={avisNote}
              setNote={setAvisNote}
              hover={avisHover}
              setHover={setAvisHover}
              commentaire={avisCommentaire}
              setCommentaire={setAvisCommentaire}
              submitting={avisSubmitting}
              error={avisError}
              onSubmit={handleSubmitAvis}
            />

            {/* quiet signalement footer */}
            <p className="px-1 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              un problème avec cette annonce ?{" "}
              <button
                type="button"
                onClick={() => {
                  setSignalerOpen(true);
                  setSignalerDone(false);
                  setSignalerDesc("");
                }}
                className="underline decoration-zinc-300 underline-offset-2 transition-colors hover:text-red-600 dark:decoration-zinc-600 dark:hover:text-red-400"
              >
                signaler
              </button>
            </p>
          </main>

          {/* ACT III — le coffre */}
          <aside className="space-y-4 lg:sticky lg:top-32 lg:self-start">
            <ContactVault
              annonce={annonce}
              contactsLoading={contactsLoading}
              favoriteError={favoriteError}
              onReveal={revealContacts}
            />

            <MiniMap annonce={annonce} />

            {/* UniBot */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                <MessageCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Assistant UniBot
              </p>
              <p className="mt-2 text-[13px] leading-6 text-zinc-500 dark:text-zinc-400">
                Posez une question sur cette annonce : fiabilité, score, prix ou
                points à vérifier avant contact.
              </p>
              <Link
                to={`/chatbot?annonceId=${annonce.id}`}
                className="mt-3 inline-flex items-center gap-1.5 font-mono text-[12px] font-medium text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Demander à UniBot →
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* photo lightbox — real proportions, zero cropping */}
      {lightboxOpen && images.length > 0 && (
        <PhotoLightbox
          images={images}
          index={activeImg}
          setIndex={setActiveImg}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      {/* signaler modal — Control Room */}
      {signalerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="Signaler cette annonce"
          onClick={() => !signalerSubmitting && setSignalerOpen(false)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* machine-voice header strip */}
            <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3 dark:border-zinc-800">
              <p className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                signalement
              </p>
              <button
                type="button"
                onClick={() => setSignalerOpen(false)}
                aria-label="Fermer"
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {signalerDone ? (
              <div className="px-6 py-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/15">
                  <Flag className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Signalement transmis
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Notre équipe examinera cette annonce. Merci de contribuer à la
                  fiabilité de la plateforme.
                </p>
                <p className="mt-3 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                  statut — en file de modération
                </p>
                <button
                  onClick={() => setSignalerOpen(false)}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
                >
                  Fermer
                </button>
              </div>
            ) : (
              <div className="p-5 sm:p-6">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Signaler cette annonce
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Sélectionnez le motif qui décrit le mieux le problème.
                </p>

                {/* reason radio cards */}
                <div
                  role="radiogroup"
                  aria-label="Motif du signalement"
                  className="mt-4 grid gap-2 sm:grid-cols-2"
                >
                  {[
                    {
                      value: "ARNAQUE",
                      label: "Arnaque / Fraude",
                      hint: "demande d'argent suspecte",
                    },
                    {
                      value: "FAUSSES_INFOS",
                      label: "Fausses informations",
                      hint: "détails inexacts ou trompeurs",
                    },
                    {
                      value: "PHOTOS_TROMPEUSES",
                      label: "Photos trompeuses",
                      hint: "ne correspondent pas au logement",
                    },
                    {
                      value: "PRIX_ABUSIF",
                      label: "Prix abusif",
                      hint: "loyer hors marché",
                    },
                    {
                      value: "ANNONCE_DOUBLON",
                      label: "Annonce en doublon",
                      hint: "déjà publiée ailleurs",
                    },
                    {
                      value: "AUTRE",
                      label: "Autre",
                      hint: "précisez ci-dessous",
                    },
                  ].map((r) => {
                    const active = signalerRaison === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSignalerRaison(r.value)}
                        className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${
                          active
                            ? "border-blue-600 bg-blue-50/60 dark:border-blue-500 dark:bg-blue-500/10"
                            : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                        }`}
                      >
                        <p
                          className={`text-sm font-medium ${
                            active
                              ? "text-blue-700 dark:text-blue-300"
                              : "text-zinc-800 dark:text-zinc-200"
                          }`}
                        >
                          {r.label}
                        </p>
                        <p className="mt-0.5 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                          {r.hint}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* description */}
                <div className="mt-4">
                  <label
                    htmlFor="signaler-desc"
                    className="font-mono text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400"
                  >
                    description (optionnel)
                  </label>
                  <textarea
                    id="signaler-desc"
                    value={signalerDesc}
                    onChange={(e) => setSignalerDesc(e.target.value)}
                    maxLength={1000}
                    placeholder="Décrivez le problème constaté…"
                    className="mt-2 h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 outline-none transition-colors placeholder:text-zinc-400 focus:border-blue-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-600"
                  />
                  <p className="mt-1 text-right font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                    {signalerDesc.length}/1000
                  </p>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setSignalerOpen(false)}
                    disabled={signalerSubmitting}
                    className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSignaler}
                    disabled={signalerSubmitting}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {signalerSubmitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}
                    {signalerSubmitting ? "Envoi…" : "Envoyer le signalement"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
