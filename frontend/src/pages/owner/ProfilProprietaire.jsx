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
      setMessage({ type: "success", text: "Profil sauvegarde avec succes." });
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
        text: "Veuillez choisir une photo CIN avant de televerser.",
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
        text: "Nouvelle photo CIN envoyee. Votre verification repasse en attente de controle admin.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error?.response?.data?.detail ||
          "Impossible de televerser la nouvelle photo CIN.",
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
        <h1 className="font-display font-bold text-2xl text-gray-900 dark:text-white">
          Mon profil
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Completez vos informations pour renforcer la confiance autour de vos
          annonces.
        </p>
      </div>

      <div className="grid xl:grid-cols-[320px_minmax(0,1fr)] gap-6">
        <aside className="glass-light rounded-2xl p-6 h-fit">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-purple-500/20">
              {(form.prenom || form.nom || user?.nom || "P")[0]?.toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-bold text-gray-900 dark:text-white truncate">
                {[form.prenom, form.nom].filter(Boolean).join(" ") ||
                  "Proprietaire"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {form.email}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-100 dark:border-white/10 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                Profil complete
              </span>
              <span className="text-sm font-bold text-primary-600 dark:text-primary-300">
                {completion}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
                style={{ width: `${completion}%` }}
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Nom, telephone et CIN rendent le profil exploitable pour la
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
                  {form.estVerifieCin ? "CIN verifiee" : "CIN en verification"}
                </p>
                <p className="text-xs mt-1 opacity-90">
                  {form.numeroCin
                    ? `Reference: ${form.numeroCin}`
                    : "Aucune reference CIN trouvee sur votre profil."}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="glass-light rounded-2xl p-6">
          {loading ? (
            <div className="h-72 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Chargement du profil...
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex items-start justify-between gap-4 pb-5 border-b border-gray-100 dark:border-white/10">
                <div>
                  <h3 className="font-display font-semibold text-lg text-gray-900 dark:text-white">
                    Informations proprietaire
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Les informations sensibles restent verrouillees apres
                    inscription.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 shrink-0 disabled:opacity-60"
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
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Prenom
                  </label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={set("prenom")}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={set("nom")}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    disabled
                    className="input-field opacity-70 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                    Telephone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={set("telephone")}
                      placeholder="+212 6..."
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">
                    <FileCheck2 className="w-4 h-4" />
                    Numero CIN
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {form.numeroCin || "Non renseigne"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">
                    <Shield className="w-4 h-4" />
                    Statut CIN
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {form.estVerifieCin ? "Validee" : "En attente"}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 dark:border-white/10 bg-white/70 dark:bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs font-medium mb-2">
                    <Star className="w-4 h-4" />
                    Reputation
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {form.noteMoyenne ?? "-"} / 5
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({form.nbAvisTotal} avis)
                    </span>
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm dark:bg-white/10 dark:text-amber-300">
                      <UploadCloud className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-gray-900 dark:text-white">
                        Nouvelle photo CIN
                      </h4>
                      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                        Si l'admin vous demande une photo plus claire,
                        choisissez une image nette, complete et sans reflet.
                        L'envoi remettra automatiquement votre CIN en attente de
                        verification.
                      </p>
                      {form.photoCinUrl && (
                        <a
                          href={form.photoCinUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 inline-flex text-xs font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-300"
                        >
                          Voir la photo CIN actuelle
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="w-full space-y-3 lg:w-80">
                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300 bg-white/80 px-4 py-4 text-center transition hover:bg-white dark:border-amber-500/40 dark:bg-white/5 dark:hover:bg-white/10">
                      <UploadCloud className="mb-2 h-5 w-5 text-amber-600 dark:text-amber-300" />
                      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                        {cinFile ? cinFile.name : "Choisir une photo"}
                      </span>
                      <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        PNG, JPG ou JPEG
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
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {uploadingCin ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="h-4 w-4" />
                      )}
                      Televerser la nouvelle photo
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
