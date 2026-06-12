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
} from "lucide-react";
import { authApi } from "../../api/authApi";
import { API_BASE_URL } from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import signupIllustration from "../../assets/auth/signup-amico.svg";

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
      setSubmitError("Veuillez selectionner un role pour continuer.");
      return;
    }

    if (values.role === ROLE_PROPRIETAIRE && !cinFile) {
      setCinFileError("La photo de votre CIN est requise.");
      return;
    }

    if (values.role === ROLE_PROPRIETAIRE && !values.telephone?.trim()) {
      setSubmitError(
        "Le numero de telephone est requis pour les proprietaires.",
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
          `${API_BASE_URL}/api/auth/confirm?token=${encodeURIComponent(token)}`,
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
          "Impossible de creer le compte. Verifiez vos informations et reessayez.",
      );
    }
  };

  const handleResend = async () => {
    if (!successEmail) return;
    setResendStatus("");
    try {
      await authApi.resendConfirmation(successEmail);
      setResendStatus("Email de confirmation renvoye.");
    } catch (error) {
      setResendStatus("Echec de renvoi. Reessayez plus tard.");
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1242] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-7xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex items-center justify-center">
          <img
            src={signupIllustration}
            alt="Création d'un compte UniHome"
            className="w-full max-w-[520px]"
          />
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-3xl rounded-[2rem] border border-white/40 bg-white/10 p-5 backdrop-blur-md sm:p-8">
            {successEmail ? (
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-emerald-400" />
                </div>
                <h1 className="font-display font-bold text-2xl text-white mb-2">
                  Compte cree ! Verifiez votre email.
                </h1>
                <p className="text-white/60 text-sm mb-6">
                  Un lien de confirmation a ete envoye a{" "}
                  <span className="text-white font-semibold">
                    {successEmail}
                  </span>
                  .
                </p>
                <button
                  type="button"
                  onClick={handleResend}
                  className="text-indigo-300 hover:text-indigo-200 text-sm font-semibold"
                >
                  Pas recu ? Renvoyer l'email
                </button>
                {confirmationUrl && (
                  <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-left">
                    <p className="text-amber-100 text-sm font-semibold">
                      Mode local Docker : SMTP n'est pas configure.
                    </p>
                    <p className="text-white/60 text-xs mt-1">
                      Cliquez ici pour confirmer ce compte pendant le
                      developpement.
                    </p>
                    <a
                      href={confirmationUrl}
                      className="mt-3 inline-flex text-amber-200 hover:text-amber-100 text-sm font-semibold underline"
                    >
                      Confirmer mon compte localement
                    </a>
                  </div>
                )}
                {resendStatus && (
                  <p className="text-white/50 text-xs mt-3">{resendStatus}</p>
                )}
                <div className="mt-6">
                  <Link to="/login" className="btn-primary inline-flex">
                    Se connecter
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <div className="text-center">
                  <h1 className="font-display font-bold text-3xl text-white mb-2">
                    Creez votre compte
                  </h1>
                  <p className="text-white/60">
                    Choisissez un role pour afficher le formulaire.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <button
                    type="button"
                    onClick={() => handleRoleSelect(ROLE_ETUDIANT)}
                    className={`glass border rounded-2xl p-6 text-left transition-all transform will-change-auto hover:scale-[1.02] ${
                      role === ROLE_ETUDIANT
                        ? "border-cyan-400/70 shadow-[0_0_30px_rgba(34,211,238,0.18)] scale-105 ring-2 ring-cyan-400/30"
                        : "border-white/15 opacity-90 hover:opacity-100"
                    } relative`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-4">
                      <GraduationCap className="w-6 h-6 text-cyan-300" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">
                      Je suis etudiant
                    </h2>
                    <p className="text-white/60 text-sm">
                      Je cherche un logement.
                    </p>
                    {role === ROLE_ETUDIANT && (
                      <span className="absolute -top-2 -right-2 bg-emerald-500/20 text-emerald-400 rounded-full p-2">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRoleSelect(ROLE_PROPRIETAIRE)}
                    className={`glass border rounded-2xl p-6 text-left transition-all transform will-change-auto hover:scale-[1.02] ${
                      role === ROLE_PROPRIETAIRE
                        ? "border-cyan-400/70 shadow-[0_0_30px_rgba(34,211,238,0.18)] scale-105 ring-2 ring-cyan-400/30"
                        : "border-white/15 opacity-90 hover:opacity-100"
                    } relative`}
                  >
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-cyan-300" />
                    </div>
                    <h2 className="font-display font-bold text-lg text-white">
                      Je suis proprietaire
                    </h2>
                    <p className="text-white/60 text-sm">
                      Je propose un logement.
                    </p>
                    {role === ROLE_PROPRIETAIRE && (
                      <span className="absolute -top-2 -right-2 bg-emerald-500/20 text-emerald-400 rounded-full p-2">
                        <Check className="w-4 h-4" />
                      </span>
                    )}
                  </button>
                </div>

                <div
                  className={`transition-all duration-500 ${role ? "opacity-100 max-h-[2000px]" : "opacity-0 max-h-0 overflow-hidden"}`}
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        placeholder="Prenom"
                        className="input-field"
                        {...register("prenom", { required: "Prenom requis" })}
                      />
                      {errors.prenom && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.prenom.message}
                        </p>
                      )}
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Nom"
                        className="input-field"
                        {...register("nom", { required: "Nom requis" })}
                      />
                      {errors.nom && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.nom.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <input
                      type="email"
                      placeholder="Email"
                      className="input-field"
                      {...register("email", {
                        required: "Email requis",
                        pattern: {
                          value: /\S+@\S+\.\S+/,
                          message: "Email invalide",
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="mt-4">
                    <input
                      type="tel"
                      placeholder={
                        role === ROLE_PROPRIETAIRE
                          ? "Numero de telephone"
                          : "Numero de telephone (optionnel)"
                      }
                      className="input-field"
                      {...register("telephone", {
                        validate: (value) =>
                          role !== ROLE_PROPRIETAIRE ||
                          Boolean(value?.trim()) ||
                          "Telephone requis",
                      })}
                    />
                    {errors.telephone && (
                      <p className="text-red-400 text-xs mt-1">
                        {errors.telephone.message}
                      </p>
                    )}
                  </div>

                  <div className="mt-4 grid md:grid-cols-2 gap-4">
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Mot de passe (min. 8 caractères)"
                        className="input-field pr-12"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {errors.motDePasse && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.motDePasse.message}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showConfirm ? "text" : "password"}
                        placeholder="Confirmer le mot de passe"
                        className="input-field pr-12"
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
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
                      >
                        {showConfirm ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      {errors.confirmMotDePasse && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.confirmMotDePasse.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {role === ROLE_PROPRIETAIRE && (
                    <div className="mt-6 space-y-4">
                      <input
                        type="text"
                        placeholder="Numero CIN"
                        className="input-field"
                        {...register("numeroCin", {
                          required: "Numero CIN requis",
                        })}
                      />
                      {errors.numeroCin && (
                        <p className="text-red-400 text-xs mt-1">
                          {errors.numeroCin.message}
                        </p>
                      )}

                      <div
                        className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${dragging ? "border-cyan-400 bg-cyan-500/10" : "border-white/20 hover:border-white/40"}`}
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
                        <div className="flex justify-center gap-3 mb-3">
                          <Upload className="w-8 h-8 text-cyan-300" />
                        </div>
                        <p className="text-white/60 text-sm mb-3">
                          Glissez votre photo CIN ici ou
                        </p>
                        <label className="cursor-pointer text-cyan-300 hover:text-cyan-200 text-sm font-medium">
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
                        <p className="text-white/30 text-xs mt-2">
                          Votre CIN sera verifiee sous 24h par notre equipe.
                        </p>
                      </div>
                      {cinFileError && (
                        <p className="text-red-400 text-xs mt-1">
                          {cinFileError}
                        </p>
                      )}

                      {cinPreview && (
                        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                          <img
                            src={cinPreview}
                            alt="Apercu CIN"
                            className="h-20 w-28 object-cover rounded-xl"
                          />
                          <div className="flex-1 text-white/70 text-sm">
                            <p className="font-semibold">Fichier chargé</p>
                            <p className="text-xs text-white/40 truncate max-w-[260px]">
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
                              className="text-sm text-indigo-300 hover:text-indigo-200 font-medium"
                            >
                              Supprimer
                            </button>
                            <span className="text-emerald-400 text-xs">✓</span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-start gap-3 bg-white/5 border border-white/10 rounded-xl p-3">
                        <Shield className="w-4 h-4 text-cyan-300 flex-shrink-0 mt-0.5" />
                        <p className="text-white/60 text-xs">
                          3 signalements confirmes declenchent une suspension
                          automatique.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {submitError && (
                  <p className="text-red-400 text-sm text-center">
                    {submitError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full justify-center"
                >
                  {isSubmitting ? "Creation du compte..." : "Creer mon compte"}
                </button>

                <p className="text-center text-white/50 text-sm">
                  Deja inscrit ?{" "}
                  <Link
                    to="/login"
                    className="text-indigo-300 hover:text-indigo-200 font-semibold"
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
