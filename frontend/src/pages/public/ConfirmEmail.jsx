import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Mail,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import Logo from "../../components/ui/Logo";
import { authApi } from "../../api/authApi";

const getServerMessage = (error) => {
  const data = error?.response?.data;
  if (typeof data === "string") return data;
  return data?.message || data?.detail || data?.error || "";
};

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const confirmedTokenRef = useRef("");
  const [status, setStatus] = useState(token ? "loading" : "info");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("info");
      setMessage("");
      return;
    }

    if (confirmedTokenRef.current === token) return;
    confirmedTokenRef.current = token;
    setStatus("loading");
    setMessage("");

    authApi
      .confirmEmail(token)
      .then((response) => {
        const responseMessage = String(response?.data || "");
        if (responseMessage.toLowerCase().includes("deja")) {
          setStatus("already");
          setMessage(
            "Votre adresse e-mail est déjà activée. Vous pouvez vous connecter à UniHome.",
          );
          return;
        }
        setStatus("success");
        setMessage(
          "Votre adresse e-mail a été confirmée avec succès. Bienvenue sur UniHome.",
        );
      })
      .catch((error) => {
        const serverMessage = getServerMessage(error).toLowerCase();
        setStatus("error");
        if (serverMessage.includes("expire")) {
          setMessage(
            "Ce lien de confirmation a expiré. Demandez un nouveau lien depuis la page de connexion.",
          );
        } else {
          setMessage(
            "Ce lien de confirmation est invalide ou a déjà été utilisé. Demandez un nouveau lien depuis la page de connexion.",
          );
        }
      });
  }, [token]);

  const config = useMemo(() => {
    if (status === "loading") {
      return {
        Icon: Loader2,
        iconClass: "text-indigo-300 animate-spin",
        ringClass: "bg-indigo-500/20 border-indigo-500/30",
        title: "Confirmation en cours...",
        description:
          "Nous activons votre compte UniHome. Cela ne prendra que quelques secondes.",
      };
    }
    if (status === "success") {
      return {
        Icon: CheckCircle2,
        iconClass: "text-emerald-400",
        ringClass: "bg-emerald-500/20 border-emerald-500/30",
        title: "E-mail confirmé",
        description: message,
      };
    }
    if (status === "already") {
      return {
        Icon: CheckCircle2,
        iconClass: "text-amber-300",
        ringClass: "bg-amber-500/20 border-amber-500/30",
        title: "E-mail déjà confirmé",
        description: message,
      };
    }
    if (status === "error") {
      return {
        Icon: AlertCircle,
        iconClass: "text-rose-400",
        ringClass: "bg-rose-500/20 border-rose-500/30",
        title: "Lien invalide",
        description: message,
      };
    }
    return {
      Icon: Mail,
      iconClass: "text-emerald-400",
      ringClass: "bg-emerald-500/20 border-emerald-500/30",
      title: "Vérifiez votre adresse e-mail",
      description:
        "Un lien de confirmation a été envoyé à votre adresse e-mail. Cliquez sur le lien pour activer votre compte UniHome.",
    };
  }, [message, status]);

  const { Icon } = config;

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-950" />
      <div className="orb orb-purple w-80 h-80 top-20 left-20 opacity-20" />
      <div className="orb orb-blue w-64 h-64 bottom-10 right-10 opacity-20" />

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="glass border border-white/15 rounded-3xl p-10 shadow-2xl">
          <div className="dark flex justify-center mb-6">
            <Logo size="lg" />
          </div>
          <div
            className={`w-20 h-20 rounded-full border flex items-center justify-center mx-auto mb-6 ${config.ringClass}`}
          >
            <Icon className={`w-9 h-9 ${config.iconClass}`} />
          </div>
          <h1 className="font-display font-bold text-2xl text-white mb-3">
            {config.title}
          </h1>
          <p className="text-white/60 text-sm leading-relaxed mb-6">
            {config.description}
          </p>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 text-left space-y-2">
            {[
              status === "error"
                ? "Renvoyez le lien depuis la page de connexion"
                : "Votre compte sera activé après confirmation",
              "Le lien expire dans 24 h",
              "Vérifiez votre dossier spam si vous n'avez rien reçu",
            ].map((t) => (
              <div
                key={t}
                className="flex items-center gap-2 text-sm text-white/60"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />{" "}
                {t}
              </div>
            ))}
          </div>
          <Link
            to="/login"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-display font-bold hover:from-indigo-500 hover:to-purple-500 transition-all"
          >
            Aller à la connexion <ArrowRight className="w-4 h-4" />
          </Link>
          {status === "error" && (
            <Link
              to="/login"
              className="mt-4 inline-flex items-center justify-center gap-2 text-white/50 hover:text-white/80 text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" /> Renvoyer un lien depuis la
              connexion
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
