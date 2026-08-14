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
import { CriteriaChart } from "../../components/ui/charts";
import { ScoreRuler, verdictColor } from "../../components/ui/instruments";
import { motion, useReducedMotion } from "motion/react";
import { adminApi } from "../../api/adminApi";

const sidebarLinks = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/moderation", label: "Modération", icon: Shield },
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
    return "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  if (statut === "SUSPENDUE")
    return "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300";
  return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
}

function riskMeta(annonce) {
  const score = Number(annonce.scoreConfiance ?? 0);
  const reports = Number(annonce.nbSignalements ?? 0);
  const cinOk = Boolean(annonce.proprietaireVerifieCin);

  if (annonce.statut === "SUSPENDUE" || reports > 0 || score < 40) {
    return {
      label: "Risque élevé",
      icon: AlertTriangle,
      badge: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
      dot: "bg-red-500",
      note: "Contrôler attentivement avant toute validation.",
    };
  }
  if (score < 70 || !cinOk) {
    return {
      label: "À vérifier",
      icon: AlertTriangle,
      badge:
        "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
      dot: "bg-amber-500",
      note: "Quelques signaux demandent une vérification manuelle.",
    };
  }
  return {
    label: "Confiance forte",
    icon: BadgeCheck,
    badge:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    dot: "bg-emerald-500",
    note: "Les signaux principaux sont favorables.",
  };
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
          ? "border-blue-300 bg-blue-50/60 dark:border-blue-500/40 dark:bg-blue-500/10"
          : "border-zinc-200 bg-white hover:border-blue-200 hover:bg-blue-50/30 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/30 dark:hover:bg-zinc-800/60"
      }`}
    >
      <div className="flex gap-3">
        <div className="relative h-16 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
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
          <span
            className={`absolute left-2 top-2 h-2 w-2 rounded-full ring-2 ring-white dark:ring-zinc-900 ${risk.dot}`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              {annonce.titre}
            </p>
            <span
              className="font-mono text-xs font-semibold tabular-nums"
              style={{
                color: verdictColor(Number(annonce.scoreConfiance ?? 0)),
              }}
            >
              {annonce.scoreConfiance ?? 0}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <MapPin className="h-3 w-3" />
            <span className="truncate">
              {annonce.ville || "Ville non définie"}
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
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
                {decision === "approved" ? "Validée" : "Rejetée"}
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
  const hasDetail =
    annonce.detailScore && Object.keys(annonce.detailScore).length > 0;

  useEffect(() => {
    setPhotoIndex(0);
  }, [annonce.id]);

  const goPrev = () =>
    setPhotoIndex((index) => (index - 1 + photos.length) % photos.length);
  const goNext = () => setPhotoIndex((index) => (index + 1) % photos.length);

  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_24px_60px_-30px_rgba(9,9,11,0.2)] dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
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
            <h2 className="line-clamp-2 font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
              {annonce.titre}
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />{" "}
                {annonce.adresse || annonce.ville || "Adresse non renseignée"}
              </span>
              <span>{formatDate(annonce.datePublication)}</span>
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-zinc-400 dark:text-zinc-500">Loyer</p>
              <p className="font-mono text-sm font-bold tabular-nums text-zinc-900 dark:text-zinc-100">
                {formatMoney(annonce.loyer)}
              </p>
            </div>
            <ScoreBadge score={annonce.scoreConfiance ?? 0} />
          </div>
        </div>
        <div className="mt-3 max-w-sm">
          <ScoreRuler score={Number(annonce.scoreConfiance ?? 0)} />
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_290px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <div className="relative flex h-64 items-center justify-center bg-zinc-100 dark:bg-zinc-950">
              {currentPhoto ? (
                <img
                  src={currentPhoto}
                  alt={annonce.titre}
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
                    onClick={goPrev}
                    className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200"
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={goNext}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow hover:bg-white dark:bg-zinc-800/90 dark:text-zinc-200"
                    aria-label="Photo suivante"
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
                    type="button"
                    key={`${photo}-${index}`}
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
                className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/60"
              >
                <div className="mb-1 flex items-center gap-1.5 font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                  <Icon className="h-3.5 w-3.5" /> {label}
                </div>
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
            <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Description
            </p>
            <p className="max-h-28 overflow-y-auto pr-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
              {annonce.description || "Aucune description fournie."}
            </p>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Analyse IA
              </p>
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-medium ${risk.badge}`}
              >
                {risk.label}
              </span>
            </div>
            <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
              {risk.note}
            </p>
            {hasDetail ? (
              <CriteriaChart detail={annonce.detailScore} height={165} />
            ) : (
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                Aucun détail de score disponible.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
            <p className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              <FileCheck2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Justificatif logement
            </p>
            {annonce.justificatifUrl ? (
              <a
                href={annonce.justificatifUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-500/25 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/15"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Voir le document
              </a>
            ) : (
              <p className="text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                Aucun justificatif logement disponible dans le dossier.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800/60">
            <p className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Propriétaire
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white">
                {annonce.proprietairePrenom?.[0] ||
                  annonce.proprietaireNom?.[0] ||
                  "P"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {annonce.proprietairePrenom} {annonce.proprietaireNom}
                </p>
                <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  CIN: {annonce.numeroCin || "-"}
                </p>
              </div>
            </div>
            <div className="mt-3">
              {annonce.proprietaireVerifieCin ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <BadgeCheck className="h-3.5 w-3.5" /> CIN vérifiée
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                  <AlertTriangle className="h-3.5 w-3.5" /> CIN à vérifier
                </span>
              )}
            </div>
          </div>

          {decision ? (
            <div
              className={`rounded-2xl p-4 text-center text-sm font-semibold ${decision === "approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300"}`}
            >
              {decision === "approved" ? "Annonce validée" : "Annonce rejetée"}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onReject(annonce.id)}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-red-500/40 dark:hover:bg-red-500/10 dark:hover:text-red-300"
              >
                <XCircle className="h-4 w-4" /> Rejeter
              </button>
              <button
                type="button"
                onClick={() => onApprove(annonce.id)}
                disabled={submitting}
                className="flex items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(5,150,105,0.5)] transition-colors hover:bg-emerald-700 disabled:opacity-50"
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
    <div className="flex min-h-[520px] items-center justify-center rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/40">
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
          <Eye className="h-7 w-7" />
        </div>
        <h3 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
          Sélectionnez une annonce
        </h3>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Les détails complets, les photos et les actions de modération
          s'affichent ici.
        </p>
      </div>
    </div>
  );
}

function RejectModal({ value, onChange, submitting, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 p-4 backdrop-blur-[2px]"
      onClick={() => !submitting && onCancel()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Motif de rejet"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="flex items-start gap-3 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
            <XCircle className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-geist text-base font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
              Motif de rejet
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Renseignez une raison courte et claire pour ce refus — elle sera
              transmise au propriétaire.
            </p>
          </div>
        </div>
        <div className="p-5">
          <textarea
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="Ex: photos insuffisantes, description trompeuse..."
            className="mb-4 h-24 w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-full border border-zinc-200 px-4 py-2 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={submitting}
              className="flex-1 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? "Traitement..." : "Confirmer le rejet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminModeration({ isDark, onToggleTheme }) {
  const reduced = useReducedMotion();
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

  // Auto-select the first item so the inspector is never empty on arrival.
  useEffect(() => {
    if (!selectedId && filteredQueue.length > 0)
      setSelectedId(filteredQueue[0].id);
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
        <div className="flex min-h-[60vh] items-center justify-center text-zinc-400">
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
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative mb-8">
          <div className="pointer-events-none absolute -top-10 left-1/4 h-40 w-96 rounded-full bg-blue-600/[0.06] blur-3xl" />
          <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
                Modération des annonces
              </h1>
              <p className="mt-1 font-mono text-[13px] text-zinc-500 dark:text-zinc-400">
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {counts.EN_ATTENTE}
                </span>{" "}
                en attente
                <span className="mx-2 text-zinc-300 dark:text-zinc-700">|</span>
                <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                  {counts.SUSPENDUE}
                </span>{" "}
                suspendue{counts.SUSPENDUE > 1 ? "s" : ""}
              </p>
            </div>
            <div
              role="tablist"
              aria-label="Filtrer la file de modération"
              className="flex flex-wrap gap-1 rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === key}
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                    activeTab === key
                      ? "bg-blue-600 text-white shadow-[0_4px_12px_-4px_rgba(37,99,235,0.5)]"
                      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  <span
                    className={`rounded-full px-1.5 py-0.5 font-mono text-[11px] tabular-nums ${
                      activeTab === key
                        ? "bg-white/20 text-white"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {counts[key] ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-zinc-50">
                  File
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Triée par urgence — cliquez pour examiner
                </p>
              </div>
              <span className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
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
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center dark:border-zinc-700 dark:bg-zinc-800/40">
                  <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Aucune annonce dans cette catégorie.
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
      </motion.div>

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
