import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDown,
  Bot,
  Check,
  ChevronRight,
  Copy,
  Flag,
  Home,
  RefreshCcw,
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
    prompt: "Aide-moi à trouver un logement adapté à mon budget et à ma ville.",
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
    return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  }
  if (score >= 70) {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30";
  }
  if (score >= 40) {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/30";
  }
  return "bg-red-50 text-red-700 ring-1 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/30";
}

// Detect Arabic / darija replies to flip the bubble to RTL
function isArabicText(text) {
  if (!text) return false;
  const arabic = (String(text).match(/[\u0600-\u06FF]/g) || []).length;
  return arabic > String(text).length * 0.25;
}

// Lightweight markdown: line breaks + **bold** (Gemini loves emitting it)
function renderRichText(text) {
  if (!text) return null;
  const lines = String(text).split(/\r?\n/);
  return lines.map((line, idx) => (
    <span key={idx}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
      {idx < lines.length - 1 && <br />}
    </span>
  ));
}

const COMPOSER_PLACEHOLDERS = [
  "Posez votre question…",
  "Ex : un studio à Rabat sous 2500 DH ?",
  "Ex : c'est quoi le score de confiance ?",
  "Ex : كيفاش نلقى سكن قريب من الجامعة ؟",
  "Ex : comment publier mon annonce ?",
];

const TYPING_STATUSES = [
  "UniBot réfléchit…",
  "analyse de votre question…",
  "recherche dans les annonces…",
  "rédaction de la réponse…",
];

// Reveals bot text word by word for a live, streaming feel
function TypewriterText({ text, onTick }) {
  const words = useMemo(() => String(text).split(/(\s+)/), [text]);
  const [count, setCount] = useState(0);
  const done = count >= words.length;

  useEffect(() => {
    if (done) return undefined;
    const step = Math.max(1, Math.round(words.length / 60));
    const id = setInterval(() => {
      setCount((c) => Math.min(c + step, words.length));
      onTick?.();
    }, 28);
    return () => clearInterval(id);
  }, [done, words.length, onTick]);

  return (
    <>
      {renderRichText(words.slice(0, count).join(""))}
      {!done && (
        <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse rounded-full bg-blue-500 align-middle" />
      )}
    </>
  );
}

