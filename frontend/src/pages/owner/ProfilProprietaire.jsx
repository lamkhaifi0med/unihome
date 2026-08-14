import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileCheck2,
  Home,
  List,
  Loader2,
  Phone,
  PlusCircle,
  Save,
  Shield,
  Star,
  UploadCloud,
  User,
} from "lucide-react";
import DashboardLayout from "../../layouts/DashboardLayout";
import { useAuth } from "../../hooks/useAuth";
import { usersApi } from "../../api/usersApi";

const sidebarLinks = [
  { to: "/dashboard-proprietaire", label: "Tableau de bord", icon: Home },
  { to: "/publier-annonce", label: "Publier une annonce", icon: PlusCircle },
  { to: "/mes-annonces", label: "Mes annonces", icon: List },
  { to: "/profil-proprietaire", label: "Mon profil", icon: User },
];

const emptyForm = {
  nom: "",
  prenom: "",
  email: "",
  telephone: "",
  numeroCin: "",
  photoCinUrl: "",
  estVerifieCin: false,
  noteMoyenne: null,
  nbAvisTotal: 0,
};

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-500";
const labelClass =
  "block font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-1.5";

export default function ProfilProprietaire({ isDark, onToggleTheme }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cinFile, setCinFile] = useState(null);
  const [uploadingCin, setUploadingCin] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        const response = await usersApi.getMe();
        if (!mounted) return;

        const profile = response.data || {};
        setForm({
          nom: profile.nom || "",
          prenom: profile.prenom || "",
          email: profile.email || "",
          telephone: profile.telephone || "",
          numeroCin: profile.numeroCin || "",
          photoCinUrl: profile.photoCinUrl || "",
          estVerifieCin: Boolean(profile.estVerifieCin),
          noteMoyenne: profile.noteMoyenne,
          nbAvisTotal: profile.nbAvisTotal || 0,
        });
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

  const completedItems = [
    form.nom.trim(),
    form.prenom.trim(),
    form.telephone.trim(),
    form.numeroCin.trim(),
    form.photoCinUrl,
  ].filter(Boolean).length;
  const completion = Math.round((completedItems / 5) * 100);

  const set = (key) => (event) => {
    setForm((current) => ({ ...current, [key]: event.target.value }));
    setMessage(null);
  };

  const syncProfile = (profile) => {
    setForm((current) => ({
      ...current,
      nom: profile.nom ?? current.nom,
      prenom: profile.prenom ?? current.prenom,
      email: profile.email ?? current.email,
      telephone: profile.telephone ?? current.telephone,
      numeroCin: profile.numeroCin ?? current.numeroCin,
      photoCinUrl: profile.photoCinUrl ?? current.photoCinUrl,
      estVerifieCin: Boolean(profile.estVerifieCin),
      noteMoyenne: profile.noteMoyenne ?? current.noteMoyenne,
      nbAvisTotal: profile.nbAvisTotal ?? current.nbAvisTotal,
    }));
    updateUser(profile);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        telephone: form.telephone.trim(),
      };
      const response = await usersApi.updateMe(payload);
      const savedProfile = response.data || {};
      syncProfile(savedProfile);
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

  const handleCinUpload = async () => {
    if (!cinFile) {
      setMessage({
        type: "error",
        text: "Veuillez choisir une photo CIN avant de téléverser.",
      });
      return;
    }

    setUploadingCin(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("cinFile", cinFile);
      const response = await usersApi.updateCin(formData);
      const updatedProfile = response.data || {};
      syncProfile(updatedProfile);
      setCinFile(null);
      setMessage({
        type: "success",
        text: "Nouvelle photo CIN envoyée. Votre vérification repasse en attente de contrôle admin.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.detail ||
          "Impossible de téléverser la nouvelle photo CIN.",
      });
    } finally {
      setUploadingCin(false);
    }
  };

  const verificationTone = form.estVerifieCin
    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300"
    : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300";

  return (
    <DashboardLayout
      sidebarLinks={sidebarLinks}
      isDark={isDark}
      onToggleTheme={onToggleTheme}
    >
      <div className="mb-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
          compte · propriétaire
        </p>
        <h1 className="mt-1 font-geist font-bold text-2xl tracking-[-0.02em] text-zinc-950 dark:text-white">
          Mon profil
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mt-1">
          Complétez vos informations pour renforcer la confiance autour de vos
          annonces.
        </p>
      </div>

      <div className="grid xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 h-fit">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-[0_12px_32px_-8px_rgba(37,99,235,0.6)]">
              {(form.prenom || form.nom || user?.nom || "P")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-geist font-bold tracking-[-0.01em] text-zinc-950 dark:text-white truncate">
                {[form.prenom, form.nom].filter(Boolean).join(" ") ||
                  "Propriétaire"}
              </h2>
              <p className="font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {form.email}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                profil complété
              </span>
              <span className="font-mono text-sm font-bold tabular-nums text-blue-600 dark:text-blue-400">
                {completion}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-600 transition-all dark:bg-blue-500"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
              Nom, téléphone et CIN rendent le profil exploitable pour la
              validation et le support.
            </p>
          </div>

          <div className={`mt-4 rounded-2xl border p-4 ${verificationTone}`}>
            <div className="flex items-start gap-3">
              {form.estVerifieCin ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              ) : (
                <Shield className="w-5 h-5 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="text-sm font-semibold">
                  {form.estVerifieCin ? "CIN vérifiée" : "CIN en vérification"}
                </p>
                <p className="text-xs mt-1 opacity-90">
                  {form.numeroCin
                    ? `Référence : ${form.numeroCin}`
                    : "Aucune référence CIN trouvée sur votre profil."}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {loading ? (
            <div className="h-72 flex items-center justify-center font-mono text-sm text-zinc-500 dark:text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              chargement du profil…
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800">
                <div>
                  <h3 className="font-geist font-semibold text-lg tracking-[-0.01em] text-zinc-950 dark:text-white">
                    Informations propriétaire
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                    Les informations sensibles restent verrouillées après
                    inscription.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
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
                  <label className={labelClass}>Prénom</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={set("prenom")}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Nom</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={set("nom")}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Adresse e-mail</label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className={`${inputClass} opacity-70 cursor-not-allowed`}
                  />
                </div>
                <div>
                  <label className={labelClass}>Téléphone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={set("telephone")}
                      placeholder="+212 6..."
                      className={`${inputClass} pl-10`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 p-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-2">
                    <FileCheck2 className="w-4 h-4" />
                    numéro cin
                  </div>
                  <p className="font-mono font-semibold tabular-nums text-zinc-950 dark:text-white">
                    {form.numeroCin || "Non renseigné"}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 p-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-2">
                    <Shield className="w-4 h-4" />
                    statut cin
                  </div>
                  <p
                    className={`font-semibold ${form.estVerifieCin ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}
                  >
                    {form.estVerifieCin ? "Validée" : "En attente"}
                  </p>
                </div>
                <div className="rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/60 p-4">
                  <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400 mb-2">
                    <Star className="w-4 h-4" />
                    réputation
                  </div>
                  <p className="font-mono font-semibold tabular-nums text-zinc-950 dark:text-white">
                    {form.noteMoyenne ?? "-"} / 5
                    <span className="ml-2 text-xs font-normal text-zinc-400">
                      ({form.nbAvisTotal} avis)
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-zinc-900 dark:text-amber-300">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-geist font-semibold tracking-[-0.01em] text-zinc-950 dark:text-white">
                        Nouvelle photo CIN
                      </h4>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-300">
                        Si l'admin vous demande une photo plus claire,
                        choisissez une image nette, complète et sans reflet.
                        L'envoi remettra automatiquement votre CIN en attente de
                        vérification.
                      </p>
                      {form.photoCinUrl && (
                        <a
                          href={form.photoCinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                        >
                          Voir la photo CIN actuelle
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="w-full space-y-3 lg:w-80">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-white/80 px-4 py-4 text-center transition hover:bg-white dark:border-amber-500/40 dark:bg-zinc-900/60 dark:hover:bg-zinc-900">
                      <UploadCloud className="mb-2 h-5 w-5 text-amber-600 dark:text-amber-300" />
                      <span className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                        {cinFile ? cinFile.name : "Choisir une photo"}
                      </span>
                      <span className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
                        png · jpg · jpeg
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        className="hidden"
                        onChange={(event) => {
                          setCinFile(event.target.files?.[0] || null);
                          setMessage(null);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={handleCinUpload}
                      disabled={uploadingCin || !cinFile}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingCin ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      Téléverser la nouvelle photo
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
