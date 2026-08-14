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
        iconClass: "text-blue-500 animate-spin",
        ringClass:
          "border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10",
        title: "Confirmation en cours...",
        description:
          "Nous activons votre compte UniHome. Cela ne prendra que quelques secondes.",
      };
    }
    if (status === "success") {
      return {
        Icon: CheckCircle2,
        iconClass: "text-emerald-500",
        ringClass:
          "border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10",
        title: "E-mail confirmé",
        description: message,
      };
    }
    if (status === "already") {
      return {
        Icon: CheckCircle2,
        iconClass: "text-amber-500",
        ringClass:
          "border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10",
        title: "E-mail déjà confirmé",
        description: message,
      };
    }
    if (status === "error") {
      return {
        Icon: AlertCircle,
        iconClass: "text-red-500",
        ringClass:
          "border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10",
        title: "Lien invalide",
        description: message,
      };
    }
    return {
      Icon: Mail,
      iconClass: "text-blue-500",
      ringClass:
        "border-blue-200 bg-blue-50 dark:border-blue-500/30 dark:bg-blue-500/10",
      title: "Vérifiez votre adresse e-mail",
      description:
        "Un lien de confirmation a été envoyé à votre adresse e-mail. Cliquez sur le lien pour activer votre compte UniHome.",
    };
  }, [message, status]);

  const { Icon } = config;

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

      <div className="relative z-10 w-full max-w-md text-center">
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)] dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-3 flex justify-center">
            <Logo size="lg" />
          </div>
          <p className="mb-6 font-mono text-[10px] uppercase tracking-[0.14em] text-blue-600 dark:text-blue-400">
            activation du compte
          </p>
          <div
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border ${config.ringClass}`}
          >
            <Icon className={`w-9 h-9 ${config.iconClass}`} />
          </div>
          <h1 className="mb-3 font-geist text-2xl font-bold tracking-[-0.01em] text-zinc-950 dark:text-white">
            {config.title}
          </h1>
          <p className="mb-6 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            {config.description}
          </p>
          <div className="mb-6 space-y-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-left dark:border-zinc-800 dark:bg-zinc-950">
            {[
              status === "error"
                ? "Renvoyez le lien depuis la page de connexion"
                : "Votre compte sera activé après confirmation",
              "Le lien expire dans 24 h",
              "Vérifiez votre dossier spam si vous n'avez rien reçu",
            ].map((t) => (
              <div
                key={t}
                className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400"
              >
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-500" />{" "}
                {t}
              </div>
            ))}
          </div>
          <Link
            to="/login"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700"
          >
            Aller à la connexion <ArrowRight className="w-4 h-4" />
          </Link>
          {status === "error" && (
            <Link
              to="/login"
              className="mt-4 inline-flex items-center justify-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
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
