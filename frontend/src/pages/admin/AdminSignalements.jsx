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
import { adminApi } from "../../api/adminApi";

const sidebarLinks = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/moderation", label: "Moderation", icon: Shield },
  { to: "/admin/signalements", label: "Signalements", icon: Flag },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

const FILTERS = ["TOUS", "OUVERT", "TRAITE", "REJETE"];

const statusMeta = {
  OUVERT: {
    label: "Ouvert",
    icon: AlertTriangle,
    className: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  },
  TRAITE: {
    label: "Traite",
    icon: CheckCircle2,
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  },
  REJETE: {
    label: "Non fonde",
    icon: XCircle,
    className: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
  },
};

const annonceStatusMeta = {
  VALIDEE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
  EN_ATTENTE:
    "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
  REJETEE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  SUSPENDUE: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
  ARCHIVEE: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
};

const decisionGuide = [
  {
    key: "suspend",
    title: "Suspendre l'annonce",
    icon: Ban,
    tone: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    description:
      "A utiliser si le signalement est fonde. L'annonce passe en suspendue, le signalement est cloture et le proprietaire recoit le motif.",
  },
  {
    key: "treat",
    title: "Traite sans sanction",
    icon: CheckCircle,
    tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    description:
      "A utiliser si l'admin a verifie le cas mais qu'aucune sanction n'est necessaire. L'annonce reste dans son etat actuel.",
  },
  {
    key: "reject",
    title: "Non fonde",
    icon: XCircle,
    tone: "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300",
    description:
      "A utiliser si le signalement est incorrect, abusif ou sans preuves suffisantes. Le dossier est ferme sans action sur l'annonce.",
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
      className="glass-light flex w-full items-center gap-4 rounded-2xl p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/10">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-400">
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
              Annonce {signalement.annonceStatut}
            </span>
          )}
        </div>
        <h3 className="mt-2 truncate font-display text-sm font-semibold text-gray-900 dark:text-white">
          {signalement.annonceTitre || "Annonce introuvable"}
        </h3>
        <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
          {signalement.raison || "Motif non precise"} -{" "}
          {signalement.etudiantPrenom} {signalement.etudiantNom} -{" "}
          {formatDate(signalement.createdAt)}
        </p>
      </div>
      <div className="hidden text-right text-xs text-gray-500 dark:text-gray-400 md:block">
        <p>{signalement.annonceVille || "-"}</p>
        <p className="mt-1 font-semibold text-gray-900 dark:text-white">
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
        ? `Signalement confirme: ${signalement.raison}`
        : "Signalement confirme par l'equipe de moderation.",
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-light max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-2xl shadow-2xl dark:bg-dark-800"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusBadge statut={signalement.statut} />
              {signalement.annonceStatut && (
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${annonceStatusClass}`}
                >
                  Annonce {signalement.annonceStatut}
                </span>
              )}
            </div>
            <h2 className="truncate font-display text-lg font-bold text-gray-900 dark:text-white">
              {signalement.annonceTitre || "Annonce introuvable"}
            </h2>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Signale le {formatDate(signalement.createdAt)}
            </p>
          </div>
          <div className="flex flex-shrink-0 items-start gap-2">
            {isOpen && (
              <div className="hidden flex-wrap justify-end gap-2 md:flex">
                <button
                  type="button"
                  onClick={() => onSuspend(signalement, reason)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  <Ban className="h-3.5 w-3.5" /> Suspendre
                </button>
                <button
                  type="button"
                  onClick={() => onTreat(signalement.id)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Traite
                </button>
                <button
                  type="button"
                  onClick={() => onReject(signalement.id)}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  <XCircle className="h-3.5 w-3.5" /> Non fonde
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-white"
              aria-label="Fermer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="grid max-h-[calc(92vh-88px)] overflow-y-auto lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="space-y-4 p-5">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
              <div className="relative flex h-72 items-center justify-center bg-gray-100 dark:bg-dark-900">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={signalement.annonceTitre}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <ImageOff className="mb-2 h-10 w-10" />
                    <span className="text-sm">Aucune photo</span>
                  </div>
                )}
                {photos.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={previousPhoto}
                      className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white dark:bg-white/15 dark:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white dark:bg-white/15 dark:text-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white">
                      {photoIndex + 1}/{photos.length}
                    </span>
                  </>
                )}
              </div>
              {photos.length > 1 && (
                <div className="flex gap-2 overflow-x-auto border-t border-gray-100 p-2 dark:border-white/10">
                  {photos.map((photo, index) => (
                    <button
                      key={`${photo}-${index}`}
                      type="button"
                      onClick={() => setPhotoIndex(index)}
                      className={`h-12 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition ${index === photoIndex ? "border-primary-500" : "border-transparent opacity-70 hover:opacity-100"}`}
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
              <div className="rounded-2xl bg-red-50/70 p-4 dark:bg-red-500/10">
                <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-300">
                  <Flag className="h-4 w-4" /> Signalement
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-200">
                  Motif: <strong>{signalement.raison || "Non precise"}</strong>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {signalement.description || "Aucune description ajoutee."}
                </p>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
                <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Annonce
                </p>
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />{" "}
                    {signalement.annonceVille || "-"} -{" "}
                    {signalement.annonceAdresse || "Adresse non renseignee"}
                  </p>
                  <p className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-gray-400" />{" "}
                    {formatMoney(signalement.annonceLoyer)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-4 border-t border-gray-200 p-5 dark:border-white/10 lg:border-l lg:border-t-0">
            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
              <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                Contacts
              </p>
              <div className="space-y-4">
                <div>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <User className="h-3.5 w-3.5" /> Etudiant
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {signalement.etudiantPrenom} {signalement.etudiantNom}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Mail className="h-3.5 w-3.5" />{" "}
                    {signalement.etudiantEmail || "Email indisponible"}
                  </p>
                </div>
                <div className="border-t border-gray-200 pt-4 dark:border-white/10">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                    <User className="h-3.5 w-3.5" /> Proprietaire
                  </p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {signalement.proprietairePrenom || ""}{" "}
                    {signalement.proprietaireNom || ""}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Mail className="h-3.5 w-3.5" />{" "}
                    {signalement.proprietaireEmail || "Email indisponible"}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Phone className="h-3.5 w-3.5" />{" "}
                    {signalement.proprietaireTelephone ||
                      "Telephone indisponible"}
                  </p>
                </div>
              </div>
            </div>

            {isOpen ? (
              <div className="rounded-2xl border border-gray-200 p-4 dark:border-white/10">
                <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                  Decision admin
                </p>
                <div className="mb-4 rounded-2xl border border-primary-100 bg-primary-50/60 p-3 dark:border-primary-500/20 dark:bg-primary-500/10">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                    Rappel rapide
                  </p>
                  <DecisionGuide compact />
                </div>
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="input-field mb-3 h-24 resize-none text-sm"
                  placeholder="Motif si vous suspendez l'annonce..."
                />
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => onSuspend(signalement, reason)}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    <Ban className="h-4 w-4" /> Suspendre l'annonce
                  </button>
                  <button
                    type="button"
                    onClick={() => onTreat(signalement.id)}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" /> Traite sans sanction
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(signalement.id)}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/5"
                  >
                    <XCircle className="h-4 w-4" /> Rejeter comme non fonde
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-500 dark:bg-white/5 dark:text-gray-400">
                Ce signalement est deja cloture.
              </div>
            )}
          </aside>
        </div>
        {isOpen && (
          <div className="flex gap-2 border-t border-gray-200 bg-white/90 p-3 dark:border-white/10 dark:bg-dark-800/95 md:hidden">
            <button
              type="button"
              onClick={() => onSuspend(signalement, reason)}
              disabled={submitting}
              className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Suspendre
            </button>
            <button
              type="button"
              onClick={() => onTreat(signalement.id)}
              disabled={submitting}
              className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
            >
              Traite
            </button>
            <button
              type="button"
              onClick={() => onReject(signalement.id)}
              disabled={submitting}
              className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 disabled:opacity-50 dark:border-white/20 dark:text-gray-300"
            >
              Non fonde
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminSignalements({ isDark, onToggleTheme }) {
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
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
          Signalements
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {counts.OUVERT} signalement(s) ouvert(s). Cliquez une ligne pour voir
          photos, contacts et decisions.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => handleFilter(f)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${filter === f ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"}`}
          >
            {f} <span className="ml-1 opacity-70">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="glass-light mb-6 rounded-2xl p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold text-gray-900 dark:text-white">
              Guide de decision
            </h2>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Petit rappel pour garder une moderation juste entre etudiants et
              proprietaires.
            </p>
          </div>
          <Shield className="hidden h-5 w-5 text-primary-500 sm:block" />
        </div>
        <DecisionGuide />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
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
            <div className="glass-light rounded-2xl p-12 text-center">
              <CheckCircle className="mx-auto mb-3 h-12 w-12 text-emerald-500" />
              <p className="text-gray-500 dark:text-gray-400">
                Aucun signalement dans cette categorie
              </p>
            </div>
          )}
        </div>
      )}

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
