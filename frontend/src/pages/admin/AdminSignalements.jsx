import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Building2,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  ImageOff,
  LayoutDashboard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
  X,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { motion, useReducedMotion } from "motion/react";
import { adminApi } from "../../api/adminApi";

const sidebarLinks = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/moderation", label: "Modération", icon: Shield },
  { to: "/admin/signalements", label: "Signalements", icon: Flag },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

const FILTERS = ["TOUS", "OUVERT", "TRAITE", "REJETE"];

const FILTER_LABELS = {
  TOUS: "Tous",
  OUVERT: "Ouverts",
  TRAITE: "Traités",
  REJETE: "Non fondés",
};

const statusMeta = {
  OUVERT: {
    label: "Ouvert",
    icon: AlertTriangle,
    className: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  },
  TRAITE: {
    label: "Traité",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  },
  REJETE: {
    label: "Non fondé",
    icon: XCircle,
    className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  },
};

const annonceStatusMeta = {
  VALIDEE:
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  EN_ATTENTE:
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
  REJETEE: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  SUSPENDUE: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
  ARCHIVEE: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

const annonceStatusLabels = {
  VALIDEE: "Validée",
  EN_ATTENTE: "En attente",
  REJETEE: "Rejetée",
  SUSPENDUE: "Suspendue",
  ARCHIVEE: "Archivée",
};

const decisionGuide = [
  {
    key: "suspend",
    title: "Suspendre l'annonce",
    icon: Ban,
    tone: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    description:
      "À utiliser si le signalement est fondé. L'annonce passe en suspendue, le signalement est clôturé et le propriétaire reçoit le motif.",
  },
  {
    key: "treat",
    title: "Traité sans sanction",
    icon: CheckCircle,
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    description:
      "À utiliser si l'admin a vérifié le cas mais qu'aucune sanction n'est nécessaire. L'annonce reste dans son état actuel.",
  },
  {
    key: "reject",
    title: "Non fondé",
    icon: XCircle,
    tone: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
    description:
      "À utiliser si le signalement est incorrect, abusif ou sans preuves suffisantes. Le dossier est fermé sans action sur l'annonce.",
  },
];

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatMoney(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} MAD`;
}

function StatusBadge({ statut }) {
  const meta = statusMeta[statut] || statusMeta.OUVERT;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function DecisionGuide({ compact = false }) {
  return (
    <div className={compact ? "space-y-2" : "grid gap-3 md:grid-cols-3"}>
      {decisionGuide.map(({ key, title, icon: Icon, tone, description }) => (
        <div
          key={key}
          className={`${compact ? "rounded-xl p-3" : "rounded-2xl p-4"} ${tone}`}
        >
          <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4" /> {title}
          </div>
          <p className="text-xs leading-relaxed opacity-80">{description}</p>
        </div>
      ))}
    </div>
  );
}

function SignalementRow({ signalement, onOpen }) {
  const annonceStatusClass =
    annonceStatusMeta[signalement.annonceStatut] ||
    annonceStatusMeta.EN_ATTENTE;
  const photo = signalement.annoncePhotos?.[0];

  return (
    <button
      type="button"
      onClick={() => onOpen(signalement)}
      className="flex w-full items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/30"
    >
      <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-zinc-400">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge statut={signalement.statut} />
          {signalement.annonceStatut && (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${annonceStatusClass}`}
            >
              Annonce{" "}
              {annonceStatusLabels[signalement.annonceStatut] ||
                signalement.annonceStatut}
            </span>
          )}
        </div>
        <h3 className="mt-2 truncate font-geist text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {signalement.annonceTitre || "Annonce introuvable"}
        </h3>
        <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
          {signalement.raison || "Motif non précisé"} ·{" "}
          {signalement.etudiantPrenom} {signalement.etudiantNom} ·{" "}
          {formatDate(signalement.createdAt)}
        </p>
      </div>
      <div className="hidden text-right text-xs text-zinc-500 dark:text-zinc-400 md:block">
        <p>{signalement.annonceVille || "-"}</p>
        <p className="mt-1 font-mono font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
          {formatMoney(signalement.annonceLoyer)}
        </p>
      </div>
    </button>
  );
}

