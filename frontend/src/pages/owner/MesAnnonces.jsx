import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Archive,
  ArchiveRestore,
  CalendarDays,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Home,
  Images,
  List,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Pencil,
  Phone,
  PlusCircle,
  ShieldAlert,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../layouts/DashboardLayout";
import ScoreBadge from "../../components/ui/ScoreBadge";
import { useAuth } from "../../hooks/useAuth";
import { ownerApi } from "../../api/ownerApi";

const sidebarLinks = [
  { to: "/dashboard-proprietaire", label: "Tableau de bord", icon: Home },
  { to: "/publier-annonce", label: "Publier une annonce", icon: PlusCircle },
  { to: "/mes-annonces", label: "Mes annonces", icon: List },
  { to: "/profil-proprietaire", label: "Mon profil", icon: User },
];

const statusMeta = {
  VALIDEE: {
    label: "Publiée",
    icon: CheckCircle,
    className:
      "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30",
    tone: "border-zinc-200 dark:border-zinc-800",
    dot: "bg-emerald-500",
  },
  EN_ATTENTE: {
    label: "En vérification",
    icon: Clock,
    className:
      "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30",
    tone: "border-zinc-200 dark:border-zinc-800",
    dot: "bg-amber-500",
  },
  REJETEE: {
    label: "Rejetée",
    icon: XCircle,
    className:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
    tone: "border-red-200 dark:border-red-500/30",
    dot: "bg-red-500",
  },
  SUSPENDUE: {
    label: "Suspendue",
    icon: ShieldAlert,
    className:
      "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
    tone: "border-red-200 dark:border-red-500/30",
    dot: "bg-red-500",
  },
  ARCHIVEE: {
    label: "Archivée",
    icon: Archive,
    className:
      "bg-zinc-100 text-zinc-600 ring-1 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
    tone: "border-zinc-200 dark:border-zinc-800",
    dot: "bg-zinc-400",
  },
};

const contactIcons = {
  TELEPHONE: Phone,
  WHATSAPP: MessageCircle,
  EMAIL: Mail,
  FACEBOOK: MessageCircle,
  INSTAGRAM: MessageCircle,
};