export default function ChatbotPanel({
  currentAnnonceId = null,
  ownerAnnonceId = null,
  intentHint = null,
  initialContextMessage = null,
  initialPrompt = null,
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
  const [unseen, setUnseen] = useState(false);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);

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
    setUnseen(false);
  };

  const isNearBottom = () => {
    const el = messagesContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 200;
  };

  // Follow the conversation only if the user is already near the bottom —
  // otherwise flag the arrival so we don't yank their reading position.
  useEffect(() => {
    if (isNearBottom()) {
      scrollToBottom("smooth");
    } else {
      setUnseen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading]);

  // Keep the view glued to the typewriter while it reveals text
  const followTypewriter = () => {
    if (isNearBottom()) scrollToBottom("auto");
  };

  // Rotate composer placeholder hints
  useEffect(() => {
    const id = setInterval(
      () => setPlaceholderIdx((i) => (i + 1) % COMPOSER_PLACEHOLDERS.length),
      4000,
    );
    return () => clearInterval(id);
  }, []);

  // Replace welcome message when initial context message changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.role !== "bot") return prev;
      return createInitialMessages(initialContextMessage);
    });
  }, [initialContextMessage]);

  // Prefill the composer with an incoming prompt (e.g. dashboard chips)
  useEffect(() => {
    if (initialPrompt) setInput(initialPrompt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialPrompt]);

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
    if (distanceFromBottom < 60) setUnseen(false);
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
          reveal: true,
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
          error: true,
          retryText: msg,
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
      ? "bg-white dark:bg-zinc-950"
      : "relative overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)] dark:border-zinc-800 dark:bg-zinc-900",
  ].join(" ");

  const panel = (
    <div className={wrapperClasses}>
      {/* Messages list */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className={`unibot-scroll unibot-dotgrid relative flex-1 overflow-y-auto ${compact ? "px-4 py-4" : "px-6 py-6"} space-y-4`}
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
              onRetry={(text) => sendMessage(text)}
              onTypeTick={followTypewriter}
            />
          ))
        )}

        {loading && <TypingBubble />}

        {showScrollDown && (
          <button
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className={`sticky bottom-2 ml-auto flex items-center justify-center gap-1.5 rounded-full border shadow-lg backdrop-blur transition hover:-translate-y-0.5 ${
              unseen
                ? "h-9 border-blue-300 bg-blue-600 px-3.5 text-white hover:bg-blue-700 dark:border-blue-500/50"
                : "h-9 w-9 border-zinc-200 bg-white/95 text-blue-600 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900/95 dark:text-blue-400 dark:hover:bg-zinc-800"
            }`}
            aria-label="Aller au dernier message"
            title="Aller au dernier message"
          >
            <ArrowDown className="h-4 w-4" />
            {unseen && (
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em]">
                nouveau message
              </span>
            )}
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
              className="group inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3.5 py-1.5 text-xs font-medium text-zinc-700 transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 hover:shadow-sm disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-blue-500/50 dark:hover:text-blue-300"
            >
              <Sparkles className="h-3 w-3 text-blue-500 opacity-70 transition group-hover:opacity-100 dark:text-blue-400" />
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800 sm:p-4">
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-10 w-10 flex-shrink-0 rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Réinitialiser la conversation"
            title="Réinitialiser la conversation"
          >
            <RotateCcw className="mx-auto h-4 w-4" />
          </button>

          <div className="flex flex-1 items-end gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 transition focus-within:border-blue-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-950 dark:focus-within:border-blue-500 dark:focus-within:bg-zinc-950">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={COMPOSER_PLACEHOLDERS[placeholderIdx]}
              className="unibot-scroll max-h-[120px] flex-1 resize-none border-0 bg-transparent py-1.5 text-sm leading-relaxed text-zinc-900 placeholder-zinc-400 outline-none dark:text-white dark:placeholder-zinc-500"
              aria-label="Message à envoyer"
            />
          </div>

          <button
            type="button"
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 active:scale-95 ${
              input.trim() && !loading
                ? "scale-105 shadow-[0_10px_30px_-6px_rgba(37,99,235,0.75)]"
                : "shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)]"
            }`}
            aria-label="Envoyer le message"
          >
            {loading ? (
              <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
        <p className="mt-2 px-1 font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
          entrée pour envoyer · maj+entrée pour une nouvelle ligne
        </p>
      </div>
    </div>
  );

  if (embedded) return panel;

  // Living aura: the whole panel glows while Gemini is thinking
  return (
    <div className="relative">
      <div
        className={`unibot-aura ${loading ? "unibot-aura--on" : ""}`}
        aria-hidden="true"
      />
      {panel}
    </div>
  );
}

/* ────────── sub-components ────────── */

function WelcomeHero({ compact, onPickPrompt }) {
  return (
    <div className="unibot-message-in flex flex-col items-center text-center">
      <div className="relative mb-4">
        <span className="absolute inset-0 rounded-full bg-blue-500 opacity-25 blur-xl" />
        <span className="unibot-orbit" aria-hidden="true" />
        <span
          className="unibot-orbit unibot-orbit--reverse"
          aria-hidden="true"
        />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_12px_32px_-8px_rgba(37,99,235,0.6)] dark:bg-blue-500">
          <Sparkles className="h-7 w-7" />
        </div>
      </div>
      <h3 className="font-geist text-lg font-bold tracking-[-0.01em] text-zinc-950 dark:text-white">
        Bonjour, je suis UniBot 👋
      </h3>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
        fr · عربية · darija
      </p>
      <p
        className={`${compact ? "max-w-[300px]" : "max-w-md"} mt-2 text-sm text-zinc-500 dark:text-zinc-400`}
      >
        Je vous aide à trouver un logement, à comprendre les annonces et à
        utiliser UniHome.
      </p>

      <div
        className={`mt-5 grid w-full gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2"}`}
      >
        {CAPABILITIES.map((cap, capIdx) => {
          const Icon = cap.icon;
          return (
            <button
              key={cap.title}
              type="button"
              onClick={() => onPickPrompt(cap.prompt)}
              style={{ animationDelay: `${150 + capIdx * 90}ms` }}
              className="unibot-cascade group relative flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(37,99,235,0.4)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/50"
            >
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition group-hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:group-hover:bg-blue-500/20">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white">
                  {cap.title}
                </p>
                <p className="mt-0.5 text-xs leading-snug text-zinc-500 dark:text-zinc-400">
                  {cap.description}
                </p>
              </div>
              <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0 text-zinc-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500 dark:text-zinc-600" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MessageRow({
  msg,
  compact,
  showAvatar,
  onListingClick,
  onRetry,
  onTypeTick,
}) {
  const isBot = msg.role === "bot";
  const rtl = isArabicText(msg.text);
  const [copied, setCopied] = useState(false);

  const copyReply = async () => {
    try {
      await navigator.clipboard.writeText(msg.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div
      className={`unibot-message-in flex gap-3 ${isBot ? "" : "flex-row-reverse"}`}
    >
      <div className="flex w-8 flex-shrink-0 justify-center">
        {showAvatar ? (
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${
              isBot
                ? "bg-blue-600 text-white shadow-[0_6px_16px_-6px_rgba(37,99,235,0.6)] dark:bg-blue-500"
                : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            }`}
          >
            {isBot ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
          </div>
        ) : (
          <div className="h-8 w-8" />
        )}
      </div>

      <div
        className={`group flex flex-col gap-1 ${compact ? "max-w-[82%]" : "max-w-[75%]"} ${isBot ? "items-start" : "items-end"}`}
      >
        <div
          dir={rtl ? "rtl" : "ltr"}
          className={`whitespace-pre-wrap break-words px-4 py-2.5 text-sm leading-relaxed ${rtl ? "text-right" : ""} ${
            isBot
              ? msg.error
                ? "rounded-2xl rounded-tl-md border border-red-200 bg-red-50 text-red-800 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                : "rounded-2xl rounded-tl-md border border-zinc-200 bg-zinc-50 text-zinc-800 dark:border-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-100"
              : "rounded-2xl rounded-tr-md bg-blue-600 text-white shadow-[0_8px_24px_-10px_rgba(37,99,235,0.6)]"
          }`}
        >
          {isBot && msg.reveal ? (
            <TypewriterText text={msg.text} onTick={onTypeTick} />
          ) : (
            renderRichText(msg.text)
          )}
        </div>

        {isBot && msg.error && msg.retryText && (
          <button
            type="button"
            onClick={() => onRetry(msg.retryText)}
            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 bg-white px-3 py-1 text-xs font-medium text-red-600 transition hover:-translate-y-0.5 hover:border-red-300 hover:shadow-sm dark:border-red-500/30 dark:bg-zinc-900 dark:text-red-300"
          >
            <RefreshCcw className="h-3 w-3" />
            Réessayer
          </button>
        )}

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

        <span className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 dark:text-zinc-500">
          {msg.time}
          {isBot && !msg.error && (
            <button
              type="button"
              onClick={copyReply}
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 transition hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
              aria-label="Copier la réponse"
              title="Copier la réponse"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-500" /> copié
                </>
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </button>
          )}
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
      className="group w-full overflow-hidden rounded-2xl border border-zinc-200 bg-white text-left transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_16px_40px_-24px_rgba(37,99,235,0.4)] dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-blue-500/50"
    >
      <div className="flex items-stretch gap-3 p-3">
        <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
          {photo ? (
            <img
              src={photo}
              alt={listing.titre || "Annonce"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-500">
              <Home className="h-5 w-5" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-white">
              {listing.titre || "Annonce"}
            </p>
            <span
              className={`flex-shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${scoreBadgeClasses(score)}`}
            >
              {score !== null ? `${score}/100` : "—"}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {listing.ville || "Ville non indiquée"}
            {listing.typeLogement ? ` · ${listing.typeLogement}` : ""}
          </p>
          <p className="mt-1 font-mono text-sm font-bold tabular-nums text-blue-700 dark:text-blue-300">
            {formatPrice(listing.loyer)}
          </p>

          {Array.isArray(listing.reasons) && listing.reasons.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {listing.reasons.slice(0, 3).map((reason) => (
                <span
                  key={reason}
                  className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
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
  const [statusIdx, setStatusIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStatusIdx((i) => Math.min(i + 1, TYPING_STATUSES.length - 1)),
      1800,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="unibot-message-in flex gap-3">
      <div className="flex w-8 flex-shrink-0 justify-center">
        <div className="unibot-breathe flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white dark:bg-blue-500">
          <Bot className="h-4 w-4" />
        </div>
      </div>
      <div className="rounded-2xl rounded-tl-md border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-800/60">
        <div className="flex items-center gap-2.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
            {TYPING_STATUSES[statusIdx]}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5">
          <span
            className="unibot-typing-dot h-2 w-2 rounded-full bg-blue-500"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="unibot-typing-dot h-2 w-2 rounded-full bg-blue-500"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="unibot-typing-dot h-2 w-2 rounded-full bg-blue-500"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
