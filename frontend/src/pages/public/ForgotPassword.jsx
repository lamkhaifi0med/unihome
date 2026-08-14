import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, CheckCircle2 } from "lucide-react";
import Logo from "../../components/ui/Logo";
import { authApi } from "../../api/authApi";

const FIELD =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-500";
const BTN =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email) {
      setError("Veuillez entrer votre adresse e-mail.");
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
    <div className="relative flex min-h-screen items-center justify-center bg-[#fafafa] p-4 dark:bg-zinc-950">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 [background-image:radial-gradient(rgba(113,113,122,0.14)_1px,transparent_1px)] [background-size:22px_22px] dark:[background-image:radial-gradient(rgba(161,161,170,0.09)_1px,transparent_1px)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[560px] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl"
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-8 text-center">
            <div className="mb-4 flex justify-center">
              <Logo size="lg" />
            </div>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
              réinitialisation du mot de passe
            </p>
          </div>

          {sent ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
              <h2 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-white">
                E-mail envoyé
              </h2>
              <p className="text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Si un compte existe pour{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {email}
                </span>
                , vous recevrez un lien de réinitialisation dans quelques
                minutes.
              </p>
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500">
                pensez à vérifier votre dossier spam
              </p>
              <Link to="/login" className={`${BTN} mt-4`}>
                Retour à la connexion
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-6 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                Entrez l'adresse e-mail associée à votre compte. Nous vous
                enverrons un lien pour réinitialiser votre mot de passe.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="Votre adresse e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`${FIELD} pl-11`}
                    autoFocus
                  />
                </div>

                {error && (
                  <p className="text-center text-sm text-red-600 dark:text-red-400">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} className={BTN}>
                  {loading ? "Envoi en cours..." : "Envoyer le lien"}
                </button>
              </form>
            </>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
