import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { authApi } from "../../api/authApi";
import { usersApi } from "../../api/usersApi";
import { setAxiosToken } from "../../api/axios";
import loginIllustration from "../../assets/auth/login-amico.svg";

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
      if (err.response?.status === 401) {
        setError("Email ou mot de passe incorrect");
      } else if (serverMessage.toLowerCase().includes("confirm")) {
        setError("Votre email n'est pas confirmé.");
      } else if (err.response?.status === 403) {
        setError(
          serverMessage ||
            "Acces refuse. Verifiez que votre compte est confirme.",
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

  const handleResend = async () => {
    if (!email) {
      setResendStatus("Entrez votre email puis reessayez.");
      return;
    }

    setResendStatus("");
    try {
      await authApi.resendConfirmation(email);
      setResendStatus("Lien de confirmation renvoye si le compte existe.");
    } catch (err) {
      setResendStatus(
        err.response?.data?.message || "Impossible de renvoyer le lien.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-[#1c1242] px-4 py-8 text-white sm:px-6 lg:px-10">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center gap-10 lg:grid-cols-2">
        <section className="flex items-center justify-center">
          <img
            src={loginIllustration}
            alt="Connexion à l'espace UniHome"
            className="w-full max-w-[460px]"
          />
        </section>

        <section className="flex items-center justify-center">
          <div className="w-full max-w-md rounded-[2rem] border border-white/40 bg-white/10 p-6 backdrop-blur-md sm:p-8">
            <div className="mb-8 text-center lg:text-left">
              <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
                Connexion
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-11"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-white/40 dark:hover:text-white/70 transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {error && (
                <div className="text-center">
                  <p className="text-red-400 text-sm">{error}</p>
                  {error.includes("confirm") && (
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-primary-500 hover:text-primary-400 text-sm mt-1 transition-colors underline"
                    >
                      Renvoyer un lien
                    </button>
                  )}
                  {resendStatus && (
                    <p className="text-white/50 text-xs mt-2">{resendStatus}</p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-6"
              >
                {loading ? "Connexion en cours..." : "Se connecter"}
              </button>
            </form>

            <div className="mt-6 text-center space-y-3">
              <Link
                to="/forgot-password"
                className="text-white/50 hover:text-white/80 text-sm transition-colors block"
              >
                Mot de passe oublié ?
              </Link>
              <p className="text-white/50 text-sm">
                Pas encore de compte ?{" "}
                <Link
                  to="/register"
                  className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                >
                  S'inscrire
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
