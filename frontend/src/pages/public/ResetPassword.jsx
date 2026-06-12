import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";
import Logo from "../../components/ui/Logo";
import { authApi } from "../../api/authApi";

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
      <div className="min-h-screen relative flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
        <div className="relative z-10 w-full max-w-md">
          <div className="glass rounded-3xl p-8 border border-white/15 shadow-2xl text-center space-y-4">
            <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
            <h2 className="text-white font-semibold text-lg">Lien invalide</h2>
            <p className="text-white/60 text-sm">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Link
              to="/forgot-password"
              className="btn-primary w-full justify-center inline-flex"
            >
              Demander un nouveau lien
            </Link>
          </div>
        </div>
      </div>
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
              Choisissez un nouveau mot de passe
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle2 className="w-14 h-14 text-emerald-400" />
              </div>
              <h2 className="text-white font-semibold text-lg">
                Mot de passe mis à jour !
              </h2>
              <p className="text-white/60 text-sm">
                Votre mot de passe a été réinitialisé avec succès.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="btn-primary w-full justify-center mt-4"
              >
                Se connecter
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Nouveau mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-11 pr-12"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPass ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/40" />
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input-field pl-11 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              {error && (
                <div className="text-center space-y-1">
                  <p className="text-red-400 text-sm">{error}</p>
                  {error.includes("expiré") && (
                    <Link
                      to="/forgot-password"
                      className="text-indigo-400 hover:text-indigo-300 text-sm underline"
                    >
                      Demander un nouveau lien
                    </Link>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center mt-2"
              >
                {loading ? "Mise à jour..." : "Réinitialiser le mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
