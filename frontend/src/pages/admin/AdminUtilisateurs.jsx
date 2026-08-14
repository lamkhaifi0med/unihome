import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertTriangle,
  BadgeCheck,
  Ban,
  CheckCircle,
  CreditCard,
  ExternalLink,
  Flag,
  Image,
  LayoutDashboard,
  Loader2,
  RefreshCcw,
  Search,
  Send,
  Shield,
  X,
  ZoomIn,
  Users,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { adminApi } from "../../api/adminApi";

const sidebarLinks = [
  { to: "/admin", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/admin/moderation", label: "Modération", icon: Shield },
  { to: "/admin/signalements", label: "Signalements", icon: Flag },
  { to: "/admin/utilisateurs", label: "Utilisateurs", icon: Users },
];

const roleColors = {
  ETUDIANT:
    "bg-blue-50 text-blue-700 ring-1 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/30",
  PROPRIETAIRE:
    "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30",
  ADMIN:
    "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30",
};

const roleLabels = {
  ETUDIANT: "Étudiant",
  PROPRIETAIRE: "Propriétaire",
  ADMIN: "Administrateur",
};

const ROLE_FILTERS = [
  ["TOUS", "Tous"],
  ["ETUDIANT", "Étudiants"],
  ["PROPRIETAIRE", "Propriétaires"],
];

export default function AdminUtilisateurs({ isDark, onToggleTheme }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCinUser, setSelectedCinUser] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [cinResubmitTarget, setCinResubmitTarget] = useState(null);
  const [cinResubmitReason, setCinResubmitReason] = useState("");
  const [cinImageZoomed, setCinImageZoomed] = useState(false);
  const [suspendTarget, setSuspendTarget] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [suspending, setSuspending] = useState(false);
  const [appealTarget, setAppealTarget] = useState(null);
  const [roleFilter, setRoleFilter] = useState("TOUS");
  const debounceRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const fetchUsers = (q) => {
    setLoading(true);
    adminApi
      .getUsers(q)
      .then((res) => setUsers(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers("");
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchUsers(val), 400);
  };

  const openSuspend = (user) => {
    setSuspendTarget(user);
    setSuspendReason("");
  };

  const handleSuspendre = () => {
    if (!suspendTarget) return;
    setSuspending(true);
    adminApi
      .suspendreUser(suspendTarget.id, suspendReason.trim() || null)
      .then(() => {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === suspendTarget.id
              ? {
                  ...u,
                  isActive: false,
                  raisonSuspension: suspendReason.trim() || null,
                  appelMessage: null,
                  appelDate: null,
                }
              : u,
          ),
        );
        setSuspendTarget(null);
        setSuspendReason("");
      })
      .catch(console.error)
      .finally(() => setSuspending(false));
  };

  const handleReactiver = (id) => {
    adminApi
      .reactiverUser(id)
      .then(() =>
        setUsers((prev) =>
          prev.map((u) =>
            u.id === id
              ? {
                  ...u,
                  isActive: true,
                  raisonSuspension: null,
                  appelMessage: null,
                  appelDate: null,
                }
              : u,
          ),
        ),
      )
      .catch(console.error);
  };

  const handleValiderCin = (id) => {
    setVerifyingId(id);
    adminApi
      .validerCin(id)
      .then(() => {
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, estVerifieCin: true } : u)),
        );
        setSelectedCinUser((current) =>
          current?.id === id ? { ...current, estVerifieCin: true } : current,
        );
      })
      .catch(console.error)
      .finally(() => setVerifyingId(null));
  };

  const openCinResubmit = (user) => {
    setCinResubmitTarget(user);
    setCinResubmitReason(
      "La photo CIN fournie n'est pas assez lisible. Merci de téléverser une nouvelle photo claire, complète et sans flou.",
    );
  };

  const handleRequestCinResubmission = () => {
    if (!cinResubmitTarget) return;
    setVerifyingId(cinResubmitTarget.id);
    adminApi
      .demanderNouveauCin(cinResubmitTarget.id, cinResubmitReason)
      .then(() => {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === cinResubmitTarget.id ? { ...u, estVerifieCin: false } : u,
          ),
        );
        setSelectedCinUser((current) =>
          current?.id === cinResubmitTarget.id
            ? { ...current, estVerifieCin: false }
            : current,
        );
        setCinResubmitTarget(null);
        setCinResubmitReason("");
      })
      .catch(console.error)
      .finally(() => setVerifyingId(null));
  };

  const openCinReview = (user) => {
    setSelectedCinUser(user);
    setCinImageZoomed(false);
  };

  const closeCinReview = () => {
    setSelectedCinUser(null);
    setCinImageZoomed(false);
  };

  const pendingCinCount = users.filter(
    (u) => u.role === "PROPRIETAIRE" && !u.estVerifieCin,
  ).length;

  const shown = useMemo(
    () =>
      roleFilter === "TOUS"
        ? users
        : users.filter((u) => u.role === roleFilter),
    [users, roleFilter],
  );
  const suspendedCount = users.filter((u) => !u.isActive).length;

  const roleCount = (key) =>
    key === "TOUS" ? users.length : users.filter((u) => u.role === key).length;

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="mb-6"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-900 dark:text-white">
              Gestion des utilisateurs
            </h1>
            <p className="mt-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
              <span className="font-semibold text-zinc-900 dark:text-white">
                {users.length}
              </span>{" "}
              comptes{" "}
              <span className="text-zinc-300 dark:text-zinc-600">|</span>{" "}
              <span
                className={
                  suspendedCount > 0
                    ? "font-semibold text-red-600 dark:text-red-400"
                    : ""
                }
              >
                {suspendedCount} suspendu{suspendedCount > 1 ? "s" : ""}
              </span>
            </p>
          </div>
          <div
            className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
              pendingCinCount > 0
                ? "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-200"
                : "border-zinc-200 bg-white text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            <CreditCard className="h-5 w-5" />
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] opacity-80">
                CIN à vérifier
              </p>
              <p className="font-mono text-lg font-bold leading-tight">
                {pendingCinCount}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, prénom ou e-mail..."
            value={search}
            onChange={handleSearch}
            className="w-full rounded-full border border-zinc-200 bg-white py-2.5 pl-11 pr-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-blue-500"
          />
        </div>
        <div
          role="tablist"
          aria-label="Filtrer par rôle"
          className="inline-flex items-center gap-1 self-start rounded-full border border-zinc-200 bg-white p-1 dark:border-zinc-800 dark:bg-zinc-900"
        >
          {ROLE_FILTERS.map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={roleFilter === key}
              onClick={() => setRoleFilter(key)}
              className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                roleFilter === key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
              }`}
            >
              {label}
              <span
                className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] ${
                  roleFilter === key
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {roleCount(key)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 font-mono text-xs text-zinc-400">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> chargement…
        </div>
      ) : (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  {[
                    "Utilisateur",
                    "Rôle",
                    "Statut",
                    "CIN",
                    "Inscription",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {shown.map((u) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white dark:bg-blue-500">
                          {u.nom?.[0] ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-900 dark:text-white">
                            {u.prenom} {u.nom}
                          </p>
                          <p className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${roleColors[u.role] ?? ""}`}
                      >
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-sm font-medium ${u.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${u.isActive ? "bg-emerald-500" : "bg-red-500"}`}
                        />
                        {u.isActive ? "Actif" : "Suspendu"}
                      </span>
                      {!u.isActive && u.raisonSuspension && (
                        <p
                          className="mt-0.5 max-w-[200px] truncate text-xs text-zinc-400 dark:text-zinc-500"
                          title={u.raisonSuspension}
                        >
                          {u.raisonSuspension}
                        </p>
                      )}
                      {!u.isActive && u.appelMessage && (
                        <button
                          type="button"
                          onClick={() => setAppealTarget(u)}
                          className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200 transition hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30 dark:hover:bg-amber-500/20"
                          title="Voir le message d'appel"
                        >
                          <Flag className="h-3 w-3" /> Appel reçu — voir
                        </button>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {u.role === "PROPRIETAIRE" ? (
                        <button
                          type="button"
                          onClick={() => openCinReview(u)}
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            u.estVerifieCin
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300 dark:hover:bg-emerald-500/15"
                              : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                          }`}
                        >
                          {u.estVerifieCin ? (
                            <BadgeCheck className="h-3.5 w-3.5" />
                          ) : (
                            <CreditCard className="h-3.5 w-3.5" />
                          )}
                          {u.estVerifieCin ? "CIN validée" : "Examiner CIN"}
                        </button>
                      ) : (
                        <span className="text-xs text-zinc-300 dark:text-zinc-600">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {u.isActive ? (
                          <button
                            onClick={() => openSuspend(u)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/15"
                          >
                            <Ban className="h-3 w-3" /> Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactiver(u.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/15"
                          >
                            <CheckCircle className="h-3 w-3" /> Réactiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {shown.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center font-mono text-xs text-zinc-400"
                    >
                      aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {selectedCinUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 p-4 backdrop-blur-sm"
          onClick={closeCinReview}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Validation CIN"
            className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-zinc-200 px-6 py-5 dark:border-zinc-800">
              <div>
                <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
                  vérification visuelle · propriétaire
                </p>
                <h2 className="font-geist text-xl font-bold tracking-[-0.01em] text-zinc-900 dark:text-white">
                  Validation CIN
                </h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Comparez le numéro saisi avec la photo avant de confirmer le
                  badge propriétaire vérifié.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCinReview}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid max-h-[calc(92vh-104px)] gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1.35fr)_420px]">
              <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                    <Image className="h-4 w-4 text-blue-600 dark:text-blue-400" />{" "}
                    Photo CIN uploadée
                  </div>
                  {selectedCinUser.photoCinUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCinImageZoomed((value) => !value)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-500"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />{" "}
                        {cinImageZoomed ? "Adapter" : "Zoom"}
                      </button>
                      <a
                        href={selectedCinUser.photoCinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 transition hover:border-blue-300 hover:text-blue-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-blue-500"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex min-h-[440px] items-center justify-center overflow-auto bg-[linear-gradient(45deg,rgba(148,163,184,0.12)_25%,transparent_25%,transparent_75%,rgba(148,163,184,0.12)_75%),linear-gradient(45deg,rgba(148,163,184,0.12)_25%,transparent_25%,transparent_75%,rgba(148,163,184,0.12)_75%)] bg-[length:24px_24px,24px_24px] bg-[position:0_0,12px_12px] p-4">
                  {selectedCinUser.photoCinUrl ? (
                    <img
                      src={selectedCinUser.photoCinUrl}
                      alt={`CIN de ${selectedCinUser.prenom} ${selectedCinUser.nom}`}
                      className={`${cinImageZoomed ? "max-w-none cursor-zoom-out" : "max-h-[62vh] max-w-full cursor-zoom-in"} rounded-2xl object-contain shadow-xl transition-all`}
                      onClick={() => setCinImageZoomed((value) => !value)}
                    />
                  ) : (
                    <div className="max-w-sm rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-8 text-center text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10" />
                      <p className="font-semibold">
                        Aucune photo CIN disponible
                      </p>
                      <p className="mt-1 text-sm opacity-80">
                        Demandez au propriétaire de téléverser à nouveau une
                        image lisible.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white dark:bg-blue-500">
                      {selectedCinUser.prenom?.[0] ||
                        selectedCinUser.nom?.[0] ||
                        "P"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-geist text-lg font-bold tracking-[-0.01em] text-zinc-900 dark:text-white">
                        {selectedCinUser.prenom} {selectedCinUser.nom}
                      </h3>
                      <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                        {selectedCinUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-500/25 dark:bg-blue-500/10">
                  <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-700 dark:text-blue-300">
                    numéro CIN saisi
                  </p>
                  <div className="rounded-xl border border-blue-200 bg-white px-4 py-4 font-mono text-2xl font-black tracking-[0.22em] text-zinc-950 dark:border-blue-500/25 dark:bg-zinc-900 dark:text-white">
                    {selectedCinUser.numeroCin || "—"}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-blue-700/75 dark:text-blue-200/75">
                    Le numéro ci-dessus vient du formulaire propriétaire. Il
                    doit correspondre visuellement au document uploadé.
                  </p>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                  <p className="mb-4 text-sm font-bold text-zinc-900 dark:text-white">
                    Checklist de validation
                  </p>
                  <div className="space-y-3">
                    {[
                      "Photo nette et complète",
                      "Numéro CIN identique au champ saisi",
                      "Nom/prénom cohérent avec le compte",
                      "Aucun signe évident de modification",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-start gap-3 text-sm text-zinc-600 dark:text-zinc-300"
                      >
                        <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300">
                          ✓
                        </span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className={`rounded-2xl border p-5 ${selectedCinUser.estVerifieCin ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10" : "border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10"}`}
                >
                  <div className="flex items-start gap-3">
                    {selectedCinUser.estVerifieCin ? (
                      <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {selectedCinUser.estVerifieCin
                          ? "CIN déjà validée"
                          : "Validation manuelle requise"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-300">
                        {selectedCinUser.estVerifieCin
                          ? "Ce propriétaire possède déjà le badge CIN vérifié."
                          : "Cliquez uniquement après comparaison visuelle du numéro et de la photo."}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleValiderCin(selectedCinUser.id)}
                  disabled={
                    selectedCinUser.estVerifieCin ||
                    verifyingId === selectedCinUser.id ||
                    !selectedCinUser.photoCinUrl ||
                    !selectedCinUser.numeroCin
                  }
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifyingId === selectedCinUser.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <BadgeCheck className="h-5 w-5" />
                  )}
                  {selectedCinUser.estVerifieCin
                    ? "CIN déjà vérifiée"
                    : "Confirmer et vérifier CIN"}
                </button>

                {!selectedCinUser.estVerifieCin && (
                  <button
                    type="button"
                    onClick={() => openCinResubmit(selectedCinUser)}
                    disabled={verifyingId === selectedCinUser.id}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
                  >
                    <RefreshCcw className="h-4 w-4" /> Demander une nouvelle
                    photo
                  </button>
                )}
              </aside>
            </div>
          </div>
        </div>
      )}

      {cinResubmitTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Demander un nouveau CIN"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-900 dark:text-white">
                  Demander un nouveau CIN
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Le propriétaire recevra un e-mail et pourra téléverser une
                  photo plus lisible depuis son profil.
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">
                {cinResubmitTarget.prenom} {cinResubmitTarget.nom}
              </p>
              <textarea
                value={cinResubmitReason}
                onChange={(event) => setCinResubmitReason(event.target.value)}
                className="mb-4 h-28 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500"
                placeholder="Expliquez ce que le propriétaire doit corriger..."
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCinResubmitTarget(null);
                    setCinResubmitReason("");
                  }}
                  className="flex-1 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRequestCinResubmission}
                  disabled={verifyingId === cinResubmitTarget.id}
                  className="flex-1 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-500 disabled:opacity-50"
                >
                  {verifyingId === cinResubmitTarget.id ? (
                    "Envoi..."
                  ) : (
                    <span className="inline-flex items-center gap-1.5">
                      <Send className="h-4 w-4" /> Envoyer
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {appealTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm"
          onClick={() => setAppealTarget(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Appel de suspension"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  <Flag className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-900 dark:text-white">
                    Appel de suspension
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                    {appealTarget.prenom} {appealTarget.nom} ·{" "}
                    {appealTarget.appelDate
                      ? new Date(appealTarget.appelDate).toLocaleString("fr-FR")
                      : "date inconnue"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAppealTarget(null)}
                className="rounded-full p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                aria-label="Fermer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4 p-5">
              {appealTarget.raisonSuspension && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-500/25 dark:bg-red-500/10">
                  <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
                    motif de suspension
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {appealTarget.raisonSuspension}
                  </p>
                </div>
              )}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/25 dark:bg-amber-500/10">
                <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
                  message de l'utilisateur
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-900 dark:text-amber-100">
                  {appealTarget.appelMessage}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAppealTarget(null)}
                  className="flex-1 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleReactiver(appealTarget.id);
                    setAppealTarget(null);
                  }}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  <CheckCircle className="h-4 w-4" /> Réactiver le compte
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {suspendTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-zinc-950/60 p-4 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Suspendre le compte"
            className="w-full max-w-lg overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex items-start gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-900 dark:text-white">
                  Suspendre le compte
                </h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  L'utilisateur verra ce motif à sa prochaine tentative de
                  connexion et pourra faire appel.
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-2 text-sm font-semibold text-zinc-900 dark:text-white">
                {suspendTarget.prenom} {suspendTarget.nom}
              </p>
              <textarea
                value={suspendReason}
                onChange={(event) => setSuspendReason(event.target.value)}
                className="mb-4 h-28 w-full resize-none rounded-xl border border-zinc-200 bg-white p-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-red-400 focus:ring-2 focus:ring-red-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500"
                placeholder="Motif de la suspension (ex : annonces frauduleuses, comportement abusif...)"
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSuspendTarget(null);
                    setSuspendReason("");
                  }}
                  className="flex-1 rounded-full border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSuspendre}
                  disabled={suspending}
                  className="flex-1 rounded-full bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
                >
                  {suspending ? "Suspension..." : "Suspendre le compte"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
