import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  CheckCircle2,
  ArrowRight,
  Home,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../api/authApi";
import { usersApi } from "../../api/usersApi";
import { setAxiosToken } from "../../api/axios";
import { WelcomeHome, SceneStyles } from "./homeScenes";

const FIELD =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[15px] text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [suspension, setSuspension] = useState(null); // { raison }
  const [appealMessage, setAppealMessage] = useState("");
  const [appealSent, setAppealSent] = useState(false);
  const [appealError, setAppealError] = useState("");
  const [appealLoading, setAppealLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResendStatus("");

    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }

    try {
      setLoading(true);

      const loginRes = await authApi.login(email, password);
      const token = loginRes.data.token;

      if (!token) {
        throw new Error("Token non reçu");
      }

      setAxiosToken(token);

      const userRes = await usersApi.getMe();
      const user = userRes.data;

      login(token, user);

      const from = location.state?.from?.pathname;
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === "ADMIN") {
        navigate("/admin");
      } else if (user.role === "PROPRIETAIRE") {
        navigate("/dashboard-proprietaire");
      } else {
        navigate("/dashboard-etudiant");
      }
    } catch (err) {
      console.error(err);
      const serverMessage = err.response?.data?.message || "";
      if (err.response?.data?.code === "ACCOUNT_SUSPENDED") {
        setSuspension({ raison: err.response.data.raison || "" });
      } else if (err.response?.status === 401) {
        setError("Adresse e-mail ou mot de passe incorrect.");
      } else if (serverMessage.toLowerCase().includes("confirm")) {
        setError("Votre adresse e-mail n'est pas confirmée.");
      } else if (err.response?.status === 403) {
        setError(
          serverMessage ||
            "Accès refusé. Vérifiez que votre compte est confirmé.",
        );
      } else {
        setError(
          serverMessage || "Une erreur est survenue lors de la connexion.",
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAppeal = async (e) => {
    e.preventDefault();
    setAppealError("");
    if (!appealMessage.trim()) {
      setAppealError("Veuillez d\u00e9crire votre situation avant d'envoyer.");
      return;
    }
    try {
      setAppealLoading(true);
      await authApi.appealSuspension(email, password, appealMessage.trim());
      setAppealSent(true);
    } catch (err) {
      setAppealError(
        err.response?.data?.message ||
          "Impossible d'envoyer votre appel. R\u00e9essayez plus tard.",
      );
    } finally {
      setAppealLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setResendStatus("Entrez votre adresse e-mail puis réessayez.");
      return;
    }

    setResendStatus("");
    try {
      await authApi.resendConfirmation(email);
      setResendStatus("Lien de confirmation renvoyé si le compte existe.");
    } catch (err) {
      setResendStatus(
        err.response?.data?.message || "Impossible de renvoyer le lien.",
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

      <div className="relative mx-auto grid min-h-[calc(100vh-6rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
        <section className="hidden flex-col items-center justify-center lg:flex">
          <WelcomeHome className="w-full max-w-[420px]" />
          <p className="mt-6 max-w-sm text-center text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
            Content de te revoir. Tes favoris, tes annonces et tes conversations
            t'attendent là où tu les as laissés.
          </p>
        </section>

        <section className="flex items-center justify-center">
          {suspension ? (
            <div className="w-full max-w-md rounded-2xl border border-red-200 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.15)] sm:p-8 dark:border-red-500/30 dark:bg-zinc-900">
              <div className="mb-6 flex flex-col items-center text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-500/10">
                  <ShieldAlert className="h-7 w-7 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                  Votre compte a été suspendu
                </h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Votre compte UniHome ({email}) a été suspendu par notre équipe
                  et vous ne pouvez plus vous connecter.
                </p>
              </div>

              <div className="mb-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                  Motif de la suspension
                </p>
                <p className="mt-1 text-sm text-zinc-800 dark:text-zinc-200">
                  {suspension.raison ||
                    "Non-respect des conditions d'utilisation de UniHome."}
                </p>
              </div>

              {appealSent ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
                    Appel envoyé
                  </p>
                  <p className="mt-1 text-xs text-emerald-800/80 dark:text-emerald-300/80">
                    Notre équipe va examiner votre demande. Vous serez notifié
                    par e-mail si votre compte est réactivé.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAppeal} className="space-y-3">
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Si vous pensez qu'il s'agit d'une erreur, vous pouvez faire
                    appel de cette décision :
                  </p>
                  <textarea
                    value={appealMessage}
                    onChange={(e) => setAppealMessage(e.target.value)}
                    maxLength={2000}
                    rows={4}
                    placeholder="Expliquez pourquoi votre compte devrait être réactivé..."
                    className={`${FIELD} resize-none`}
                  />
                  {appealError && (
                    <p className="text-center text-sm text-red-600 dark:text-red-400">
                      {appealError}
                    </p>
                  )}
                  <button
                    type="submit"
                    disabled={appealLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    {appealLoading ? "Envoi en cours..." : "Faire appel"}
                  </button>
                </form>
              )}

              <button
                type="button"
                onClick={() => {
                  setSuspension(null);
                  setAppealMessage("");
                  setAppealSent(false);
                  setAppealError("");
                  setPassword("");
                }}
                className="mt-4 block w-full text-center text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                Retour à la connexion
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.15)] sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-[-0.02em] sm:text-4xl">
                  Bon retour.
                </h1>
                <p className="mt-2 text-[15px] text-zinc-500 dark:text-zinc-400">
                  Connecte-toi pour retrouver ton espace.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="Adresse e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${FIELD} pl-11`}
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type={showPass ? "text" : "password"}
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${FIELD} pl-11 pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                    aria-label={
                      showPass
                        ? "Masquer le mot de passe"
                        : "Afficher le mot de passe"
                    }
                  >
                    {showPass ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center dark:border-red-500/30 dark:bg-red-500/10">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {error}
                    </p>
                    {error.includes("confirm") && (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="mt-1 text-sm font-medium text-blue-600 underline underline-offset-4 transition-colors hover:text-blue-700 dark:text-blue-400"
                      >
                        Renvoyer un lien
                      </button>
                    )}
                    {resendStatus && (
                      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {resendStatus}
                      </p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {loading ? "Connexion en cours..." : "Se connecter"}
                  {!loading && (
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  )}
                </button>
              </form>

              <div className="mt-6 space-y-3 text-center">
                <Link
                  to="/forgot-password"
                  className="block text-sm text-zinc-500 transition-colors hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Mot de passe oublié ?
                </Link>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  Pas encore de compte ?{" "}
                  <Link
                    to="/register"
                    className="font-semibold text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400"
                  >
                    S'inscrire
                  </Link>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
