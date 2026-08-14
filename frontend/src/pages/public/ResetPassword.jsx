import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Logo from "../../components/ui/Logo";
import { authApi } from "../../api/authApi";

const FIELD =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white dark:placeholder-zinc-500 dark:focus:border-blue-500";
const BTN =
  "inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50";

function AuthShell({ children }) {
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
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <AuthShell>
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          <h2 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-white">
            Lien invalide
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link to="/forgot-password" className={BTN}>
            Demander un nouveau lien
          </Link>
        </div>
      </AuthShell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password || !confirm) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      setLoading(true);
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      const msg = err?.response?.data?.message;
      if (
        msg?.toLowerCase().includes("expir") ||
        err?.response?.status === 400
      ) {
        setError("Ce lien a expiré. Demandez un nouveau lien.");
      } else {
        setError(msg || "Une erreur est survenue. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="mb-8 text-center">
        <div className="mb-4 flex justify-center">
          <Logo size="lg" />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
          choisissez un nouveau mot de passe
        </p>
      </div>

      {success ? (
        <div className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <h2 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-white">
            Mot de passe mis à jour
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Votre mot de passe a été réinitialisé avec succès.
          </p>
          <button onClick={() => navigate("/login")} className={`${BTN} mt-4`}>
            Se connecter
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type={showPass ? "text" : "password"}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${FIELD} pl-11 pr-12`}
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {showPass ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className={`${FIELD} pl-11 pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              {showConfirm ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>

          {error && (
            <div className="space-y-1 text-center">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              {error.includes("expiré") && (
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                >
                  Demander un nouveau lien
                </Link>
              )}
            </div>
          )}

          <button type="submit" disabled={loading} className={`${BTN} mt-2`}>
            {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
