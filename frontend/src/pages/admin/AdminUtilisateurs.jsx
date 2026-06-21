import { useEffect, useRef, useState } from "react";
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
  Sparkles,
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
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400",
  PROPRIETAIRE:
    "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  ADMIN: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400",
};

const roleLabels = {
  ETUDIANT: "Étudiant",
  PROPRIETAIRE: "Propriétaire",
  ADMIN: "Administrateur",
};

export default function AdminUtilisateurs({ isDark, onToggleTheme }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCinUser, setSelectedCinUser] = useState(null);
  const [verifyingId, setVerifyingId] = useState(null);
  const [cinResubmitTarget, setCinResubmitTarget] = useState(null);
  const [cinResubmitReason, setCinResubmitReason] = useState("");
  const [cinImageZoomed, setCinImageZoomed] = useState(false);
  const debounceRef = useRef(null);

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

  const handleSuspendre = (id) => {
    adminApi
      .suspendreUser(id)
      .then(() =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isActive: false } : u)),
        ),
      )
      .catch(console.error);
  };

  const handleReactiver = (id) => {
    adminApi
      .reactiverUser(id)
      .then(() =>
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, isActive: true } : u)),
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

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
              Gestion des Utilisateurs
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {users.length} utilisateur(s) chargés
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 shadow-sm dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide opacity-80">
                  CIN à vérifier
                </p>
                <p className="text-lg font-bold">{pendingCinCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, prénom ou e-mail..."
          value={search}
          onChange={handleSearch}
          className="input-field pl-11"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Chargement...
        </div>
      ) : (
        <div className="glass-light rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 dark:border-white/10">
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
                      className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 px-5 py-3.5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                          {u.nom?.[0] ?? "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {u.prenom} {u.nom}
                          </p>
                          <p className="text-xs text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleColors[u.role] ?? ""}`}
                      >
                        {roleLabels[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`text-sm font-medium ${u.isActive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                      >
                        {u.isActive ? "Actif" : "Suspendu"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {u.role === "PROPRIETAIRE" ? (
                        <button
                          type="button"
                          onClick={() => openCinReview(u)}
                          className={`group inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
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
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {u.createdAt
                        ? new Date(u.createdAt).toLocaleDateString("fr-FR")
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {u.isActive ? (
                          <button
                            onClick={() => handleSuspendre(u.id)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-200 transition-colors"
                          >
                            <Ban className="w-3 h-3" /> Suspendre
                          </button>
                        ) : (
                          <button
                            onClick={() => handleReactiver(u.id)}
                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" /> Réactiver
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-8 text-center text-sm text-gray-400"
                    >
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCinUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          onClick={closeCinReview}
        >
          <div
            className="relative max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/20 bg-white shadow-2xl shadow-slate-950/30 dark:bg-dark-800"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-r from-primary-600 via-accent-600 to-cyan-500 opacity-90" />
            <div className="relative flex items-start justify-between gap-4 border-b border-white/20 px-6 py-5 text-white">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                  <Sparkles className="h-3.5 w-3.5" /> Vérification visuelle
                  propriétaire
                </div>
                <h2 className="font-display text-2xl font-bold">
                  Validation CIN
                </h2>
                <p className="text-sm text-white/75">
                  Comparez le numéro saisi avec la photo avant de confirmer le
                  badge propriétaire vérifié.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCinReview}
                className="rounded-2xl bg-white/15 p-2 text-white backdrop-blur transition hover:bg-white/25"
                aria-label="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="relative grid max-h-[calc(92vh-104px)] gap-6 overflow-y-auto p-6 lg:grid-cols-[minmax(0,1.35fr)_420px]">
              <section className="overflow-hidden rounded-3xl border border-gray-200 bg-slate-50 shadow-inner dark:border-white/10 dark:bg-slate-950/30">
                <div className="flex items-center justify-between gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10">
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
                    <Image className="h-4 w-4 text-primary-500" /> Photo CIN
                    uploadée
                  </div>
                  {selectedCinUser.photoCinUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCinImageZoomed((value) => !value)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                      >
                        <ZoomIn className="h-3.5 w-3.5" />{" "}
                        {cinImageZoomed ? "Adapter" : "Zoom"}
                      </button>
                      <a
                        href={selectedCinUser.photoCinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:border-primary-300 hover:text-primary-600 dark:border-white/10 dark:bg-white/5 dark:text-gray-200"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Ouvrir
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex min-h-[440px] items-center justify-center overflow-auto bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_36%),linear-gradient(45deg,rgba(148,163,184,0.15)_25%,transparent_25%,transparent_75%,rgba(148,163,184,0.15)_75%),linear-gradient(45deg,rgba(148,163,184,0.15)_25%,transparent_25%,transparent_75%,rgba(148,163,184,0.15)_75%)] bg-[length:100%_100%,24px_24px,24px_24px] bg-[position:0_0,0_0,12px_12px] p-4 dark:bg-slate-950">
                  {selectedCinUser.photoCinUrl ? (
                    <img
                      src={selectedCinUser.photoCinUrl}
                      alt={`CIN de ${selectedCinUser.prenom} ${selectedCinUser.nom}`}
                      className={`${cinImageZoomed ? "max-w-none cursor-zoom-out" : "max-h-[62vh] max-w-full cursor-zoom-in"} rounded-2xl object-contain shadow-2xl shadow-slate-950/30 transition-all`}
                      onClick={() => setCinImageZoomed((value) => !value)}
                    />
                  ) : (
                    <div className="max-w-sm rounded-3xl border border-dashed border-amber-300 bg-amber-50 p-8 text-center text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                      <AlertTriangle className="mx-auto mb-3 h-10 w-10" />
                      <p className="font-semibold">
                        Aucune photo CIN disponible
                      </p>
                      <p className="mt-1 text-sm opacity-80">
                        Demandez au propriétaire de téléverser à nouveau une image
                        lisible.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <aside className="space-y-4">
                <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-lg font-bold text-white">
                      {selectedCinUser.prenom?.[0] ||
                        selectedCinUser.nom?.[0] ||
                        "P"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-lg font-bold text-gray-900 dark:text-white">
                        {selectedCinUser.prenom} {selectedCinUser.nom}
                      </h3>
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {selectedCinUser.email}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-primary-200 bg-primary-50 p-5 dark:border-primary-500/25 dark:bg-primary-500/10">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">
                    Numéro CIN saisi
                  </p>
                  <div className="rounded-2xl border border-primary-200 bg-white px-4 py-4 font-mono text-2xl font-black tracking-[0.22em] text-gray-950 shadow-sm dark:border-primary-500/25 dark:bg-white/10 dark:text-white">
                    {selectedCinUser.numeroCin || "—"}
                  </div>
                  <p className="mt-3 text-xs leading-relaxed text-primary-700/75 dark:text-primary-200/75">
                    Le numéro ci-dessus vient du formulaire propriétaire. Il
                    doit correspondre visuellement au document uploadé.
                  </p>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-white/5">
                  <p className="mb-4 text-sm font-bold text-gray-900 dark:text-white">
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
                        className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300"
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
                  className={`rounded-3xl border p-5 ${selectedCinUser.estVerifieCin ? "border-emerald-200 bg-emerald-50 dark:border-emerald-500/25 dark:bg-emerald-500/10" : "border-amber-200 bg-amber-50 dark:border-amber-500/25 dark:bg-amber-500/10"}`}
                >
                  <div className="flex items-start gap-3">
                    {selectedCinUser.estVerifieCin ? (
                      <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600 dark:text-emerald-300" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-300" />
                    )}
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedCinUser.estVerifieCin
                          ? "CIN déjà validée"
                          : "Validation manuelle requise"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
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
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-4 font-display font-bold text-white shadow-xl shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-55"
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
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-60 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/15"
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
          <div className="glass-light w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl dark:bg-dark-800">
            <div className="flex items-start gap-3 border-b border-gray-200 px-5 py-4 dark:border-white/10">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                <RefreshCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
                  Demander un nouveau CIN
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Le propriétaire recevra un e-mail et pourra téléverser une
                  photo plus lisible depuis son profil.
                </p>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-2 text-sm font-semibold text-gray-900 dark:text-white">
                {cinResubmitTarget.prenom} {cinResubmitTarget.nom}
              </p>
              <textarea
                value={cinResubmitReason}
                onChange={(event) => setCinResubmitReason(event.target.value)}
                className="input-field mb-4 h-28 resize-none text-sm"
                placeholder="Expliquez ce que le propriétaire doit corriger..."
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCinResubmitTarget(null);
                    setCinResubmitReason("");
                  }}
                  className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 dark:border-white/20 dark:text-gray-300 dark:hover:bg-white/5"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRequestCinResubmission}
                  disabled={verifyingId === cinResubmitTarget.id}
                  className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700 disabled:opacity-50"
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
    </DashboardLayout>
  );
}
