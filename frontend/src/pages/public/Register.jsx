import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  GraduationCap,
  Building2,
  Eye,
  EyeOff,
  Upload,
  Check,
  Shield,
  Home,
} from "lucide-react";
import { authApi } from "../../api/authApi";
import { useAuth } from "../../hooks/useAuth";
import { JoinUs, SceneStyles } from "./homeScenes";

const FIELD =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500";

const ROLE_ETUDIANT = "ETUDIANT";
const ROLE_PROPRIETAIRE = "PROPRIETAIRE";

export default function Register() {
  const navigate = useNavigate();
  const { user } = useAuth() || {};
  const [searchParams] = useSearchParams();
  const [submitError, setSubmitError] = useState("");
  const [successEmail, setSuccessEmail] = useState("");
  const [confirmationUrl, setConfirmationUrl] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cinFile, setCinFile] = useState(null);
  const [cinPreview, setCinPreview] = useState("");
  const [cinFileError, setCinFileError] = useState("");
  const [dragging, setDragging] = useState(false);

  const initialRole = useMemo(() => {
    const role = searchParams.get("role");
    if (role === ROLE_ETUDIANT || role === ROLE_PROPRIETAIRE) return role;
    return "";
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      role: initialRole,
      prenom: "",
      nom: "",
      email: "",
      motDePasse: "",
      confirmMotDePasse: "",
      telephone: "",
      numeroCin: "",
    },
  });

  const role = watch("role");
  const passwordValue = watch("motDePasse");

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  useEffect(() => {
    if (!cinFile) {
      setCinPreview("");
      return;
    }
    const nextPreview = URL.createObjectURL(cinFile);
    setCinPreview(nextPreview);
    return () => URL.revokeObjectURL(nextPreview);
  }, [cinFile]);

  useEffect(() => {
    if (initialRole) setValue("role", initialRole);
  }, [initialRole, setValue]);

  const handleRoleSelect = (nextRole) => {
    setValue("role", nextRole);
    setSubmitError("");
  };

  const handleCinFile = (file) => {
    setCinFile(file);
    setCinFileError("");
  };

  const onSubmit = async (values) => {
    setSubmitError("");
    setResendStatus("");
    setConfirmationUrl("");

    if (!values.role) {
      setSubmitError("Veuillez sélectionner un rôle pour continuer.");
      return;
    }

    if (values.role === ROLE_PROPRIETAIRE && !cinFile) {
      setCinFileError("La photo de votre CIN est requise.");
      return;
    }

    if (values.role === ROLE_PROPRIETAIRE && !values.telephone?.trim()) {
      setSubmitError(
        "Le numéro de téléphone est obligatoire pour les propriétaires.",
      );
      return;
    }

    const payload = {
      nom: values.nom.trim(),
      prenom: values.prenom.trim(),
      email: values.email.trim(),
      motDePasse: values.motDePasse,
      role: values.role,
      telephone: values.telephone?.trim() || undefined,
      numeroCin: values.numeroCin?.trim() || undefined,
    };

    try {
      let response;
      if (values.role === ROLE_PROPRIETAIRE) {
        response = await authApi.registerOwner(payload, cinFile);
      } else {
        response = await authApi.registerStudent(payload);
      }
      const token = response?.data?.confirmationToken;
      if (token) {
        setConfirmationUrl(
          `${window.location.origin}/confirm-email?token=${encodeURIComponent(token)}`,
        );
      }
      setSuccessEmail(values.email);
    } catch (error) {
      // Log full error for debugging
      // eslint-disable-next-line no-console
      console.error("Register error:", error);
      // Try to extract a meaningful message from the response
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.detail ||
        error?.response?.data?.error ||
        null;
      setSubmitError(
        serverMsg ||
          "Impossible de créer le compte. Vérifiez vos informations et réessayez.",
      );
    }
  };

  const handleResend = async () => {
    if (!successEmail) return;
    setResendStatus("");
    try {
      await authApi.resendConfirmation(successEmail);
      setResendStatus("E-mail de confirmation renvoyé.");
    } catch (error) {
      setResendStatus(
        "Impossible de renvoyer l'e-mail. Veuillez réessayer plus tard.",
      );
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fafafa] px-4 py-8 font-geist text-zinc-950 sm:px-6 lg:px-10 dark:bg-zinc-950 dark:text-zinc-50">
      <SceneStyles />
      <div className="uh-dotgrid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-10rem] h-[22rem] w-[38rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl dark:bg-blue-500/10" />

      <Link
        to="/"
        className="relative inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
      >
        <Home className="h-4 w-4" />
        UniHome
      </Link>

      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="hidden flex-col items-center justify-center lg:flex">
          <JoinUs className="w-full max-w-[460px]" />
          <p className="mt-6 max-w-sm text-center text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Étudiant ou propriétaire, ton compte est prêt en deux minutes — et
            chaque profil passe par la même vérification.
          </p>
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.15)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
            {successEmail ? (
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h1 className="mb-2 text-2xl font-bold tracking-[-0.02em]">
                  Compte créé ! Vérifiez votre adresse e-mail.
                </h1>
                <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
                  Un lien de confirmation a été envoyé à{" "}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {successEmail}
                  </span>
                  .
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
                >
                  Pas reçu ? Renvoyer l'e-mail
                </button>
                {confirmationUrl && (
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left dark:border-amber-500/30 dark:bg-amber-500/10">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                      Mode local Docker : SMTP n'est pas configuré.
                    </p>
                    <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-300/70">
                      Cliquez ici pour confirmer ce compte pendant le
                      développement.
                    </p>
                    <a
                      href={confirmationUrl}
                      className="mt-3 inline-flex text-sm font-semibold text-amber-800 underline underline-offset-4 hover:text-amber-900 dark:text-amber-200"
                    >
                      Confirmer mon compte localement
                    </a>
                  </div>
                )}
                {resendStatus && (
                  <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                    {resendStatus}
                  </p>
                )}
                <div className="mt-6">
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700"
                  >
                    Se connecter
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="text-center">
                  <h1 className="mb-2 text-3xl font-bold tracking-[-0.02em]">
                    Créez votre compte
                  </h1>
                  <p className="text-[15px] text-zinc-500 dark:text-zinc-400">
                    Choisissez un rôle pour afficher le formulaire.
                  </p>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect(ROLE_ETUDIANT)}
                    className={`relative rounded-2xl border bg-white p-6 text-left transition-all hover:-translate-y-0.5 dark:bg-zinc-900 ${
                      role === ROLE_ETUDIANT
                        ? "border-blue-500 shadow-[0_16px_40px_-20px_rgba(37,99,235,0.45)] ring-4 ring-blue-500/10"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                      <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-lg font-bold tracking-[-0.01em]">
                      Je suis un étudiant
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Je cherche un logement.
                    </p>
                    {role === ROLE_ETUDIANT && (
                      <span className="absolute -right-2 -top-2 rounded-full bg-blue-600 p-2 text-white shadow-md">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect(ROLE_PROPRIETAIRE)}
                    className={`relative rounded-2xl border bg-white p-6 text-left transition-all hover:-translate-y-0.5 dark:bg-zinc-900 ${
                      role === ROLE_PROPRIETAIRE
                        ? "border-blue-500 shadow-[0_16px_40px_-20px_rgba(37,99,235,0.45)] ring-4 ring-blue-500/10"
                        : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                      <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h2 className="text-lg font-bold tracking-[-0.01em]">
                      Je suis un propriétaire
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      Je propose un logement.
                    </p>
                    {role === ROLE_PROPRIETAIRE && (
                      <span className="absolute -right-2 -top-2 rounded-full bg-blue-600 p-2 text-white shadow-md">
                        <Check className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                </div>

                <div
                  className={`transition-all duration-500 ${role ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0 overflow-hidden"}`}
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <input
                        type="text"
                        placeholder="Prénom"
                        className={FIELD}
                        {...register("prenom", { required: "Prénom requis" })}
                      />
                      {errors.prenom && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.prenom.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nom"
                        className={FIELD}
                        {...register("nom", { required: "Nom requis" })}
                      />
                      {errors.nom && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.nom.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <input
                      type="email"
                      placeholder="Adresse e-mail"
                      className={FIELD}
                      {...register("email", {
                        required: "Adresse e-mail requise",
                        pattern: {
                          value: /\S+@\S+\.\S+/,
                          message: "Adresse e-mail invalide",
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <input
                      type="tel"
                      placeholder={
                        role === ROLE_PROPRIETAIRE
                          ? "Numéro de téléphone"
                          : "Numéro de téléphone (optionnel)"
                      }
                      className={FIELD}
                      {...register("telephone", {
                        validate: (value) =>
                          role !== ROLE_PROPRIETAIRE ||
                          Boolean(value?.trim()) ||
                          "Téléphone requis",
                      })}
                    />
                    {errors.telephone && (
                      <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                        {errors.telephone.message}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe (min. 8 caractères)"
                        className={`${FIELD} pr-12`}
                        {...register("motDePasse", {
                          required: "Mot de passe requis",
                          minLength: {
                            value: 8,
                            message: "Au moins 8 caractères",
                          },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 top-[22px] -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                        aria-label="Afficher / masquer le mot de passe"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      {errors.motDePasse && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.motDePasse.message}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirmer le mot de passe"
                        className={`${FIELD} pr-12`}
                        {...register("confirmMotDePasse", {
                          required: "Confirmation requise",
                          validate: (value) =>
                            value === passwordValue ||
                            "Les mots de passe ne correspondent pas",
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((prev) => !prev)}
                        className="absolute right-3 top-[22px] -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                        aria-label="Afficher / masquer la confirmation"
                      >
                        {showConfirm ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                      {errors.confirmMotDePasse && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.confirmMotDePasse.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {role === ROLE_PROPRIETAIRE && (
                    <div className="mt-6 space-y-4">
                      <input
                        type="text"
                        placeholder="Numéro CIN"
                        className={FIELD}
                        {...register("numeroCin", {
                          required: "Numéro CIN requis",
                        })}
                      />
                      {errors.numeroCin && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {errors.numeroCin.message}
                        </p>
                      )}

                      <div
                        className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${dragging ? "border-blue-500 bg-blue-50 dark:bg-blue-500/10" : "border-zinc-300 hover:border-zinc-400 dark:border-zinc-600 dark:hover:border-zinc-500"}`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragging(false);
                          const file = e.dataTransfer.files?.[0];
                          if (file) handleCinFile(file);
                        }}
                      >
                        <div className="mb-3 flex justify-center gap-3">
                          <Upload className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
                          Glissez votre photo CIN ici ou
                        </p>
                        <label className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400">
                          <span>Parcourir les fichiers</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleCinFile(file);
                            }}
                          />
                        </label>
                        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">
                          Votre CIN sera vérifiée sous 24 h par notre équipe.
                        </p>
                      </div>
                      {cinFileError && (
                        <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                          {cinFileError}
                        </p>
                      )}

                      {cinPreview && (
                        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                          <img
                            src={cinPreview}
                            alt="Aperçu CIN"
                            className="h-20 w-28 rounded-xl object-cover"
                          />
                          <div className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">
                            <p className="font-semibold">Fichier chargé</p>
                            <p className="max-w-[260px] truncate text-xs text-zinc-400 dark:text-zinc-500">
                              {cinFile?.name}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCinFile(null);
                                setCinPreview("");
                              }}
                              className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              Supprimer
                            </button>
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
                        <Shield className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          3 signalements confirmés déclenchent une suspension
                          automatique.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {submitError && (
                  <p className="text-center text-sm text-red-600 dark:text-red-400">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {isSubmitting ? "Création du compte..." : "Créer mon compte"}
                </button>

                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Déjà inscrit ?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    Se connecter
                  </Link>
                </p>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