function DetailModal({
  signalement,
  submitting,
  onClose,
  onTreat,
  onReject,
  onSuspend,
}) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const [reason, setReason] = useState("");

  useEffect(() => {
    setPhotoIndex(0);
    setReason(
      signalement?.raison
        ? `Signalement confirmé : ${signalement.raison}`
        : "Signalement confirmé par l'équipe de modération.",
    );
  }, [signalement]);

  if (!signalement) return null;
  const photos = signalement.annoncePhotos || [];
  const currentPhoto = photos[photoIndex] || photos[0];
  const isOpen = signalement.statut === "OUVERT";
  const annonceStatusClass =
    annonceStatusMeta[signalement.annonceStatut] ||
    annonceStatusMeta.EN_ATTENTE;

  const previousPhoto = () =>
    setPhotoIndex((index) => (index - 1 + photos.length) % photos.length);
  const nextPhoto = () => setPhotoIndex((index) => (index + 1) % photos.length);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 p-4 backdrop-blur-sm"
      onClick={() => !submitting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Détail du signalement"
        className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge statut={signalement.statut} />
              {signalement.annonceStatut && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${annonceStatusClass}`}
                >
                  Annonce{" "}
                  {annonceStatusLabels[signalement.annonceStatut] ||
                    signalement.annonceStatut}
                </span>
              )}
            </div>
            <h2 className="truncate font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
              {signalement.annonceTitre || "Annonce introuvable"}
            </h2>
            <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              signalé le {formatDate(signalement.createdAt)}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-start gap-2">
            {isOpen && (
              <div className="hidden flex-wrap justify-end gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => onSuspend(signalement, reason)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  <Ban className="h-3.5 w-3.5" /> Suspendre
                </button>
                <button
                  type="button"
                  onClick={() => onTreat(signalement.id)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Traité
                </button>
                <button
                  type="button"
                  onClick={() => onReject(signalement.id)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <XCircle className="h-3.5 w-3.5" /> Non fondé
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid max-h-[calc(92vh-88px)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4 p-5">
            <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="relative flex h-72 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={signalement.annonceTitre}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-zinc-400">
                    <ImageOff className="mb-2 h-10 w-10" />
                    <span className="text-sm">Aucune photo</span>
                  </div>
                )}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={previousPhoto}
                      className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 font-mono text-xs font-medium tabular-nums text-white">
                      {photoIndex + 1}/{photos.length}
                    </span>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t border-zinc-100 p-2 dark:border-zinc-800">
                  {photos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setPhotoIndex(index)}
                      className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${index === photoIndex ? "border-blue-500" : "border-transparent opacity-70 hover:opacity-100"}`}
                    >
                      <img
                        src={photo}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4 dark:border-red-500/20 dark:bg-red-500/10">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
                  <Flag className="h-4 w-4" /> Signalement
                </p>
                <p className="text-sm text-zinc-700 dark:text-zinc-200">
                  Motif : <strong>{signalement.raison || "Non précisé"}</strong>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {signalement.description || "Aucune description ajoutée."}
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
                <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Annonce
                </p>
                <div className="space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-zinc-400" />{" "}
                    {signalement.annonceVille || "-"} ·{" "}
                    {signalement.annonceAdresse || "Adresse non renseignée"}
                  </p>
                  <p className="flex items-center gap-2 font-mono tabular-nums">
                    <Building2 className="h-4 w-4 text-zinc-400" />{" "}
                    {formatMoney(signalement.annonceLoyer)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4 border-t border-zinc-100 p-5 dark:border-zinc-800 lg:border-l lg:border-t-0">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
              <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Contacts
              </p>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    <User className="h-3.5 w-3.5" /> Étudiant
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {signalement.etudiantPrenom} {signalement.etudiantNom}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <Mail className="h-3.5 w-3.5" />{" "}
                    {signalement.etudiantEmail || "E-mail indisponible"}
                  </p>
                </div>
                <div className="border-t border-zinc-200 pt-4 dark:border-zinc-700">
                  <p className="mb-1 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    <User className="h-3.5 w-3.5" /> Propriétaire
                  </p>
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                    {signalement.proprietairePrenom || ""}{" "}
                    {signalement.proprietaireNom || ""}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <Mail className="h-3.5 w-3.5" />{" "}
                    {signalement.proprietaireEmail || "E-mail indisponible"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                    <Phone className="h-3.5 w-3.5" />{" "}
                    {signalement.proprietaireTelephone ||
                      "Téléphone indisponible"}
                  </p>
                </div>
              </div>
            </div>

            {isOpen ? (
              <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-700">
                <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Décision admin
                </p>
                <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-3 dark:border-blue-500/20 dark:bg-blue-500/10">
                  <p className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
                    Rappel rapide
                  </p>
                  <DecisionGuide compact />
                </div>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="mb-3 h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  placeholder="Motif si vous suspendez l'annonce..."
                />
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onSuspend(signalement, reason)}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(239,68,68,0.5)] transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    <Ban className="h-4 w-4" /> Suspendre l'annonce
                  </button>
                  <button
                    type="button"
                    onClick={() => onTreat(signalement.id)}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" /> Traité sans sanction
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(signalement.id)}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    <XCircle className="h-4 w-4" /> Rejeter comme non fondé
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-400">
                Ce signalement est déjà clôturé.
              </div>
            )}
          </aside>
        </div>
        {isOpen && (
          <div className="flex gap-2 border-t border-zinc-100 bg-white/95 p-3 dark:border-zinc-800 dark:bg-zinc-900/95 md:hidden">
            <button
              type="button"
              onClick={() => onSuspend(signalement, reason)}
              disabled={submitting}
              className="flex-1 rounded-full bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Suspendre
            </button>
            <button
              type="button"
              onClick={() => onTreat(signalement.id)}
              disabled={submitting}
              className="flex-1 rounded-full bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Traité
            </button>
            <button
              type="button"
              onClick={() => onReject(signalement.id)}
              disabled={submitting}
              className="flex-1 rounded-full border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
            >
              Non fondé
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSignalements({ isDark, onToggleTheme }) {
  const reduced = useReducedMotion();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("TOUS");
  const [submitting, setSubmitting] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);

  const load = (statut) => {
    setLoading(true);
    adminApi
      .getSignalements(statut === "TOUS" ? null : statut)
      .then((res) => setList(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load("TOUS");
  }, []);

  const counts = useMemo(
    () => ({
      TOUS: list.length,
      OUVERT: list.filter((s) => s.statut === "OUVERT").length,
      TRAITE: list.filter((s) => s.statut === "TRAITE").length,
      REJETE: list.filter((s) => s.statut === "REJETE").length,
    }),
    [list],
  );

  const displayed =
    filter === "TOUS" ? list : list.filter((s) => s.statut === filter);

  const updateSignalement = (id, patch) => {
    setList((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    setSelectedSignalement((current) =>
      current?.id === id ? { ...current, ...patch } : current,
    );
  };

  const handleFilter = (f) => {
    setFilter(f);
    load(f);
    setSelectedSignalement(null);
  };

  const handleTraiter = (id) => {
    setSubmitting(true);
    adminApi
      .traiterSignalement(id)
      .then(() =>
        updateSignalement(id, {
          statut: "TRAITE",
          traiteAt: new Date().toISOString(),
        }),
      )
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  const handleRejeter = (id) => {
    setSubmitting(true);
    adminApi
      .rejeterSignalement(id)
      .then(() =>
        updateSignalement(id, {
          statut: "REJETE",
          traiteAt: new Date().toISOString(),
        }),
      )
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  const handleSuspendAnnonce = (signalement, raison) => {
    setSubmitting(true);
    adminApi
      .suspendreAnnonceDepuisSignalement(signalement.id, raison)
      .then(() =>
        updateSignalement(signalement.id, {
          statut: "TRAITE",
          annonceStatut: "SUSPENDUE",
          traiteAt: new Date().toISOString(),
        }),
      )
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative mb-6">
          <div className="pointer-events-none absolute -top-10 left-1/4 h-40 w-96 rounded-full bg-blue-600/[0.06] blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
                Signalements
              </h1>
              <p className="mt-1 font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                <span
                  className={`font-semibold tabular-nums ${counts.OUVERT > 0 ? "text-red-500" : "text-zinc-900 dark:text-zinc-100"}`}
                >
                  {counts.OUVERT}
                </span>{" "}
                ouvert{counts.OUVERT > 1 ? "s" : ""}
                <span className="mx-2 text-zinc-300 dark:text-zinc-700">|</span>
                cliquez une ligne pour photos, contacts et décision
              </p>
            </div>
            <div
              role="tablist"
              aria-label="Filtrer les signalements"
              className="flex flex-wrap gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {FILTERS.map((f) => (
                <button
                  key={f}
                  role="tab"
                  aria-selected={filter === f}
                  onClick={() => handleFilter(f)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  {FILTER_LABELS[f]}
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                      filter === f
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {counts[f] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-geist text-sm font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
                Guide de décision
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                Petit rappel pour garder une modération juste entre étudiants et
                propriétaires.
              </p>
            </div>
            <Shield className="hidden h-5 w-5 text-blue-500 sm:block" />
          </div>
          <DecisionGuide />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-zinc-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Chargement...
          </div>
        ) : (
          <div className="space-y-3">
            {displayed.map((signalement) => (
              <SignalementRow
                key={signalement.id}
                signalement={signalement}
                onOpen={setSelectedSignalement}
              />
            ))}
            {displayed.length === 0 && (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-800/40">
                <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
                <p className="text-zinc-500 dark:text-zinc-400">
                  Aucun signalement dans cette catégorie
                </p>
              </div>
            )}
          </div>
        )}
      </motion.div>

      <DetailModal
        signalement={selectedSignalement}
        submitting={submitting}
        onClose={() => setSelectedSignalement(null)}
        onTreat={handleTraiter}
        onReject={handleRejeter}
        onSuspend={handleSuspendAnnonce}
      />
    </DashboardLayout>
  );
}
