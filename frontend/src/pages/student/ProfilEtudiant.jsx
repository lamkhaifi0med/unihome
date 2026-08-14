import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Heart,
  Home,
  Loader2,
  MessageCircle,
  Save,
  Search,
  User,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../hooks/useAuth";
import { usersApi } from "../../api/usersApi";
import { ownerApi } from "../../api/ownerApi";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-blue-500";

const sidebarLinks = [
  { to: "/dashboard-etudiant", label: "Tableau de bord", icon: Home },
  { to: "/favoris", label: "Mes favoris", icon: Heart },
  { to: "/profil", label: "Mon profil", icon: User },
  { to: "/search", label: "Rechercher", icon: Search },
  { to: "/chatbot", label: "Assistant IA", icon: MessageCircle },
];

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  universiteId: "",
  villeRecherche: "",
  budgetMax: "",
};

export default function ProfilEtudiant({ isDark, onToggleTheme }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [universites, setUniversites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const [profileRes, universitesRes] = await Promise.all([
          usersApi.getMe(),
          ownerApi.getUniversites(),
        ]);

        if (!mounted) return;

        const profile = profileRes.data || {};
        setForm({
          nom: profile.nom || "",
          prenom: profile.prenom || "",
          email: profile.email || "",
          universiteId: profile.universiteId || "",
          villeRecherche: profile.villeRecherche || "",
          budgetMax: profile.budgetMax ?? "",
        });
        setUniversites(universitesRes.data || []);
        updateUser(profile);
      } catch (error) {
        if (mounted) {
          setMessage({
            type: "error",
            text:
              error?.response?.data?.detail ||
              "Impossible de charger votre profil.",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [updateUser]);

  const cityOptions = useMemo(() => {
    return [...new Set(universites.map((u) => u.ville).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
  }, [universites]);

  const selectedUniversity = universites.find(
    (u) => String(u.id) === String(form.universiteId),
  );
  const completedItems = [
    form.nom.trim(),
    form.prenom.trim(),
    form.universiteId,
    form.villeRecherche,
    form.budgetMax,
  ].filter(Boolean).length;
  const completion = Math.round((completedItems / 5) * 100);

  const set = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setMessage(null);
  };

  const handleUniversityChange = (event) => {
    const universiteId = event.target.value;
    const universite = universites.find(
      (u) => String(u.id) === String(universiteId),
    );
    setForm((current) => ({
      ...current,
      universiteId,
      villeRecherche: universite?.ville || current.villeRecherche,
    }));
    setMessage(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        universiteId: form.universiteId || null,
        villeRecherche: form.villeRecherche || null,
        budgetMax: form.budgetMax ? Number(form.budgetMax) : null,
      };
      const response = await usersApi.updateMe(payload);
      const savedProfile = response.data || {};
      updateUser(savedProfile);
      setForm((current) => ({
        ...current,
        ...savedProfile,
        universiteId: savedProfile.universiteId || current.universiteId,
        budgetMax: savedProfile.budgetMax ?? current.budgetMax,
      }));
      setMessage({ type: "success", text: "Profil sauvegardé avec succès." });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.detail ||
          "Impossible de sauvegarder votre profil.",
      });
    } finally {
      setSaving(false);
    }
  };

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
        className="mb-8"
      >
        <h1 className="font-geist text-2xl font-bold tracking-[-0.02em] text-zinc-950 dark:text-zinc-50">
          Mon profil
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Complétez vos informations pour recevoir des annonces mieux adaptées.
        </p>
      </motion.div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.05 }}
        className="grid xl:grid-cols-[320px_minmax(0,1fr)] gap-6"
      >
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white dark:bg-blue-500">
              {(form.prenom || form.nom || user?.nom || "E")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-geist font-bold tracking-[-0.01em] text-zinc-900 dark:text-white">
                {[form.prenom, form.nom].filter(Boolean).join(" ") ||
                  "Étudiant"}
              </h2>
              <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                {form.email}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                profil complété
              </span>
              <span className="font-mono text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {completion}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Université, ville et budget aident UniHome à classer les logements
              les plus pertinents.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-500/25 dark:bg-blue-500/10">
            <div className="flex items-start gap-3">
              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-300" />
              <div>
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {selectedUniversity?.nom || "Université non sélectionnée"}
                </p>
                <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {form.villeRecherche || "Ville recherchée non sélectionnée"}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          {loading ? (
            <div className="flex h-72 items-center justify-center font-mono text-xs text-zinc-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              chargement du profil…
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-5 dark:border-zinc-800">
                <div>
                  <h3 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-900 dark:text-white">
                    Informations et préférences
                  </h3>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Ces champs complètent votre profil étudiant dans la base.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-colors hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Sauvegarder
                </button>
              </div>

              {message && (
                <div
                  className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                    message.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
                      : "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                  }`}
                >
                  {message.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={set("prenom")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={set("nom")}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  Adresse e-mail
                </label>
                <input
                  type="email"
                  value={form.email}
                  disabled
                  className={`${inputClass} cursor-not-allowed opacity-70`}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    Université
                  </label>
                  <select
                    value={form.universiteId}
                    onChange={handleUniversityChange}
                    className={inputClass}
                  >
                    <option value="">Sélectionner une université</option>
                    {universites.map((universite) => (
                      <option key={universite.id} value={universite.id}>
                        {universite.nom} - {universite.ville}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                    Ville recherchée
                  </label>
                  <select
                    value={form.villeRecherche}
                    onChange={set("villeRecherche")}
                    className={inputClass}
                  >
                    <option value="">Sélectionner une ville</option>
                    {cityOptions.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                  Budget maximum mensuel
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={form.budgetMax}
                    onChange={set("budgetMax")}
                    placeholder="Ex: 2500"
                    className={`${inputClass} pr-16`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs font-medium text-zinc-400">
                    MAD
                  </span>
                </div>
              </div>
            </form>
          )}
        </section>
      </motion.div>
    </DashboardLayout>
  );
}
