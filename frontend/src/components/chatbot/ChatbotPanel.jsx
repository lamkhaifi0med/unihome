import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  Bot,
  ChevronRight,
  Flag,
  Home,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  User,
} from "lucide-react";
import { chatbotApi } from "../../api/chatbotApi";

const DEFAULT_QUICK_REPLIES = [
  "Comment fonctionne le score de confiance ?",
  "Comment signaler une annonce ?",
  "Comment publier une annonce ?",
  "Le service est-il gratuit ?",
];

const CAPABILITIES = [
  {
    icon: Search,
    title: "Trouver un logement",
    description: "Selon ville, budget et équipements",
    prompt:
      "Aide-moi à trouver un logement adapté à mon budget et à ma ville.",
  },
  {
    icon: ShieldCheck,
    title: "Score de confiance",
    description: "Comprendre l'évaluation des annonces",
    prompt: "Comment fonctionne le score de confiance d'une annonce ?",
  },
  {
    icon: UploadCloud,
    title: "Publier une annonce",
    description: "Toutes les étapes pour les propriétaires",
    prompt: "Comment publier une annonce sur UniHome ?",
  },
  {
    icon: Flag,
    title: "Signaler un souci",
    description: "Annonce suspecte ou contenu inapproprié",
    prompt: "Comment signaler une annonce suspecte ?",
  },
];

