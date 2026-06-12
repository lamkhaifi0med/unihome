import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  Building2,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ExternalLink,
  Eye,
  FileCheck2,
  Flag,
  Home,
  ImageOff,
  LayoutDashboard,
  Loader2,
  MapPin,
  Shield,
  Users,
  XCircle,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import ScoreBadge from "../../components/ui/ScoreBadge";
import { adminApi } from "../../api/adminApi";

const sidebarLinks = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/moderation", label: "Moderation", icon: Shield },
  { to: "/admin/signalements", label: "Signalements", icon: Flag },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

const tabs = [
  { key: "EN_ATTENTE", label: "En attente", icon: Clock3 },
  { key: "SUSPENDUE", label: "Suspendues", icon: Ban },
  { key: "ALL", label: "Toutes", icon: Shield },
];

function formatMoney(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toLocaleString("fr-FR")} MAD`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(statut) {
  if (statut === "EN_ATTENTE") return "En attente";
  if (statut === "SUSPENDUE") return "Suspendue";
  return statut || "-";
}

function statusClass(statut) {
  if (statut === "EN_ATTENTE")
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400";
  if (statut === "SUSPENDUE")
    return "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400";
  return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400";
}

function riskMeta(annonce) {
  const score = Number(annonce.scoreConfiance ?? 0);
  const reports = Number(annonce.nbSignalements ?? 0);
  const cinOk = Boolean(annonce.proprietaireVerifieCin);

  if (annonce.statut === "SUSPENDUE" || reports > 0 || score < 40) {
    return {
      label: "Risque eleve",
      icon: AlertTriangle,
      badge: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
      dot: "bg-red-500",
      note: "Controler attentivement avant toute validation.",
    };
  }
  if (score < 70 || !cinOk) {
    return {
      label: "A verifier",
      icon: AlertTriangle,
      badge:
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400",
      dot: "bg-amber-500",
      note: "Quelques signaux demandent une verification manuelle.",
    };
  }
  return {
    label: "Confiance forte",
    icon: BadgeCheck,
    badge:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400",
    dot: "bg-emerald-500",
    note: "Les signaux principaux sont favorables.",
  };
}

function scoreEntries(detailScore) {
  if (!detailScore || Object.keys(detailScore).length === 0) return [];
  return Object.entries(detailScore).map(([key, value]) => [
    key.replace(/_/g, " ").replace(/^./, (char) => char.toUpperCase()),
    Number(value || 0),
  ]);
}

function QueueItem({ annonce, selected, decision, onSelect }) {
  const photo = annonce.photos?.[0];
  const risk = riskMeta(annonce);
  const RiskIcon = risk.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(annonce.id)}
      className={`w-full rounded-2xl border p-3 text-left transition-colors ${
        selected
          ? "border-primary-300 bg-primary-50/70 dark:border-primary-500/40 dark:bg-primary-500/10"
          : "border-gray-100 bg-gray-50/70 hover:border-primary-200 hover:bg-white dark:border-white/5 dark:bg-white/5 dark:hover:border-primary-500/30 dark:hover:bg-white/10"
      }`}
    >
      <div className="flex gap-3">
        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-200 dark:bg-white/10">
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
          <span
            className={`absolute left-2 top-2 h-2 w-2 rounded-full ring-2 ring-white ${risk.dot}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold text-gray-900 dark:text-white">
              {annonce.titre}
            </p>
            <span className="text-xs font-semibold text-gray-900 dark:text-white">
              {annonce.scoreConfiance ?? 0}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
            <MapPin className="h-3 w-3" />
            <span className="truncate">
              {annonce.ville || "Ville non definie"}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${statusClass(annonce.statut)}`}
            >
              {statusLabel(annonce.statut)}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${risk.badge}`}
            >
              <RiskIcon className="h-3 w-3" /> {risk.label}
            </span>
            {decision && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:bg-white/10 dark:text-gray-300">
                {decision === "approved" ? "Validee" : "Rejetee"}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function DetailPanel({ annonce, decision, submitting, onApprove, onReject }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photos = annonce.photos || [];
  const currentPhoto = photos[photoIndex] || photos[0];
  const risk = riskMeta(annonce);
  const RiskIcon = risk.icon;
  const entries = scoreEntries(annonce.detailScore);

  useEffect(() => {
    setPhotoIndex(0);
  }, [annonce.id]);

  const goPrev = () =>
    setPhotoIndex((index) => (index - 1 + photos.length) % photos.length);
  const goNext = () => setPhotoIndex((index) => (index + 1) % photos.length);

  return (
    <section className="glass-light overflow-hidden rounded-2xl">
      <div className="border-b border-gray-200 px-5 py-4 dark:border-white/10">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(annonce.statut)}`}
              >
                {statusLabel(annonce.statut)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${risk.badge}`}
              >
                <RiskIcon className="h-3.5 w-3.5" /> {risk.label}
              </span>
            </div>
            <h2 className="line-clamp-2 font-display text-lg font-bold text-gray-900 dark:text-white">
              {annonce.titre}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{" "}
                {annonce.adresse || annonce.ville || "Adresse non renseignee"}
              </span>
              <span>{formatDate(annonce.datePublication)}</span>
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-gray-400">Loyer</p>
              <p className="text-sm font-bold text-gray-900 dark:text-white">
                {formatMoney(annonce.loyer)}
              </p>
            </div>
            <ScoreBadge score={annonce.scoreConfiance ?? 0} />
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-white/10 dark:bg-white/5">
            <div className="relative flex h-64 items-center justify-center bg-gray-100 dark:bg-dark-900">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={annonce.titre}
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
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white dark:bg-white/15 dark:text-white"
                    aria-label="Photo precedente"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white dark:bg-white/15 dark:text-white"
                    aria-label="Photo suivante"
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
                    type="button"
                    key={`${photo}-${index}`}
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

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: MapPin, label: "Ville", value: annonce.ville || "-" },
              {
                icon: Building2,
                label: "Type",
                value: annonce.typeLogement || "-",
              },
              {
                icon: Home,
                label: "Surface",
                value: annonce.superficie ? `${annonce.superficie} m2` : "-",
              },
              {
                icon: CheckCircle,
                label: "Charges",
                value: annonce.chargesIncluses ? "Incluses" : "Non",
              },
            ].map(({ icon: Icon, label, value }) => (
              <div
                key={label}
                className="rounded-xl bg-gray-50 p-3 dark:bg-white/5"
              >
                <div className="mb-1 flex items-center gap-1.5 text-xs text-gray-400">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </div>
                <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
            <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
              Description
            </p>
            <p className="max-h-28 overflow-y-auto pr-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
              {annonce.description || "Aucune description fournie."}
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                Confiance
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${risk.badge}`}
              >
                {risk.label}
              </span>
            </div>
            <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
              {risk.note}
            </p>
            {entries.length > 0 ? (
              <div className="space-y-3">
                {entries.map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-gray-500 dark:text-gray-400">
                        {label}
                      </span>
                      <span className="font-medium text-gray-700 dark:text-gray-200">
                        {value}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-primary-600"
                        style={{
                          width: `${Math.max(0, Math.min(100, value))}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400">
                Aucun detail de score disponible.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
              <FileCheck2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
              Justificatif logement
            </p>
            {annonce.justificatifUrl ? (
              <a
                href={annonce.justificatifUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-semibold text-primary-700 transition hover:bg-primary-100 dark:border-primary-500/25 dark:bg-primary-500/10 dark:text-primary-300 dark:hover:bg-primary-500/15"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Voir le document
              </a>
            ) : (
              <p className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
                Aucun justificatif logement disponible dans le dossier.
              </p>
            )}
          </div>

          <div className="rounded-2xl bg-gray-50 p-4 dark:bg-white/5">
            <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
              Proprietaire
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 text-sm font-bold text-white">
                {annonce.proprietairePrenom?.[0] ||
                  annonce.proprietaireNom?.[0] ||
                  "P"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                  {annonce.proprietairePrenom} {annonce.proprietaireNom}
                </p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  CIN: {annonce.numeroCin || "-"}
                </p>
              </div>
            </div>
            <div className="mt-3">
              {annonce.proprietaireVerifieCin ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" /> CIN verifiee
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                  <AlertTriangle className="h-3.5 w-3.5" /> CIN a verifier
                </span>
              )}
            </div>
          </div>

          {decision ? (
            <div
              className={`rounded-2xl p-4 text-center text-sm font-semibold ${decision === "approved" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" : "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"}`}
            >
              {decision === "approved" ? "Annonce validee" : "Annonce rejetee"}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onReject(annonce.id)}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/5"
              >
                <XCircle className="h-4 w-4" /> Rejeter
              </button>
              <button
                type="button"
                onClick={() => onApprove(annonce.id)}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                <CheckCircle className="h-4 w-4" /> Valider
              </button>
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

function EmptyDetail() {
  return (
    <div className="glass-light flex min-h-[520px] items-center justify-center rounded-2xl p-8 text-center">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
          <Eye className="h-7 w-7" />
        </div>
        <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
          Selectionnez une annonce
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Les details complets, les photos et les actions de moderation
          s'affichent ici.
        </p>
      </div>
    </div>
  );
}

function RejectModal({ value, onChange, submitting, onCancel, onConfirm }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
      <div className="glass-light w-full max-w-md overflow-hidden rounded-2xl shadow-xl shadow-slate-950/15 dark:bg-dark-800">
        <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base font-bold text-gray-900 dark:text-white">
              Motif de rejet
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Renseignez une raison courte et claire pour ce refus.
            </p>
          </div>
        </div>
        <div className="p-5">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ex: photos insuffisantes, description trompeuse..."
            className="input-field mb-4 h-24 resize-none text-sm"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Traitement..." : "Confirmer"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminModeration({ isDark, onToggleTheme }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("EN_ATTENTE");
  const [selectedId, setSelectedId] = useState(null);
  const [decisions, setDecisions] = useState({});
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectRaison, setRejectRaison] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminApi
      .getQueue()
      .then((res) => setQueue(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(
    () => ({
      ALL: queue.length,
      EN_ATTENTE: queue.filter((item) => item.statut === "EN_ATTENTE").length,
      SUSPENDUE: queue.filter((item) => item.statut === "SUSPENDUE").length,
    }),
    [queue],
  );

  const filteredQueue = useMemo(() => {
    if (activeTab === "ALL") return queue;
    return queue.filter((item) => item.statut === activeTab);
  }, [activeTab, queue]);

  const selectedAnnonce = useMemo(
    () => queue.find((item) => item.id === selectedId) || null,
    [queue, selectedId],
  );

  useEffect(() => {
    if (selectedId && !filteredQueue.some((item) => item.id === selectedId))
      setSelectedId(null);
  }, [filteredQueue, selectedId]);

  const handleValider = (id) => {
    setSubmitting(true);
    adminApi
      .validerAnnonce(id)
      .then(() => {
        setDecisions((prev) => ({ ...prev, [id]: "approved" }));
        setQueue((prev) => prev.filter((item) => item.id !== id));
        setSelectedId((current) => (current === id ? null : current));
      })
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  const handleRejeter = () => {
    if (!rejectTarget) return;
    setSubmitting(true);
    adminApi
      .rejeterAnnonce(rejectTarget, rejectRaison)
      .then(() => {
        setDecisions((prev) => ({ ...prev, [rejectTarget]: "rejected" }));
        setQueue((prev) => prev.filter((item) => item.id !== rejectTarget));
        setSelectedId((current) => (current === rejectTarget ? null : current));
        setRejectTarget(null);
        setRejectRaison("");
      })
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  if (loading) {
    return (
      <DashboardLayout
        sidebarLinks={sidebarLinks}
        isDark={isDark}
        onToggleTheme={onToggleTheme}
      >
        <div className="flex min-h-[60vh] items-center justify-center text-gray-400">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Chargement...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900 dark:text-white">
              Moderation des annonces
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {counts.EN_ATTENTE} annonce(s) en attente - {counts.SUSPENDUE}{" "}
              suspendue(s)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map(({ key, label, icon: Icon }) => (
              <button
                type="button"
                key={key}
                onClick={() => setActiveTab(key)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all ${activeTab === key ? "bg-primary-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-white/10 dark:text-gray-300 dark:hover:bg-white/15"}`}
              >
                <Icon className="h-4 w-4" />
                {label}
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${activeTab === key ? "bg-white/20 text-white" : "bg-white/70 text-gray-500 dark:bg-white/10 dark:text-gray-300"}`}
                >
                  {counts[key] ?? 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <section className="glass-light rounded-2xl p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                File
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Cliquez pour examiner
              </p>
            </div>
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/10 dark:text-gray-300">
              {filteredQueue.length}
            </span>
          </div>

          <div className="max-h-[680px] space-y-3 overflow-y-auto pr-1">
            {filteredQueue.map((annonce) => (
              <QueueItem
                key={annonce.id}
                annonce={annonce}
                selected={annonce.id === selectedId}
                decision={decisions[annonce.id]}
                onSelect={setSelectedId}
              />
            ))}
            {filteredQueue.length === 0 && (
              <div className="rounded-2xl bg-gray-50 p-8 text-center dark:bg-white/5">
                <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune annonce dans cette categorie.
                </p>
              </div>
            )}
          </div>
        </section>

        {selectedAnnonce ? (
          <DetailPanel
            annonce={selectedAnnonce}
            decision={decisions[selectedAnnonce.id]}
            submitting={submitting}
            onApprove={handleValider}
            onReject={setRejectTarget}
          />
        ) : (
          <EmptyDetail />
        )}
      </div>

      {rejectTarget && (
        <RejectModal
          value={rejectRaison}
          onChange={setRejectRaison}
          submitting={submitting}
          onCancel={() => {
            setRejectTarget(null);
            setRejectRaison("");
          }}
          onConfirm={handleRejeter}
        />
      )}
    </DashboardLayout>
  );
}
