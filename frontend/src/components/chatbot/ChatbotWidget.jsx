import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, MessageCircle, Sparkles, X } from "lucide-react";
import ChatbotPanel from "./ChatbotPanel";

function getAnnonceIdFromPath(pathname) {
  const match = pathname.match(/^\/annonces\/(\d+)$/);
  return match?.[1] || null;
}

const GREETED_KEY = "unibot_greeted_v1";

export default function ChatbotWidget({
  contextLabel = "Recherche, score de confiance et aide plateforme",
  intentHint = null,
}) {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  const currentAnnonceId = useMemo(
    () => getAnnonceIdFromPath(location.pathname),
    [location.pathname],
  );

  // First-visit greeting bubble (auto-dismisses after a few seconds, once per browser).
  // Suppressed on the homepage: the hero owns that first viewport.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    if (location.pathname === "/") return undefined;
    try {
      if (window.localStorage.getItem(GREETED_KEY)) return undefined;
    } catch (_e) {
      return undefined;
    }
    const showTimer = window.setTimeout(() => setShowGreeting(true), 1400);
    const hideTimer = window.setTimeout(() => {
      setShowGreeting(false);
      try {
        window.localStorage.setItem(GREETED_KEY, "1");
      } catch (_e) {
        /* ignore */
      }
    }, 9000);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [location.pathname]);

  // Hide greeting as soon as user opens the widget
  useEffect(() => {
    if (!open) return;
    setShowGreeting(false);
    try {
      window.localStorage.setItem(GREETED_KEY, "1");
    } catch (_e) {
      /* ignore */
    }
  }, [open]);

  if (location.pathname === "/chatbot") return null;

  const fullPagePath = currentAnnonceId
    ? `/chatbot?annonceId=${currentAnnonceId}`
    : "/chatbot";

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open && (
        <div className="unibot-panel-pop unibot-shadow w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-[28px] border border-zinc-200 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
          {/* Header */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-blue-600" />
            <div className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-blue-400/40 blur-3xl" />

            <div className="relative flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm ring-1 ring-white/30">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex h-3.5 w-3.5 rounded-full border-2 border-white bg-emerald-500" />
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold leading-tight text-white">
                    UniBot
                  </p>
                  <p className="truncate text-[11px] font-medium leading-tight text-white/85">
                    {currentAnnonceId
                      ? "Contexte de l'annonce actif"
                      : contextLabel}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Link
                  to={fullPagePath}
                  className="rounded-xl p-2 text-white/85 transition hover:bg-white/15 hover:text-white"
                  aria-label="Ouvrir la version pleine page"
                  title="Ouvrir la version pleine page"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl p-2 text-white/85 transition hover:bg-white/15 hover:text-white"
                  aria-label="Fermer UniBot"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <ChatbotPanel
            currentAnnonceId={currentAnnonceId}
            intentHint={intentHint}
            heightClassName="h-[520px] max-h-[70vh]"
            compact
            embedded
          />
        </div>
      )}

      {!open && showGreeting && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="unibot-greet-pop unibot-shadow group relative flex max-w-[280px] items-center gap-3 rounded-2xl rounded-br-md bg-white px-4 py-3 text-left text-sm text-gray-700 ring-1 ring-zinc-200 transition hover:-translate-y-0.5 hover:ring-blue-300 dark:bg-slate-900 dark:text-gray-100 dark:ring-blue-500/40"
          aria-label="Ouvrir UniBot"
        >
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="leading-snug">
            <span className="block font-semibold">Bonjour 👋</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Une question sur le logement&nbsp;? Discutons ensemble.
            </span>
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="unibot-fab-shadow group relative flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition-all hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 active:scale-95"
        aria-label={open ? "Fermer UniBot" : "Ouvrir UniBot"}
      >
        {!open && (
          <span
            aria-hidden="true"
            className="unibot-pulse-ring pointer-events-none absolute inset-0 rounded-full bg-blue-500/45"
          />
        )}
        {open ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6 transition-transform group-hover:scale-110" />
        )}
      </button>
    </div>
  );
}