function nowLabel() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function createSessionId() {
  return (
    globalThis.crypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`
  );
}

function createInitialMessages(contextMessage = null) {
  return [
    {
      id: 1,
      role: "bot",
      text:
        contextMessage ||
        "Bonjour ! Je suis l'assistant UniHome 🏠 Je peux vous aider à trouver un logement, comprendre le score de confiance ou répondre à vos questions sur la plateforme. Comment puis-je vous aider ?",
      time: nowLabel(),
    },
  ];
}

function formatPrice(value) {
  if (value === null || value === undefined) return "Prix non indiqué";
  return `${Number(value).toLocaleString("fr-FR")} DH/mois`;
}

function scoreBadgeClasses(score) {
  if (score === null || score === undefined) {
    return "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300";
  }
  if (score >= 70) {
    return "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300";
  }
  if (score >= 40) {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300";
  }
  return "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300";
}

function renderTextWithBreaks(text) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  return lines.map((line, idx) => (
    <span key={idx}>
      {line}
      {idx < lines.length - 1 && <br />}
    </span>
  ));
}

export default function ChatbotPanel({
  currentAnnonceId = null,
  ownerAnnonceId = null,
  intentHint = null,
  initialContextMessage = null,
  heightClassName = "h-[65vh]",
  compact = false,
  embedded = false,
}) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(() =>
    createInitialMessages(initialContextMessage),
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(createSessionId);
  const [suggestions, setSuggestions] = useState(DEFAULT_QUICK_REPLIES);
  const [showScrollDown, setShowScrollDown] = useState(false);

  const messagesContainerRef = useRef(null);
  const textareaRef = useRef(null);

  const showWelcome =
    messages.length === 1 &&
    messages[0]?.role === "bot" &&
    !initialContextMessage;

  const scrollToBottom = (behavior = "smooth") => {
    const container = messagesContainerRef.current;
    if (!container) return;
    container.scrollTo({ top: container.scrollHeight, behavior });
  };

  // Auto-scroll on new messages / loading state
  useEffect(() => {
    scrollToBottom("smooth");
  }, [messages, loading]);

  // Replace welcome message when initial context message changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.role !== "bot") return prev;
      return createInitialMessages(initialContextMessage);
    });
  }, [initialContextMessage]);

  // Auto-grow textarea (max ~120px)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const handleScroll = (event) => {
    const el = event.currentTarget;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setShowScrollDown(distanceFromBottom > 140);
  };

  const sendMessage = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), role: "user", text: msg, time: nowLabel() },
    ]);
    setInput("");
    setLoading(true);

    try {
      const { data } = await chatbotApi.send({
        message: msg,
        sessionId,
        currentAnnonceId,
        ownerAnnonceId,
        intentHint,
      });

      if (data.sessionId && data.sessionId !== sessionId) {
        setSessionId(data.sessionId);
      }
      if (Array.isArray(data.quickReplies) && data.quickReplies.length) {
        setSuggestions(data.quickReplies);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text:
            data.reply ||
            "Je peux vous aider à chercher un logement ou comprendre UniHome.",
          suggestedListings: data.suggestedListings || [],
          time: nowLabel(),
        },
      ]);
    } catch (_error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: "Le service chatbot est temporairement indisponible. Réessayez dans quelques instants.",
          suggestedListings: [],
          time: nowLabel(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setMessages(createInitialMessages(initialContextMessage));
    setSuggestions(DEFAULT_QUICK_REPLIES);
    setSessionId(createSessionId());
    setInput("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  // Decide if a bubble should show its avatar — only on the first message
  // of a same-role streak, to make the conversation feel grouped.
  const avatarVisibility = useMemo(() => {
    return messages.map((msg, idx) => {
      const prev = messages[idx - 1];
      return !prev || prev.role !== msg.role;
    });
  }, [messages]);

  const wrapperClasses = [
    "flex flex-col",
    heightClassName,
    embedded
      ? "bg-white dark:bg-slate-950"
      : "glass-light overflow-hidden rounded-3xl shadow-xl",
  ].join(" ");

  return (
    <div className={wrapperClasses}>
      {/* Messages list */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`unibot-scroll relative flex-1 overflow-y-auto ${compact ? "px-4 py-4" : "px-6 py-6"} space-y-4`}
      >
        {showWelcome ? (
          <WelcomeHero
            compact={compact}
            onPickPrompt={(prompt) => sendMessage(prompt)}
          />
        ) : (
          messages.map((msg, idx) => (
            <MessageRow
              key={msg.id}
              msg={msg}
              compact={compact}
              showAvatar={avatarVisibility[idx]}
              onListingClick={(listing) =>
                navigate(listing.route || `/annonces/${listing.id}`)
              }
            />
          ))
        )}

        {loading && <TypingBubble />}

        {showScrollDown && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="sticky bottom-2 ml-auto flex h-9 w-9 items-center justify-center rounded-full border border-primary-200 bg-white/95 text-primary-600 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-primary-50 dark:border-primary-500/30 dark:bg-slate-900/95 dark:text-primary-300"
            aria-label="Aller au dernier message"
            title="Aller au dernier message"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Quick replies (shown after the welcome screen, when there are suggestions) */}
      {!showWelcome && suggestions.length > 0 && (
        <div
          className={`${compact ? "px-4" : "px-6"} pb-2 flex flex-wrap gap-2`}
        >
          {suggestions.slice(0, 4).map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => sendMessage(q)}
              disabled={loading}
              className="group inline-flex items-center gap-1 rounded-full border border-primary-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-primary-700 transition hover:-translate-y-0.5 hover:bg-primary-50 hover:shadow-sm disabled:opacity-50 dark:border-primary-500/30 dark:bg-white/5 dark:text-primary-300 dark:hover:bg-primary-500/10"
            >
              <Sparkles className="h-3 w-3 opacity-70 transition group-hover:opacity-100" />
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="border-t border-gray-200 dark:border-white/10 p-3 sm:p-4">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-10 w-10 flex-shrink-0 rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/10 dark:hover:text-gray-200"
            aria-label="Réinitialiser la conversation"
            title="Réinitialiser la conversation"
          >
            <RotateCcw className="mx-auto h-4 w-4" />
          </button>

          <div className="flex flex-1 items-end gap-2 rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 transition focus-within:border-primary-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-500/30 dark:border-white/10 dark:bg-white/5 dark:focus-within:bg-white/10">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question…"
              className="unibot-scroll max-h-[120px] flex-1 resize-none border-0 bg-transparent py-1.5 text-sm leading-relaxed text-gray-900 placeholder-gray-400 outline-none dark:text-white dark:placeholder-gray-500"
              aria-label="Message à envoyer"
            />
          </div>

          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-600 to-accent-600 text-white transition hover:from-primary-500 hover:to-accent-500 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
            aria-label="Envoyer le message"
          >
            {loading ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 px-1 text-[10px] text-gray-400 dark:text-gray-500">
          Entrée pour envoyer · Maj+Entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );
}

/* ────────── sub-components ────────── */

function WelcomeHero({ compact, onPickPrompt }) {
  return (
    <div className="unibot-message-in flex flex-col items-center text-center">
      <div className="relative mb-4">
        <span className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary-500 to-accent-600 opacity-30 blur-xl" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-lg">
          <Sparkles className="h-7 w-7" />
        </div>
      </div>
      <h3 className="font-display text-lg font-bold text-gray-900 dark:text-white">
        Bonjour, je suis UniBot 👋
      </h3>
      <p className={`${compact ? "max-w-[300px]" : "max-w-md"} mt-1 text-sm text-gray-500 dark:text-gray-400`}>
        Je vous aide à trouver un logement, à comprendre les annonces et à
        utiliser UniHome.
      </p>

      <div
        className={`mt-5 grid w-full gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}
      >
        {CAPABILITIES.map((cap) => {
          const Icon = cap.icon;
          return (
            <button
              key={cap.title}
              type="button"
              onClick={() => onPickPrompt(cap.prompt)}
              className="group relative flex items-start gap-3 rounded-2xl border border-gray-200 bg-white/80 p-3 text-left transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:hover:border-primary-500/40"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition group-hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-300 dark:group-hover:bg-primary-500/20">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {cap.title}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-gray-500 dark:text-gray-400">
                  {cap.description}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-primary-500 dark:text-gray-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MessageRow({ msg, compact, showAvatar, onListingClick }) {
  const isBot = msg.role === "bot";
  return (
    <div
      className={`unibot-message-in flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}
    >
      <div className="flex w-8 flex-shrink-0 justify-center">
        {showAvatar ? (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-xl ${
              isBot
                ? "bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-md"
                : "bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-300"
            }`}
          >
            {isBot ? (
              <Bot className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>

      <div
        className={`group flex flex-col gap-1 ${compact ? "max-w-[82%]" : "max-w-[75%]"} ${isBot ? "items-start" : "items-end"}`}
      >
        <div
          className={`whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isBot
              ? "rounded-2xl rounded-tl-md border border-gray-100 bg-white text-gray-800 dark:border-white/10 dark:bg-white/10 dark:text-gray-100"
              : "rounded-2xl rounded-tr-md bg-gradient-to-br from-primary-600 to-accent-600 text-white"
          }`}
        >
          {renderTextWithBreaks(msg.text)}
        </div>

        {isBot &&
          Array.isArray(msg.suggestedListings) &&
          msg.suggestedListings.length > 0 && (
            <div className="mt-1 w-full space-y-2">
              {msg.suggestedListings.map((listing) => (
                <SuggestedListing
                  key={listing.id}
                  listing={listing}
                  onClick={() => onListingClick(listing)}
                />
              ))}
            </div>
          )}

        <span className="opacity-0 transition-opacity group-hover:opacity-100 text-[10px] text-gray-400 dark:text-gray-500">
          {msg.time}
        </span>
      </div>
    </div>
  );
}

function SuggestedListing({ listing, onClick }) {
  const photo = listing.photo || listing.image || null;
  const score = listing.scoreConfiance ?? null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full overflow-hidden rounded-2xl border border-primary-200 bg-white text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-primary-500/30 dark:bg-white/5"
    >
      <div className="flex items-stretch gap-3 p-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-primary-100 via-white to-accent-100 dark:from-primary-500/20 dark:via-slate-900 dark:to-accent-500/20">
          {photo ? (
            <img
              src={photo}
              alt={listing.titre || "Annonce"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary-500 dark:text-primary-300">
              <Home className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">
              {listing.titre || "Annonce"}
            </p>
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${scoreBadgeClasses(score)}`}
            >
              {score !== null ? `Score ${score}` : "Score —"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
            {listing.ville || "Ville non indiquée"}
            {listing.typeLogement ? ` · ${listing.typeLogement}` : ""}
          </p>
          <p className="mt-1 text-sm font-bold text-primary-700 dark:text-primary-300">
            {formatPrice(listing.loyer)}
          </p>

          {Array.isArray(listing.reasons) && listing.reasons.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {listing.reasons.slice(0, 3).map((reason) => (
                <span
                  key={reason}
                  className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 dark:bg-white/10 dark:text-gray-300"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

function TypingBubble() {
  return (
    <div className="unibot-message-in flex gap-3">
      <div className="flex w-8 flex-shrink-0 justify-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-md">
          <Bot className="h-4 w-4" />
        </div>
      </div>
      <div className="rounded-2xl rounded-tl-md border border-gray-100 bg-white px-4 py-3 shadow-sm dark:border-white/10 dark:bg-white/10">
        <div className="flex items-center gap-1.5">
          <span
            className="unibot-typing-dot h-2 w-2 rounded-full bg-primary-500"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="unibot-typing-dot h-2 w-2 rounded-full bg-primary-500"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="unibot-typing-dot h-2 w-2 rounded-full bg-primary-500"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