function formatDate(value) {
  if (!value) return "Date inconnue";
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatusPill({ statut }) {
  const meta = statusMeta[statut] || statusMeta.EN_ATTENTE;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${meta.className}`}
    >
      <Icon className="h-3.5 w-3.5" />
      {meta.label}
    </span>
  );
}

function ownerChatbotUrl(annonce) {
  const params = new URLSearchParams({
    intent: "owner-dashboard",
    ownerAnnonceId: annonce.id,
  });
  if (annonce.titre) params.set("ownerAnnonceTitle", annonce.titre);
  if (annonce.statut) params.set("ownerAnnonceStatus", annonce.statut);
  if (annonce.ville) params.set("ownerAnnonceCity", annonce.ville);
  if (annonce.typeLogement)
    params.set("ownerAnnonceType", annonce.typeLogement);
  if (annonce.loyer !== null && annonce.loyer !== undefined) {
    params.set("ownerAnnonceRent", String(annonce.loyer));
  }
  if (annonce.photos?.[0]) {
    params.set("ownerAnnoncePhoto", annonce.photos[0]);
  }
  return `/chatbot?${params.toString()}`;
}

function AnnonceCard({
  annonce,
  onArchive,
  onUnarchive,
  onDelete,
  actionBusy,
}) {
  const [open, setOpen] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const meta = statusMeta[annonce.statut] || statusMeta.EN_ATTENTE;
  const image = annonce.photos?.[0];
  const contacts = annonce.contacts || [];
  const equipements = annonce.equipements || [];
  const photoCount = annonce.photos?.length || 0;

  const canEdit = annonce.statut === "REJETEE";
  const canArchive =
    annonce.statut === "VALIDEE" || annonce.statut === "EN_ATTENTE";
  const canUnarchive = annonce.statut === "ARCHIVEE";
  const canDelete =
    annonce.statut === "REJETEE" || annonce.statut === "ARCHIVEE";

  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg dark:bg-zinc-900 ${meta.tone}`}
    >
      <div className="flex flex-col md:flex-row">
        <div
          className="relative flex-shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800"
          style={{ width: 168, height: 148, flexBasis: 168 }}
        >
          {image ? (
            <img
              src={image}
              alt={annonce.titre}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400">
              <Home className="h-8 w-8" />
            </div>
          )}
          {photoCount > 1 && (
            <div className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 font-mono text-[11px] font-semibold text-white">
              <Images className="h-3 w-3" />
              {photoCount}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-geist text-lg font-bold leading-tight tracking-[-0.01em] text-zinc-950 dark:text-white">
                  {annonce.titre}
                </h2>
                <StatusPill statut={annonce.statut} />
              </div>
              <div className="mt-2 flex min-w-0 items-center gap-1 text-sm text-zinc-500 dark:text-zinc-400">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">
                  {annonce.ville} · {annonce.adresse}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                to={ownerChatbotUrl(annonce)}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                <MessageCircle className="h-4 w-4" />
                UniBot
              </Link>
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="inline-flex items-center justify-center rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800 transition-colors hover:border-blue-300 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:text-blue-300"
              >
                {open ? "Masquer" : "Détails"}
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-[1.15fr_0.85fr_0.85fr]">
            <div className="rounded-2xl bg-zinc-50 px-4 py-3 dark:bg-zinc-800/60">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                loyer mensuel
              </p>
              <p className="mt-1 font-mono text-2xl font-bold leading-none tabular-nums text-zinc-950 dark:text-white">
                {Number(annonce.loyer || 0).toLocaleString("fr-FR")}{" "}
                <span className="text-sm font-medium text-zinc-400">MAD</span>
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {annonce.chargesIncluses
                  ? "Charges incluses"
                  : "Charges non incluses"}
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                logement
              </p>
              <p className="mt-1 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {annonce.typeLogement}
              </p>
              <p className="font-mono text-sm tabular-nums text-zinc-500 dark:text-zinc-400">
                {annonce.superficie || "-"} m²
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                confiance
              </p>
              <div className="mt-2">
                <ScoreBadge score={annonce.scoreConfiance || 0} size="sm" />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Eye className="h-3.5 w-3.5" /> {annonce.nbVues ?? 0} vue
              {(annonce.nbVues ?? 0) > 1 ? "s" : ""}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Heart className="h-3.5 w-3.5" /> {annonce.favoris ?? 0} favoris
            </span>
            {equipements.slice(0, 6).map((equipement) => (
              <span
                key={equipement}
                className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300"
              >
                {equipement}
              </span>
            ))}
            {equipements.length > 6 && (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                +{equipements.length - 6}
              </span>
            )}
          </div>

          {annonce.raisonStatut && (
            <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{annonce.raisonStatut}</span>
            </div>
          )}

          {annonce.statut === "SUSPENDUE" && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/60 px-4 py-2.5 text-sm text-red-800 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>
                Cette annonce a été suspendue par l'équipe UniHome suite à des
                signalements. Elle n'est plus visible par les étudiants.
                Corrigez les éléments concernés puis contactez-nous pour
                demander une nouvelle vérification.
              </span>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-200 pt-3 font-mono text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 dark:border-zinc-700">
              <CalendarDays className="h-3.5 w-3.5" />
              Publiée {formatDate(annonce.datePublication)}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 px-2.5 py-1 dark:border-zinc-700">
              <Images className="h-3.5 w-3.5" />
              {photoCount} photo{photoCount > 1 ? "s" : ""}
            </span>
          </div>

          {(canEdit || canArchive || canUnarchive || canDelete) && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {canEdit && (
                <Link
                  to={`/mes-annonces/${annonce.id}/modifier`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
                >
                  <Pencil className="h-4 w-4" /> Modifier et resoumettre
                </Link>
              )}
              {canArchive && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => onArchive(annonce)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                >
                  {actionBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Archive className="h-4 w-4" />
                  )}
                  Archiver
                </button>
              )}
              {canUnarchive && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => onUnarchive(annonce)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
                >
                  {actionBusy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArchiveRestore className="h-4 w-4" />
                  )}
                  Désarchiver
                </button>
              )}
              {canDelete && !confirmingDelete && (
                <button
                  type="button"
                  disabled={actionBusy}
                  onClick={() => setConfirmingDelete(true)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" /> Supprimer
                </button>
              )}
              {canDelete && confirmingDelete && (
                <span className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-sm dark:border-red-500/20 dark:bg-red-500/10">
                  <span className="font-medium text-red-700 dark:text-red-300">
                    Suppression définitive ?
                  </span>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => onDelete(annonce)}
                    className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionBusy ? "Suppression..." : "Confirmer"}
                  </button>
                  <button
                    type="button"
                    disabled={actionBusy}
                    onClick={() => setConfirmingDelete(false)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
                  >
                    Annuler
                  </button>
                </span>
              )}
            </div>
          )}

          {open && (
            <div className="mt-4 grid gap-4 border-t border-zinc-200 pt-4 dark:border-zinc-800 lg:grid-cols-2">
              <div>
                <h3 className="font-geist text-sm font-semibold text-zinc-950 dark:text-white">
                  Description
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {annonce.description}
                </p>
              </div>
              <div>
                <h3 className="font-geist text-sm font-semibold text-zinc-950 dark:text-white">
                  Contacts
                </h3>
                <div className="mt-2 space-y-2">
                  {contacts.map((contact) => {
                    const Icon = contactIcons[contact.plateforme] || Phone;
                    return (
                      <div
                        key={`${contact.plateforme}-${contact.valeur}`}
                        className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300"
                      >
                        <Icon className="h-4 w-4 text-blue-500" />
                        <span className="font-mono text-xs uppercase tracking-[0.08em]">
                          {contact.plateforme}
                        </span>
                        <span>{contact.valeur}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function MesAnnonces({ isDark, onToggleTheme }) {
  const { user } = useAuth();
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("TOUTES");
  const [busyAnnonceId, setBusyAnnonceId] = useState(null);

  const runAction = async (annonce, action, apply) => {
    setBusyAnnonceId(annonce.id);
    setError("");
    try {
      const res = await action();
      apply(res);
    } catch (err) {
      const serverMsg =
        err?.response?.data?.message || err?.response?.data?.detail;
      setError(serverMsg || "L'opération a échoué. Réessayez.");
    } finally {
      setBusyAnnonceId(null);
    }
  };

  const handleArchive = (annonce) =>
    runAction(
      annonce,
      () => ownerApi.archiveAnnonce(annonce.id),
      (res) =>
        setAnnonces((prev) =>
          prev.map((item) =>
            item.id === annonce.id
              ? { ...item, statut: res?.data?.statut || "ARCHIVEE" }
              : item,
          ),
        ),
    );

  const handleUnarchive = (annonce) =>
    runAction(
      annonce,
      () => ownerApi.unarchiveAnnonce(annonce.id),
      (res) =>
        setAnnonces((prev) =>
          prev.map((item) =>
            item.id === annonce.id
              ? { ...item, statut: res?.data?.statut || "EN_ATTENTE" }
              : item,
          ),
        ),
    );

  const handleDelete = (annonce) =>
    runAction(
      annonce,
      () => ownerApi.deleteAnnonce(annonce.id),
      () =>
        setAnnonces((prev) => prev.filter((item) => item.id !== annonce.id)),
    );

  useEffect(() => {
    if (!user?.id) return;
    let isMounted = true;
    setLoading(true);
    ownerApi
      .getOwnerAnnonces(user.id)
      .then((res) => {
        if (isMounted) setAnnonces(res.data || []);
      })
      .catch((err) => {
        const serverMsg =
          err?.response?.data?.message || err?.response?.data?.detail;
        if (isMounted)
          setError(serverMsg || "Impossible de charger vos annonces.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const counts = useMemo(() => {
    return annonces.reduce(
      (acc, annonce) => {
        acc.total += 1;
        acc[annonce.statut] = (acc[annonce.statut] || 0) + 1;
        return acc;
      },
      { total: 0 },
    );
  }, [annonces]);

  const filteredAnnonces = useMemo(() => {
    if (filter === "TOUTES") return annonces;
    return annonces.filter((annonce) => annonce.statut === filter);
  }, [annonces, filter]);

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
            portefeuille · {counts.total} annonce{counts.total > 1 ? "s" : ""}
          </p>
          <h1 className="mt-1 font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-white">
            Mes annonces
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Suivez la publication, la modération et les détails de vos
            logements.
          </p>
        </div>
        <Link
          to="/publier-annonce"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700"
        >
          <PlusCircle className="h-4 w-4" /> Nouvelle annonce
        </Link>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <button
          type="button"
          onClick={() => setFilter("TOUTES")}
          className={`rounded-2xl border p-4 text-left transition-all ${filter === "TOUTES" ? "border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
            total
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-zinc-950 dark:text-white">
            {counts.total}
          </p>
        </button>
        {["VALIDEE", "EN_ATTENTE", "REJETEE", "SUSPENDUE", "ARCHIVEE"].map(
          (status) => {
            const meta = statusMeta[status];
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={`rounded-2xl border p-4 text-left transition-all ${filter === status ? "border-blue-300 bg-blue-50 dark:border-blue-500/40 dark:bg-blue-500/10" : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}
              >
                <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  {meta.label}
                </p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-zinc-950 dark:text-white">
                  {counts[status] || 0}
                </p>
              </button>
            );
          },
        )}
      </div>

      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-56 animate-pulse rounded-3xl bg-zinc-100 dark:bg-zinc-800/60"
            />
          ))}
        </div>
      ) : filteredAnnonces.length > 0 ? (
        <div className="mx-auto max-w-5xl space-y-4">
          {filteredAnnonces.map((annonce) => (
            <AnnonceCard
              key={annonce.id}
              annonce={annonce}
              onArchive={handleArchive}
              onUnarchive={handleUnarchive}
              onDelete={handleDelete}
              actionBusy={busyAnnonceId === annonce.id}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-zinc-300 bg-white p-10 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <Home className="mx-auto h-10 w-10 text-zinc-400" />
          <h2 className="mt-4 font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-white">
            Aucune annonce trouvée
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-zinc-500 dark:text-zinc-400">
            Publiez un logement ou changez le filtre de statut pour retrouver
            vos annonces.
          </p>
          <Link
            to="/publier-annonce"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700"
          >
            Publier une annonce
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
