import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Logo from "../../components/ui/Logo";
import { authApi } from "../../api/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Veuillez entrer votre adresse email.");
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      const msg = err?.response?.data?.message;
      setError(msg || "Une erreur est survenue. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
      <div className="orb orb-purple w-96 h-96 top-10 left-10 opacity-20" />
      <div className="orb orb-blue w-80 h-80 bottom-10 right-20 opacity-20" />

      <div className="relative z-10 w-full max-w-md">
        <div className="glass rounded-3xl p-8 border border-white/15 shadow-2xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Logo size="lg" />
            </div>
            <p className="text-white/60 text-sm">
              Réinitialisation du mot de passe
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">
                Email envoyé !
              </h2>
              <p className="text-white/60 text-sm leading-relaxed">
                Si un compte existe pour{" "}
                <span className="text-white/80 font-medium">{email}</span>, vous
                recevrez un lien de réinitialisation dans quelques minutes.
              </p>
              <p className="text-white/40 text-xs">
                Pensez à vérifier vos spams.
              </p>
              <Link
                to="/login"
                className="btn-primary w-full justify-center mt-4 inline-flex"
              >
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <p className="text-white/60 text-sm mb-6 leading-relaxed">
                Entrez l'adresse email associée à votre compte. Nous vous
                enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                  <input
                    type="email"
                    placeholder="Votre adresse email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-11"
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center mt-2"
                >
                  {loading ? "Envoi en cours..." : "Envoyer le lien"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
