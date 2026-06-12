import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Phone,
  Eye,
  AlertTriangle,
  Sparkles,
  Home,
  Users,
  Heart,
  ArrowRight,
  CheckCircle2,
  XCircle,
  BadgeCheck,
  GraduationCap,
  Key,
  Camera,
  Flag,
} from "lucide-react";

const ILLUSTRATIONS = {
  warning: "/home-visuals/warning-rafiki.svg",
  studying: "/home-visuals/studying-rafiki.svg",
  houseSearch: "/home-visuals/house-searching-cuate.svg",
  confirmed: "/home-visuals/confirmed-amico.svg",
  collegeStudents: "/home-visuals/college-students-rafiki.svg",
  campusCuate: "/home-visuals/college-campus-cuate.svg",
  campusAmico: "/home-visuals/college-campus-amico.svg",
  apartmentRent: "/home-visuals/apartment-rent-pana.svg",
  studioMock: "/home-visuals/studio-mock.svg",
};

/**
 * UniHome — Homepage Preview
 * Temporary page to preview a proposed homepage without replacing the real one.
 */
export default function HomePreview() {
  const [audience, setAudience] = useState("etudiant");
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#f8f9ff] text-[#0f0f2d] dark:bg-[#0a0a1a] dark:text-slate-100 font-[DM_Sans,system-ui,sans-serif]">
      <HomeVisualStyles />

      {/* Ambient background glows */}
      <BackgroundDecor scrollY={scrollY} />

      {/* 1. HERO — Emotional opener */}
      <Hero scrollY={scrollY} />

      {/* 2. THE REAL PROBLEM — story of pain */}
      <RealProblem />

      {/* 3. HOW UNIHOME CHANGES IT */}
      <HowItChanges />

      {/* 4. CONFIDENCE INDEX — explained simply */}
      <ConfidenceIndex />

      {/* 5. AUDIENCE SPLIT — students vs owners */}
      <AudienceSplit audience={audience} setAudience={setAudience} />

      {/* 6. NEAR YOUR CAMPUS */}
      <NearCampus />

      {/* 7. WHAT WE ARE / WHAT WE ARE NOT */}
      <Boundaries />

      {/* 8. COMMUNITY TRUST */}
      <Community />

      {/* 9. FINAL CTA */}
      <FinalCTA />
    </div>
  );
}

function HomeVisualStyles() {
  return (
    <style>{`
      @keyframes home-float-soft {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--float-rotate, 0deg)); }
        50% { transform: translate3d(0, -14px, 0) rotate(calc(var(--float-rotate, 0deg) * -1)); }
      }

      @keyframes home-float-side {
        0%, 100% { transform: translate3d(0, 0, 0) rotate(var(--float-rotate, 0deg)); }
        50% { transform: translate3d(10px, -10px, 0) rotate(calc(var(--float-rotate, 0deg) + 2deg)); }
      }

      @keyframes home-glow-pulse {
        0%, 100% { opacity: .45; transform: scale(1); }
        50% { opacity: .75; transform: scale(1.08); }
      }

      @keyframes home-draw-line {
        from { stroke-dashoffset: 900; }
        to { stroke-dashoffset: 0; }
      }

      @keyframes home-route-dot {
        0% { offset-distance: 0%; opacity: 0; transform: scale(.8); }
        12%, 88% { opacity: 1; transform: scale(1); }
        100% { offset-distance: 100%; opacity: 0; transform: scale(.8); }
      }

      @keyframes home-ring-pulse {
        0%, 100% { transform: scale(.94); opacity: .35; }
        50% { transform: scale(1.08); opacity: .8; }
      }

      @keyframes home-bar-grow {
        from { transform: scaleY(.2); opacity: .35; }
        to { transform: scaleY(1); opacity: 1; }
      }

      @keyframes home-morph-blob {
        0%, 100% { border-radius: 42% 58% 62% 38% / 48% 42% 58% 52%; opacity: .65; }
        50% { border-radius: 58% 42% 38% 62% / 42% 58% 42% 58%; opacity: .95; }
      }

      .home-float-soft { animation: home-float-soft 7s ease-in-out infinite; }
      .home-float-side { animation: home-float-side 8.5s ease-in-out infinite; }
      .home-glow-pulse { animation: home-glow-pulse 5s ease-in-out infinite; }
      .home-draw-line { stroke-dasharray: 900; animation: home-draw-line 1.8s ease-out both; }
      .home-ring-pulse { animation: home-ring-pulse 3.6s ease-in-out infinite; transform-origin: center; }
      .home-bar-grow { animation: home-bar-grow .9s cubic-bezier(.2,.8,.2,1) both; transform-origin: bottom; }
      .home-morph-blob { animation: home-morph-blob 12s ease-in-out infinite; }

      @media (prefers-reduced-motion: reduce) {
        .home-float-soft,
        .home-float-side,
        .home-glow-pulse,
        .home-draw-line,
        .home-ring-pulse,
        .home-bar-grow,
        .home-morph-blob { animation: none; }
      }
    `}</style>
  );
}

function RevealOnScroll({ children, delay = 0, className = "" }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.18, rootMargin: "0px 0px -80px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`${className} transition-all duration-1000 ease-out ${
        visible
          ? "translate-y-0 opacity-100 blur-0"
          : "translate-y-10 opacity-0 blur-sm"
      }`}
    >
      {children}
    </div>
  );
}

function IllustrationFrame({
  src,
  alt,
  label,
  caption,
  tone = "indigo",
  delay = 0,
  className = "",
  imageClassName = "",
  children,
}) {
  const tones = {
    indigo:
      "from-indigo-50/95 via-white/85 to-violet-50/90 dark:from-indigo-950/40 dark:via-white/[0.04] dark:to-violet-950/30",
    rose: "from-rose-50/95 via-white/85 to-orange-50/90 dark:from-rose-950/35 dark:via-white/[0.04] dark:to-orange-950/25",
    emerald:
      "from-emerald-50/95 via-white/85 to-indigo-50/90 dark:from-emerald-950/30 dark:via-white/[0.04] dark:to-indigo-950/25",
    violet:
      "from-violet-50/95 via-white/85 to-pink-50/90 dark:from-violet-950/35 dark:via-white/[0.04] dark:to-pink-950/25",
  };

  return (
    <RevealOnScroll delay={delay} className={className}>
      <div
        className={`relative overflow-hidden rounded-[2.25rem] border border-white/60 bg-gradient-to-br ${tones[tone]} p-4 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl dark:border-white/10`}
      >
        <div className="home-glow-pulse absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/50 blur-3xl dark:bg-indigo-400/10" />
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`relative mx-auto w-full select-none object-contain ${imageClassName}`}
        />
        {(label || caption || children) && (
          <div className="relative mt-3 rounded-2xl border border-white/70 bg-white/75 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
            {label && (
              <p className="font-[Syne,sans-serif] text-sm font-semibold text-slate-800 dark:text-slate-100">
                {label}
              </p>
            )}
            {caption && (
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {caption}
              </p>
            )}
            {children}
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
}

function AmbientIllustration({
  src,
  alt,
  label,
  caption,
  tone = "indigo",
  delay = 0,
  className = "",
  imageClassName = "",
}) {
  const tones = {
    indigo:
      "from-indigo-300/40 via-violet-200/25 to-transparent dark:from-indigo-600/20 dark:via-violet-500/10",
    rose: "from-rose-300/45 via-orange-200/25 to-transparent dark:from-rose-600/20 dark:via-orange-500/10",
    emerald:
      "from-emerald-300/40 via-indigo-200/25 to-transparent dark:from-emerald-600/18 dark:via-indigo-500/10",
    violet:
      "from-violet-300/45 via-pink-200/25 to-transparent dark:from-violet-600/20 dark:via-pink-500/10",
  };

  return (
    <RevealOnScroll delay={delay} className={className}>
      <div className="relative overflow-visible px-4 py-2 text-center">
        <div
          className={`home-morph-blob absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 bg-gradient-to-br ${tones[tone]} blur-2xl sm:h-80 sm:w-80`}
        />
        <img
          src={src}
          alt={alt}
          loading="lazy"
          className={`relative z-10 mx-auto w-full select-none object-contain drop-shadow-2xl ${imageClassName}`}
        />
        {(label || caption) && (
          <div className="relative z-10 mx-auto mt-4 max-w-sm rounded-2xl border border-white/60 bg-white/70 px-5 py-4 text-left shadow-lg shadow-indigo-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
            {label && (
              <p className="font-[Syne,sans-serif] text-sm font-semibold text-slate-800 dark:text-slate-100">
                {label}
              </p>
            )}
            {caption && (
              <p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                {caption}
              </p>
            )}
          </div>
        )}
      </div>
    </RevealOnScroll>
  );
}

function FloatingNote({
  className = "",
  icon: Icon,
  title,
  text,
  tone = "indigo",
}) {
  const tones = {
    indigo:
      "border-indigo-200/70 bg-indigo-50/80 text-indigo-700 dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-200",
    rose: "border-rose-200/70 bg-rose-50/85 text-rose-700 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200",
    emerald:
      "border-emerald-200/70 bg-emerald-50/85 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200",
    violet:
      "border-violet-200/70 bg-violet-50/85 text-violet-700 dark:border-violet-400/20 dark:bg-violet-500/10 dark:text-violet-200",
  };

  return (
    <div
      className={`absolute rounded-2xl border px-4 py-3 shadow-xl shadow-slate-900/5 backdrop-blur-xl ${tones[tone]} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {Icon && <Icon className="mt-0.5 h-4 w-4 shrink-0" />}
        <div>
          <p className="font-[Syne,sans-serif] text-xs font-bold uppercase tracking-[0.18em]">
            {title}
          </p>
          {text && (
            <p className="mt-1 text-xs leading-relaxed opacity-80">{text}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ProblemVisual() {
  return (
    <RevealOnScroll>
      <div className="relative mt-6 min-h-[17rem] overflow-visible">
        <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-br from-rose-300/30 via-orange-200/25 to-transparent blur-3xl dark:from-rose-600/20" />

        <svg
          className="absolute inset-x-8 top-10 h-40 w-[calc(100%-4rem)] text-rose-300/70 dark:text-rose-500/30"
          viewBox="0 0 360 220"
          fill="none"
          aria-hidden="true"
        >
          <path
            className="home-draw-line"
            d="M20 150 C70 35 135 210 190 100 C240 0 290 40 340 20"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="9 12"
          />
          <circle
            className="home-ring-pulse"
            cx="270"
            cy="54"
            r="42"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            className="home-ring-pulse"
            cx="270"
            cy="54"
            r="24"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>

        <img
          src={ILLUSTRATIONS.warning}
          alt="Étudiant inquiet face aux annonces douteuses"
          className="home-float-soft relative z-10 mx-auto max-h-60 w-full max-w-xs object-contain drop-shadow-2xl"
          loading="lazy"
        />

        <FloatingNote
          className="left-0 top-4 w-40 -rotate-6"
          icon={Camera}
          title="photo volée"
          text="image trop parfaite"
          tone="rose"
        />
        <FloatingNote
          className="right-0 top-24 w-44 rotate-6"
          icon={AlertTriangle}
          title="avance demandée"
          text="avant même la visite"
          tone="rose"
        />
        <FloatingNote
          className="bottom-0 left-10 w-44 rotate-3"
          icon={MessageCircle}
          title="trop de bruit"
          text="groupes et messages flous"
          tone="indigo"
        />
      </div>
    </RevealOnScroll>
  );
}

function JourneyVisual({ steps }) {
  return (
    <div className="relative mt-9 overflow-hidden rounded-[2.5rem] border border-white/60 bg-white/55 px-5 py-7 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl sm:px-8 dark:border-white/10 dark:bg-white/[0.035]">
      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-indigo-300/25 blur-3xl dark:bg-indigo-600/15" />
      <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl dark:bg-emerald-600/10" />

      <img
        src={ILLUSTRATIONS.confirmed}
        alt="Annonce confirmée par UniHome"
        className="home-float-side pointer-events-none absolute -right-8 -top-8 hidden w-44 opacity-70 drop-shadow-2xl lg:block"
        loading="lazy"
      />

      <svg
        className="absolute left-8 right-8 top-1/2 hidden h-28 -translate-y-1/2 text-indigo-300/70 lg:block dark:text-indigo-500/30"
        viewBox="0 0 900 150"
        fill="none"
        aria-hidden="true"
      >
        <path
          className="home-draw-line"
          d="M20 92 C170 5 290 142 430 76 C590 0 690 128 880 54"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>

      <div className="relative grid gap-5 lg:grid-cols-3">
        {steps.map((s, i) => (
          <RevealOnScroll key={s.n} delay={i * 140}>
            <div className="group relative min-h-44 rounded-[2rem] p-5 transition hover:-translate-y-2">
              <div className="absolute left-6 top-6 h-20 w-20 rounded-full bg-gradient-to-br from-indigo-500/15 to-violet-500/10 blur-xl transition group-hover:scale-125" />
              <div className="relative mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-500/30 ring-8 ring-white/60 dark:ring-white/10">
                <s.icon className="h-6 w-6" />
                <span className="absolute -right-3 -top-3 rounded-full bg-white px-2 py-1 font-[JetBrains_Mono,monospace] text-[10px] font-bold text-indigo-700 shadow-md dark:bg-[#141433] dark:text-indigo-200">
                  {s.n}
                </span>
              </div>
              <h3 className="font-[Syne,sans-serif] text-lg font-semibold">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {s.text}
              </p>
            </div>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  );
}

function TrustSignalsGraph() {
  const bars = [78, 92, 66, 84, 58, 94];

  return (
    <RevealOnScroll delay={220}>
      <div className="mt-4 overflow-hidden rounded-[2rem] border border-white/60 bg-white/55 p-4 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-[Syne,sans-serif] text-sm font-semibold">
              Signaux analysés
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              cohérence prix · photos · identité · signalements
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200">
            + clair
          </span>
        </div>

        <div className="mt-4 flex h-20 items-end gap-3">
          {bars.map((height, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-2">
              <div className="relative flex h-16 w-full items-end overflow-hidden rounded-full bg-slate-200/60 dark:bg-white/10">
                <div
                  className="home-bar-grow w-full rounded-full bg-gradient-to-t from-indigo-600 via-violet-500 to-emerald-400"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 90}ms`,
                  }}
                />
              </div>
              <span className="h-1 w-1 rounded-full bg-indigo-400" />
            </div>
          ))}
        </div>
      </div>
    </RevealOnScroll>
  );
}

function CampusMapVisual({ campuses }) {
  return (
    <RevealOnScroll delay={120}>
      <div className="relative min-h-[31rem] overflow-hidden rounded-[2.5rem] border border-white/60 bg-gradient-to-br from-white/70 via-indigo-50/50 to-violet-50/60 p-5 shadow-2xl shadow-indigo-500/10 backdrop-blur-2xl dark:border-white/10 dark:from-white/[0.04] dark:via-indigo-950/25 dark:to-violet-950/20">
        <div className="absolute left-1/2 top-20 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-600/15" />
        <img
          src={ILLUSTRATIONS.campusCuate}
          alt="Campus universitaire marocain"
          className="home-float-soft relative z-10 mx-auto max-h-44 w-full object-contain drop-shadow-xl"
          loading="lazy"
        />
        <img
          src={ILLUSTRATIONS.campusAmico}
          alt="Étudiants autour du campus"
          className="home-float-side pointer-events-none absolute -right-10 top-10 hidden w-44 opacity-20 mix-blend-multiply lg:block dark:mix-blend-normal dark:opacity-15"
          loading="lazy"
        />

        <div className="relative z-10 mx-auto mt-1 h-44 max-w-md">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 420 260"
            fill="none"
            aria-hidden="true"
          >
            <path
              className="home-draw-line"
              d="M68 202 C112 94 190 232 214 126 C244 12 318 52 358 88"
              stroke="url(#campusRoute)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="10 12"
            />
            <defs>
              <linearGradient
                id="campusRoute"
                x1="60"
                y1="210"
                x2="370"
                y2="70"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#6366f1" />
                <stop offset="1" stopColor="#10b981" />
              </linearGradient>
            </defs>
            <circle
              className="home-ring-pulse"
              cx="214"
              cy="126"
              r="74"
              stroke="#818cf8"
              strokeWidth="2"
              opacity="0.45"
            />
            <circle
              className="home-ring-pulse"
              cx="214"
              cy="126"
              r="42"
              stroke="#10b981"
              strokeWidth="2"
              opacity="0.55"
            />
          </svg>

          <div className="absolute left-[46%] top-[40%] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-xl shadow-indigo-500/30">
            <GraduationCap className="h-4 w-4" />
            Campus
          </div>
          <div className="absolute left-7 top-36 rounded-2xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur dark:bg-[#141433]/90 dark:text-slate-100">
            Studio · 8 min
          </div>
          <div className="absolute right-8 top-20 rounded-2xl bg-white/90 px-3 py-2 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur dark:bg-[#141433]/90 dark:text-slate-100">
            Chambre · 12 min
          </div>
          <div className="absolute bottom-8 left-1/2 rounded-2xl bg-emerald-500 px-3 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-500/30">
            trajet réaliste
          </div>
        </div>

        <div className="relative z-10 mt-2 grid gap-2">
          {campuses.slice(0, 3).map((c, i) => (
            <Link
              key={c}
              to="/search"
              className="group flex items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 text-sm text-slate-700 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-white dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.07]"
              style={{ transitionDelay: `${i * 35}ms` }}
            >
              <span className="flex items-center gap-2.5">
                <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                {c}
              </span>
              <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
            </Link>
          ))}
        </div>
      </div>
    </RevealOnScroll>
  );
}

/* ------------------------------------------------------------------ */
/* BACKGROUND DECOR                                                    */
/* ------------------------------------------------------------------ */

function BackgroundDecor({ scrollY }) {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -top-32 -left-32 h-[42rem] w-[42rem] rounded-full bg-gradient-to-br from-indigo-400/30 via-violet-400/20 to-transparent blur-3xl dark:from-indigo-600/25 dark:via-violet-700/20"
        style={{ transform: `translateY(${scrollY * 0.08}px)` }}
      />
      <div
        className="absolute top-1/3 -right-40 h-[38rem] w-[38rem] rounded-full bg-gradient-to-br from-pink-300/25 via-violet-400/20 to-transparent blur-3xl dark:from-pink-500/15 dark:via-violet-600/15"
        style={{ transform: `translateY(${-scrollY * 0.05}px)` }}
      />
      <div
        className="absolute bottom-0 left-1/4 h-[34rem] w-[34rem] rounded-full bg-gradient-to-tr from-indigo-300/20 via-purple-300/15 to-transparent blur-3xl dark:from-indigo-700/15"
        style={{ transform: `translateY(${-scrollY * 0.04}px)` }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 1 — HERO                                                    */
/* ------------------------------------------------------------------ */

function Hero({ scrollY }) {
  return (
    <section className="relative px-5 pt-12 pb-20 sm:px-8 sm:pt-20 sm:pb-28 lg:px-12">
      <div className="mx-auto max-w-7xl">
        {/* Small trust badge */}
        <div className="mx-auto mb-8 flex w-fit items-center gap-2 rounded-full border border-indigo-200/60 bg-white/60 px-4 py-2 text-xs font-medium text-indigo-700 backdrop-blur-md dark:border-indigo-400/20 dark:bg-white/5 dark:text-indigo-200">
          <Sparkles className="h-3.5 w-3.5" />
          Annonces contrôlées · Sans commission · Pensé pour étudiants
        </div>

        {/* Main headline */}
        <h1 className="font-[Syne,sans-serif] text-center text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          <span className="block">Trouver un logement étudiant</span>
          <span className="mt-2 block bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent dark:from-indigo-300 dark:via-violet-300 dark:to-pink-300">
            sans stress, sans arnaque.
          </span>
        </h1>

        <p className="mx-auto mt-7 max-w-2xl text-center text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          Tu commences tes études loin de chez toi ? Tu cherches une chambre
          près de ta fac sans tomber sur des faux propriétaires ni des photos
          volées ?
          <br className="hidden sm:block" />
          <span className="font-medium text-indigo-700 dark:text-indigo-200">
            UniHome rassemble des annonces contrôlées, plus claires, près de ton
            campus.
          </span>
        </p>

        {/* CTA buttons */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <Link
            to="/search"
            className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-7 py-4 font-[Syne,sans-serif] text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40 sm:w-auto"
          >
            <Search className="h-5 w-5" />
            Chercher mon logement
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </Link>

          <Link
            to="/register?role=PROPRIETAIRE"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-200/60 bg-white/70 px-7 py-4 font-[Syne,sans-serif] text-base font-semibold text-indigo-700 backdrop-blur-md transition hover:bg-white hover:shadow-md sm:w-auto dark:border-white/10 dark:bg-white/5 dark:text-indigo-200 dark:hover:bg-white/10"
          >
            <Home className="h-5 w-5" />
            Je suis propriétaire
          </Link>
        </div>

        {/* Soft secondary line */}
        <p className="mt-5 text-center text-sm text-slate-500 dark:text-slate-400">
          Déjà inscrit ?{" "}
          <Link
            to="/login"
            className="font-medium text-indigo-600 underline-offset-4 hover:underline dark:text-indigo-300"
          >
            Se connecter
          </Link>
        </p>

        {/* Hero visual mock */}
        <div className="relative mx-auto mt-16 max-w-5xl">
          <div
            className="pointer-events-none absolute -left-10 top-0 hidden w-72 lg:block"
            style={{
              transform: `translateY(${scrollY * 0.025}px) rotate(-6deg)`,
            }}
          >
            <div className="home-morph-blob absolute left-8 top-8 h-56 w-56 bg-indigo-300/25 blur-3xl dark:bg-indigo-600/15" />
            <img
              src={ILLUSTRATIONS.houseSearch}
              alt="Étudiant qui cherche un logement sur UniHome"
              className="home-float-soft relative z-10 w-full select-none object-contain drop-shadow-2xl"
              loading="eager"
            />
            <div className="relative z-10 mx-auto mt-3 w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-lg backdrop-blur dark:bg-[#141433]/90 dark:text-indigo-200">
              Recherche guidée
            </div>
          </div>

          <div
            className="pointer-events-none absolute -right-10 bottom-0 hidden w-64 lg:block"
            style={{
              transform: `translateY(${-scrollY * 0.02}px) rotate(6deg)`,
            }}
          >
            <div className="home-morph-blob absolute left-6 top-6 h-56 w-56 bg-violet-300/25 blur-3xl dark:bg-violet-600/15" />
            <img
              src={ILLUSTRATIONS.studying}
              alt="Étudiante concentrée et rassurée"
              className="home-float-side relative z-10 w-full select-none object-contain drop-shadow-2xl"
              loading="lazy"
            />
            <div className="relative z-10 mx-auto mt-3 w-fit rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-violet-700 shadow-lg backdrop-blur dark:bg-[#141433]/90 dark:text-violet-200">
              Zéro stress
            </div>
          </div>

          <HeroMock />
        </div>
      </div>
    </section>
  );
}

function HeroMock() {
  return (
    <div className="relative">
      {/* Phone-like central card */}
      <div className="relative mx-auto w-full max-w-md rounded-[2.5rem] border border-white/40 bg-white/70 p-3 shadow-2xl shadow-indigo-500/20 backdrop-blur-2xl dark:border-white/10 dark:bg-white/[0.04]">
        <div className="overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-[#141433] dark:to-[#0f0f2d]">
          {/* Search bar inside */}
          <div className="flex items-center gap-2 border-b border-slate-200/60 p-4 dark:border-white/10">
            <MapPin className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Près de l’Université Hassan II
            </span>
          </div>

          {/* Listing card */}
          <div className="p-4">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-100 dark:bg-[#0f0f2d]">
              <img
                src={ILLUSTRATIONS.studioMock}
                alt="Studio meublé lumineux"
                className="h-full w-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-end p-4">
                <div className="flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1.5 text-xs font-semibold text-white shadow-md">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Confiance 92 · Annonce sérieuse
                </div>
              </div>
              <div className="absolute right-3 top-3 rounded-full bg-white/90 p-2 backdrop-blur dark:bg-black/40">
                <Heart className="h-4 w-4 text-pink-500" />
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-[Syne,sans-serif] font-semibold text-slate-800 dark:text-slate-100">
                    Studio meublé · Maârif
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    À 6 min à pied de la fac
                  </p>
                </div>
                <span className="font-[Syne,sans-serif] text-lg font-bold text-indigo-700 dark:text-indigo-200">
                  2 200 DH
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Propriétaire vérifié
                </div>
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Phone className="h-3.5 w-3.5" />
                  Contact direct
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust notes live below the mock so they never cover the picture */}
      <div className="mx-auto mt-5 grid max-w-2xl gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-rose-100 bg-white/80 p-4 shadow-xl shadow-rose-200/30 backdrop-blur-xl dark:border-rose-500/10 dark:bg-white/[0.05] dark:shadow-rose-900/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-300">
            <XCircle className="h-4 w-4" />
            Annonce écartée
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Photos trouvées ailleurs sur internet. On l’a retirée pour te
            protéger.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-xl shadow-emerald-200/30 backdrop-blur-xl dark:border-emerald-500/10 dark:bg-white/[0.05] dark:shadow-emerald-900/10">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4" />
            Propriétaire vérifié
          </div>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
            Identité confirmée. Tu peux le contacter directement, sans
            intermédiaire.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 2 — REAL PROBLEM                                            */
/* ------------------------------------------------------------------ */

function RealProblem() {
  const pains = [
    {
      icon: Camera,
      title: "Photos volées",
      text: "Tu vois une belle chambre… qui n’existe même pas chez ce « propriétaire ».",
    },
    {
      icon: AlertTriangle,
      title: "Avance avant visite",
      text: "On te demande de virer 2 mois de loyer avant même de voir les murs.",
    },
    {
      icon: MessageCircle,
      title: "Groupes WhatsApp chaotiques",
      text: "200 messages par jour, prix flous, numéros qui ne répondent plus.",
    },
    {
      icon: MapPin,
      title: "Visites pour rien",
      text: "Tu traverses la ville, et le logement n’a rien à voir avec l’annonce.",
    },
  ];

  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-block rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
              La vraie galère
            </span>
            <h2 className="mt-5 font-[Syne,sans-serif] text-3xl font-bold leading-tight sm:text-5xl">
              Chercher un logement étudiant au Maroc,
              <br />
              <span className="text-slate-500 dark:text-slate-400">
                c’est souvent un parcours du combattant.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Entre les groupes Facebook, les pages WhatsApp et le
              bouche-à-oreille, beaucoup d’étudiants finissent perdus, fatigués,
              parfois arnaqués. On a voulu que ça change.
            </p>
          </div>

          <AmbientIllustration
            src={ILLUSTRATIONS.warning}
            alt="Étudiant inquiet face aux risques d'arnaque"
            label="Le danger n’est pas seulement le prix."
            caption="C’est l’incertitude : vraie annonce, vraie chambre, vrai propriétaire ?"
            tone="rose"
            imageClassName="max-h-72 home-float-soft"
          />
        </div>

        <div className="mt-14">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {pains.map((p, i) => (
              <RevealOnScroll key={i} delay={i * 90}>
                <div className="group relative h-full rounded-3xl border border-rose-100 bg-white/70 p-6 backdrop-blur-md transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rose-200/40 dark:border-rose-500/10 dark:bg-white/[0.03] dark:hover:shadow-rose-900/20">
                  <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-rose-100 to-orange-100 text-rose-600 dark:from-rose-500/20 dark:to-orange-500/10 dark:text-rose-300">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-[Syne,sans-serif] text-base font-semibold">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {p.text}
                  </p>
                </div>
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 3 — HOW IT CHANGES                                          */
/* ------------------------------------------------------------------ */

function HowItChanges() {
  const steps = [
    {
      n: "01",
      icon: Search,
      title: "Cherche près de ta fac",
      text: "Tape le nom de ton université ou de ton campus. Tu vois ce qui est vraiment autour, pas une liste au hasard.",
    },
    {
      n: "02",
      icon: ShieldCheck,
      title: "Compare en toute confiance",
      text: "Chaque annonce passe par une vérification avant d’apparaître. Tu vois un repère clair pour éviter les mauvaises surprises.",
    },
    {
      n: "03",
      icon: Phone,
      title: "Contacte le propriétaire directement",
      text: "Pas d’intermédiaire, pas de commission. Téléphone ou WhatsApp du vrai propriétaire, point.",
    },
  ];

  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
              Avec UniHome
            </span>
            <h2 className="mt-5 font-[Syne,sans-serif] text-3xl font-bold leading-tight sm:text-5xl">
              Trois étapes simples,
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-violet-300">
                zéro angoisse.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Tu pars de ton campus, tu compares les annonces sérieuses, puis tu
              contactes directement le propriétaire. Simple, lisible, sans
              détour.
            </p>
          </div>

          <AmbientIllustration
            src={ILLUSTRATIONS.confirmed}
            alt="Annonce confirmée après contrôle UniHome"
            label="Chaque étape enlève une couche de doute."
            caption="Chercher, comparer, contacter : l’information devient plus claire."
            tone="emerald"
            delay={120}
            imageClassName="max-h-64 home-float-side"
          />
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <RevealOnScroll key={i} delay={i * 120}>
              <div className="relative h-full overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-200/40 dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-indigo-900/30">
                <div className="absolute -right-4 -top-6 font-[Syne,sans-serif] text-7xl font-bold text-indigo-100 dark:text-white/5">
                  {s.n}
                </div>
                <div className="relative">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/30">
                    <s.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-[Syne,sans-serif] text-xl font-semibold">
                    {s.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                    {s.text}
                  </p>
                </div>
              </div>
            </RevealOnScroll>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 4 — CONFIDENCE INDEX                                        */
/* ------------------------------------------------------------------ */

function ConfidenceIndex() {
  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-5xl text-center">
          <span className="inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            L’indice de confiance
          </span>
          <h2 className="mt-5 font-[Syne,sans-serif] text-3xl font-bold leading-tight sm:text-5xl lg:text-[3.25rem]">
            Un repère simple,
            <br />
            <span className="bg-gradient-to-r from-emerald-500 via-indigo-600 to-violet-600 bg-clip-text text-transparent sm:whitespace-nowrap">
              pour éviter les mauvaises surprises.
            </span>
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
            Chaque annonce reçoit une note de 0 à 100. Ce n’est pas magique :
            c’est juste un moyen clair de te dire à quel point une annonce
            semble sérieuse. Plus c’est haut, plus tu peux y aller sereinement.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-2">
          {/* Decision side */}
          <div className="flex">
            <div className="grid w-full gap-4 lg:min-h-[410px] lg:grid-rows-3">
              <ConfidenceRow
                color="emerald"
                range="70 – 100"
                label="Annonce sérieuse"
                desc="Propriétaire identifié, photos cohérentes, infos claires."
              />
              <ConfidenceRow
                color="amber"
                range="40 – 69"
                label="À vérifier avec attention"
                desc="Quelques éléments manquent. Pose des questions avant de visiter."
              />
              <ConfidenceRow
                color="rose"
                range="0 – 39"
                label="Suspecte ou écartée"
                desc="Photos douteuses, infos floues. On préfère te prévenir."
              />
            </div>
          </div>

          {/* Visual side — score gauge */}
          <div className="relative flex">
            <div className="relative flex w-full flex-col justify-center rounded-[2.5rem] border border-white/50 bg-white/70 p-7 shadow-2xl shadow-indigo-500/20 backdrop-blur-2xl sm:p-8 lg:min-h-[410px] dark:border-white/10 dark:bg-white/[0.04]">
              <ScoreGauge value={92} />

              <div className="mx-auto mt-6 w-full max-w-sm space-y-3">
                <MiniLine ok text="Identité du propriétaire confirmée (CIN)" />
                <MiniLine ok text="Photos originales, prises sur place" />
                <MiniLine
                  ok
                  text="Prix et adresse cohérents avec le quartier"
                />
                <MiniLine
                  warn
                  text="Aucun signalement de la part des étudiants"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/score-rejet"
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-100 bg-white/60 px-4 py-2 text-sm font-semibold text-indigo-600 backdrop-blur hover:bg-white hover:shadow-lg hover:shadow-indigo-200/30 dark:border-white/10 dark:bg-white/[0.05] dark:text-indigo-300 dark:hover:bg-white/[0.08]"
          >
            Comprendre les annonces écartées
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function ConfidenceRow({ color, range, label, desc }) {
  const palette = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-500/10",
      border: "border-emerald-200 dark:border-emerald-500/20",
      dot: "bg-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-500/10",
      border: "border-amber-200 dark:border-amber-500/20",
      dot: "bg-amber-500",
      text: "text-amber-700 dark:text-amber-300",
    },
    rose: {
      bg: "bg-rose-50 dark:bg-rose-500/10",
      border: "border-rose-200 dark:border-rose-500/20",
      dot: "bg-rose-500",
      text: "text-rose-700 dark:text-rose-300",
    },
  }[color];

  return (
    <div
      className={`flex h-full items-center gap-4 rounded-[1.5rem] border ${palette.border} ${palette.bg} p-5 shadow-sm backdrop-blur`}
    >
      <span className={`mt-1.5 h-3 w-3 shrink-0 rounded-full ${palette.dot}`} />
      <div className="flex-1">
        <div className="flex items-center justify-between gap-3">
          <span
            className={`font-[Syne,sans-serif] font-semibold ${palette.text}`}
          >
            {label}
          </span>
          <span
            className={`font-[JetBrains_Mono,monospace] text-xs font-medium ${palette.text}`}
          >
            {range}
          </span>
        </div>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {desc}
        </p>
      </div>
    </div>
  );
}

function ScoreGauge({ value = 92 }) {
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative mx-auto h-56 w-56">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="gradGauge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-slate-200 dark:text-white/10"
        />
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="url(#gradGauge)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-[Syne,sans-serif] text-5xl font-bold text-emerald-600 dark:text-emerald-300">
          {value}
        </span>
        <span className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          / 100 · annonce sérieuse
        </span>
      </div>
    </div>
  );
}

function MiniLine({ ok, warn, text }) {
  const Icon = ok ? CheckCircle2 : warn ? AlertTriangle : XCircle;
  const cls = ok
    ? "text-emerald-600 dark:text-emerald-400"
    : warn
      ? "text-amber-600 dark:text-amber-400"
      : "text-rose-600 dark:text-rose-400";
  return (
    <div className="flex items-start gap-2.5 text-sm">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${cls}`} />
      <span className="text-slate-700 dark:text-slate-200">{text}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 5 — AUDIENCE SPLIT                                          */
/* ------------------------------------------------------------------ */

function AudienceSplit({ audience, setAudience }) {
  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[Syne,sans-serif] text-3xl font-bold leading-tight sm:text-5xl">
            Étudiant ou propriétaire,
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent dark:from-indigo-300 dark:to-pink-300">
              on a pensé à toi.
            </span>
          </h2>
        </div>

        {/* Tabs */}
        <div className="mx-auto mt-10 flex w-fit gap-1 rounded-2xl border border-white/60 bg-white/70 p-1.5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.05]">
          <TabBtn
            active={audience === "etudiant"}
            onClick={() => setAudience("etudiant")}
            icon={GraduationCap}
            label="Je suis étudiant"
          />
          <TabBtn
            active={audience === "proprietaire"}
            onClick={() => setAudience("proprietaire")}
            icon={Key}
            label="Je suis propriétaire"
          />
        </div>

        {/* Content */}
        <div className="mt-10">
          {audience === "etudiant" ? <StudentPanel /> : <OwnerPanel />}
        </div>
      </div>
    </section>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition sm:px-5 ${
        active
          ? "bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/30"
          : "text-slate-600 hover:text-indigo-700 dark:text-slate-300 dark:hover:text-indigo-200"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StudentPanel() {
  const items = [
    {
      icon: MapPin,
      title: "Cherche autour de ta fac",
      text: "Choisis ton université, vois ce qui est vraiment à pied ou à 10 minutes.",
    },
    {
      icon: Eye,
      title: "Vois ce que tu vas visiter",
      text: "Photos contrôlées, prix lisible, infos claires. Moins de mauvaises surprises sur place.",
    },
    {
      icon: Phone,
      title: "Contact direct, sans middleman",
      text: "Le numéro ou le WhatsApp du vrai propriétaire. C’est toi qui décides.",
    },
    {
      icon: MessageCircle,
      title: "Un assistant si tu hésites",
      text: "Une question sur une annonce, un quartier, un loyer ? Notre assistant te guide.",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
                <it.icon className="h-5 w-5" />
              </div>
              <h4 className="font-[Syne,sans-serif] font-semibold">
                {it.title}
              </h4>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                {it.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-[Syne,sans-serif] font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
          >
            <Search className="h-4 w-4" />
            Lancer ma recherche
          </Link>
          <Link
            to="/chatbot"
            className="inline-flex items-center gap-2 rounded-2xl border border-indigo-200/60 bg-white/70 px-6 py-3 font-[Syne,sans-serif] font-semibold text-indigo-700 backdrop-blur-md hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-indigo-200 dark:hover:bg-white/10"
          >
            <MessageCircle className="h-4 w-4" />
            Parler à l’assistant
          </Link>
        </div>
      </div>

      {/* Quote / Reassurance card */}
      <div className="lg:col-span-2">
        <div className="relative h-full overflow-hidden rounded-3xl border border-indigo-200/40 bg-gradient-to-br from-indigo-600 via-violet-600 to-pink-500 p-7 text-white shadow-2xl shadow-indigo-500/30">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-pink-300/20 blur-3xl" />
          <img
            src={ILLUSTRATIONS.studying}
            alt="Étudiante sereine"
            className="home-float-soft pointer-events-none absolute -bottom-8 -right-8 w-36 opacity-25 sm:w-44"
            loading="lazy"
          />
          <Heart className="h-7 w-7 text-pink-200" />
          <p className="mt-4 font-[Syne,sans-serif] text-2xl font-semibold leading-snug">
            « Chercher un logement, c’est déjà stressant. On ne veut pas en
            rajouter. »
          </p>
          <p className="mt-4 text-sm leading-relaxed text-indigo-100">
            UniHome ne signe pas de contrat, ne prend pas ton argent, ne se met
            pas entre toi et le propriétaire. On t’aide juste à voir plus clair,
            à comparer sans peur, et à choisir en confiance.
          </p>
        </div>
      </div>
    </div>
  );
}

function OwnerPanel() {
  const items = [
    {
      icon: Home,
      title: "Publie en quelques minutes",
      text: "Quelques photos, un prix, une adresse. Ton annonce est en ligne, simplement.",
    },
    {
      icon: BadgeCheck,
      title: "Prouve que tu es sérieux",
      text: "Vérifie ton identité avec ta CIN. Les étudiants voient tout de suite que tu es un vrai propriétaire.",
    },
    {
      icon: GraduationCap,
      title: "Touche les étudiants de ton quartier",
      text: "Si ton bien est près d’un campus, il sera proposé aux étudiants qui le cherchent.",
    },
    {
      icon: Sparkles,
      title: "Zéro commission, zéro agence",
      text: "Tu gardes 100% de ton loyer. Pas d’intermédiaire, pas de frais cachés.",
    },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3 order-2 lg:order-1">
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((it, i) => (
            <div
              key={i}
              className="rounded-2xl border border-white/60 bg-white/70 p-5 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-300">
                <it.icon className="h-5 w-5" />
              </div>
              <h4 className="font-[Syne,sans-serif] font-semibold">
                {it.title}
              </h4>
              <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">
                {it.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/register?role=PROPRIETAIRE"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 px-6 py-3 font-[Syne,sans-serif] font-semibold text-white shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
          >
            <Key className="h-4 w-4" />
            Publier mon logement
          </Link>
          <Link
            to="/annonces"
            className="inline-flex items-center gap-2 rounded-2xl border border-violet-200/60 bg-white/70 px-6 py-3 font-[Syne,sans-serif] font-semibold text-violet-700 backdrop-blur-md hover:bg-white dark:border-white/10 dark:bg-white/5 dark:text-violet-200 dark:hover:bg-white/10"
          >
            <Eye className="h-4 w-4" />
            Voir des exemples
          </Link>
        </div>
      </div>

      {/* Owner reassurance card */}
      <div className="lg:col-span-2 order-1 lg:order-2">
        <div className="relative h-full overflow-hidden rounded-3xl border border-violet-200/40 bg-gradient-to-br from-violet-600 via-indigo-600 to-indigo-700 p-7 text-white shadow-2xl shadow-violet-500/30">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-pink-400/20 blur-3xl" />
          <img
            src={ILLUSTRATIONS.apartmentRent}
            alt="Appartement à louer pour étudiants"
            className="home-float-side pointer-events-none absolute -bottom-10 -right-10 w-44 opacity-25"
            loading="lazy"
          />
          <BadgeCheck className="h-7 w-7 text-emerald-200" />
          <p className="mt-4 font-[Syne,sans-serif] text-2xl font-semibold leading-snug">
            « Vous êtes un vrai propriétaire. On veut que ça se voie. »
          </p>
          <p className="mt-4 text-sm leading-relaxed text-violet-100">
            En vérifiant votre identité, vous gagnez la confiance des étudiants
            sérieux. Vos annonces remontent, vos visites sont plus utiles, et
            vous évitez les pertes de temps.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 6 — NEAR CAMPUS                                             */
/* ------------------------------------------------------------------ */

function NearCampus() {
  const campuses = [
    "Université Mohammed V · Rabat",
    "Université Hassan II · Casablanca",
    "Université Cadi Ayyad · Marrakech",
    "Université Sidi Mohamed Ben Abdellah · Fès",
    "Université Abdelmalek Essaâdi · Tétouan",
    "ENSA · Agadir",
    "ENCG · Settat",
    "Université Ibn Zohr · Agadir",
  ];

  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_0.85fr]">
          <div>
            <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">
              Près de ton campus
            </span>
            <h2 className="mt-5 font-[Syne,sans-serif] text-3xl font-bold leading-tight sm:text-5xl">
              On cherche autour de
              <br />
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-violet-300">
                ta vraie vie d’étudiant.
              </span>
            </h2>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Pas juste « à Casa » ou « à Rabat ». Tu choisis ta fac ou ton
              école, et on te montre ce qui est à pied, en tram, ou à quelques
              minutes en taxi. Parce qu’habiter à 1 heure de cours, c’est non.
            </p>

            <Link
              to="/search"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-3 font-[Syne,sans-serif] font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              <MapPin className="h-4 w-4" />
              Chercher autour de ma fac
            </Link>
          </div>

          <AmbientIllustration
            src={ILLUSTRATIONS.campusCuate}
            alt="Campus universitaire marocain"
            label="Le campus devient le point de départ."
            caption="La recherche se lit autour de tes trajets réels, pas seulement autour d’une ville."
            tone="indigo"
            delay={100}
            imageClassName="max-h-72 home-float-soft"
          />
        </div>

        <div className="mt-12">
          <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/70 p-6 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04]">
            <img
              src={ILLUSTRATIONS.campusAmico}
              alt="Vie autour du campus"
              className="home-float-side pointer-events-none absolute -right-8 -top-12 w-52 opacity-20 dark:opacity-15"
              loading="lazy"
            />
            <div className="relative mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <GraduationCap className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
              Quelques campus déjà couverts
            </div>
            <div className="relative grid gap-2">
              {campuses.map((c, i) => (
                <RevealOnScroll key={i} delay={i * 45}>
                  <Link
                    to="/search"
                    className="group flex items-center justify-between rounded-xl border border-transparent bg-white/40 px-4 py-3 text-sm text-slate-700 transition hover:border-indigo-200 hover:bg-white dark:bg-white/[0.03] dark:text-slate-200 dark:hover:border-indigo-400/30 dark:hover:bg-white/[0.06]"
                  >
                    <span className="flex items-center gap-2.5">
                      <MapPin className="h-3.5 w-3.5 text-indigo-500" />
                      {c}
                    </span>
                    <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-300" />
                  </Link>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 7 — BOUNDARIES (what we are / are not)                      */
/* ------------------------------------------------------------------ */

function Boundaries() {
  const does = [
    "On rassemble des annonces contrôlées, pensées pour étudiants.",
    "On donne un repère clair pour repérer les annonces sérieuses.",
    "On laisse étudiants et propriétaires se parler directement.",
    "On accepte les signalements pour retirer les annonces louches.",
  ];

  const doesnt = [
    "UniHome n’est pas une agence immobilière.",
    "On ne reçoit jamais ton loyer, ni ta caution.",
    "On ne signe pas de contrat à ta place.",
    "On ne prend aucune commission.",
  ];

  return (
    <section className="relative px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-[Syne,sans-serif] text-3xl font-bold leading-tight sm:text-5xl">
            On préfère être
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-indigo-300 dark:to-violet-300">
              honnêtes avec toi.
            </span>
          </h2>
          <p className="mt-4 text-base text-slate-600 sm:text-lg dark:text-slate-300">
            Voici ce que UniHome est… et ce qu’il n’est pas.
          </p>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          <BoundaryColumn
            icon={CheckCircle2}
            title="Ce qu’on fait"
            items={does}
            tone="emerald"
          />
          <BoundaryColumn
            icon={XCircle}
            title="Ce qu’on n’est pas"
            items={doesnt}
            tone="slate"
            delay={120}
          />
        </div>
      </div>
    </section>
  );
}

function BoundaryColumn({ icon: Icon, title, items, tone, delay = 0 }) {
  const isPositive = tone === "emerald";

  return (
    <RevealOnScroll delay={delay}>
      <div
        className={`relative h-full overflow-hidden rounded-[2rem] border p-7 shadow-2xl backdrop-blur-xl sm:p-8 ${
          isPositive
            ? "border-emerald-100/80 bg-emerald-50/70 shadow-emerald-200/30 dark:border-emerald-500/15 dark:bg-emerald-500/[0.06] dark:shadow-emerald-950/20"
            : "border-slate-200/80 bg-white/70 shadow-indigo-200/25 dark:border-white/10 dark:bg-white/[0.04] dark:shadow-indigo-950/20"
        }`}
      >
        <div
          className={`absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl ${
            isPositive
              ? "bg-emerald-300/25"
              : "bg-slate-300/25 dark:bg-white/10"
          }`}
        />
        <div className="relative flex items-center gap-4 border-b border-slate-200/70 pb-5 dark:border-white/10">
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-xl ${
              isPositive
                ? "bg-emerald-500 shadow-emerald-500/25"
                : "bg-slate-950 shadow-slate-900/15 dark:bg-white/15"
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <h3
            className={`font-[Syne,sans-serif] text-xl font-semibold ${
              isPositive
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-slate-800 dark:text-slate-100"
            }`}
          >
            {title}
          </h3>
        </div>

        <div className="relative divide-y divide-slate-200/60 dark:divide-white/10">
          {items.map((item, index) => (
            <div key={item} className="grid grid-cols-[44px_1fr] gap-3 py-5">
              <span
                className={`font-[JetBrains_Mono,monospace] text-xs font-bold ${
                  isPositive ? "text-emerald-500" : "text-slate-400"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-sm leading-relaxed text-slate-700 sm:text-base dark:text-slate-200">
                {item}
              </p>
            </div>
          ))}
        </div>
      </div>
    </RevealOnScroll>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 8 — COMMUNITY                                               */
/* ------------------------------------------------------------------ */

function Community() {
  const steps = [
    {
      icon: Flag,
      value: "Signaler",
      label: "tu nous indiques l’annonce qui te semble suspecte",
      tone: "rose",
    },
    {
      icon: ShieldCheck,
      value: "Vérifier",
      label: "l’équipe relit les infos, les photos et les éléments disponibles",
      tone: "emerald",
    },
    {
      icon: AlertTriangle,
      value: "Agir",
      label: "si l’annonce pose problème, elle est bloquée ou retirée",
      tone: "indigo",
    },
  ];

  return (
    <section className="relative overflow-hidden px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
      <div className="home-morph-blob pointer-events-none absolute -right-28 top-10 h-96 w-96 bg-pink-200/35 blur-3xl dark:bg-pink-500/10" />
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[320px]">
          <div className="absolute inset-0 rounded-[45%_55%_52%_48%/52%_43%_57%_48%] bg-gradient-to-br from-indigo-100 via-white to-pink-100 opacity-80 blur-sm dark:from-indigo-900/20 dark:via-white/[0.03] dark:to-pink-900/20" />
          <img
            src={ILLUSTRATIONS.collegeStudents}
            alt="Communauté d'étudiants UniHome"
            className="home-float-soft pointer-events-none relative mx-auto h-[320px] w-full object-contain drop-shadow-2xl"
            loading="lazy"
          />
        </div>

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
            <Users className="h-3.5 w-3.5" />
            Signalement d’annonce
          </div>
          <h2 className="mt-5 font-[Syne,sans-serif] text-3xl font-bold leading-tight sm:text-5xl">
            Si une annonce te semble louche,
            <br />
            <span className="bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent dark:from-indigo-300 dark:to-pink-300">
              un seul clic suffit.
            </span>
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
            Tu signales l’annonce. L’équipe UniHome vérifie les éléments et
            intervient si quelque chose ne colle pas. Simple, utile, sans
            compliquer la recherche.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {steps.map((step, index) => (
              <RevealOnScroll key={step.value} delay={index * 80}>
                <SignalStepCard step={step} index={index} />
              </RevealOnScroll>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SignalStepCard({ step, index }) {
  const Icon = step.icon;
  const styles = {
    rose: {
      icon: "bg-rose-50 text-rose-500 ring-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/20",
      line: "from-rose-400 to-pink-500",
    },
    emerald: {
      icon: "bg-emerald-50 text-emerald-500 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
      line: "from-emerald-400 to-teal-500",
    },
    indigo: {
      icon: "bg-indigo-50 text-indigo-500 ring-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/20",
      line: "from-indigo-400 to-violet-500",
    },
  }[step.tone];

  return (
    <div className="group relative h-full overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/75 p-5 shadow-xl shadow-indigo-500/5 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10 dark:border-white/10 dark:bg-white/[0.04]">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${styles.line}`}
      />
      <div className="flex items-start justify-between gap-3">
        <span className="font-[JetBrains_Mono,monospace] text-xs font-semibold text-slate-400">
          0{index + 1}
        </span>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ring-1 ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <h3 className="mt-5 font-[Syne,sans-serif] text-xl font-bold text-slate-950 dark:text-white">
        {step.value}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
        {step.label}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* SECTION 9 — FINAL CTA                                               */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="relative px-5 py-24 sm:px-8 sm:py-32 lg:px-12">
      <div className="mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-700 via-violet-700 to-pink-600 p-10 text-center text-white shadow-2xl shadow-indigo-500/40 sm:p-16">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-pink-300/20 blur-3xl" />
          <img
            src={ILLUSTRATIONS.apartmentRent}
            alt="Appartement étudiant disponible"
            className="home-float-side pointer-events-none absolute -bottom-16 -right-10 hidden w-64 opacity-25 md:block lg:w-80"
            loading="lazy"
          />

          <div className="relative">
            <h2 className="font-[Syne,sans-serif] text-3xl font-bold leading-tight sm:text-5xl">
              Ton prochain chez-toi étudiant
              <br />
              n’est plus une loterie.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-indigo-100 sm:text-lg">
              Commence à chercher autour de ta fac, ou publie ton logement si tu
              es propriétaire. C’est gratuit, c’est clair, c’est fait pour nous.
            </p>

            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to="/search"
                className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 font-[Syne,sans-serif] text-base font-semibold text-indigo-700 shadow-lg transition hover:shadow-xl sm:w-auto"
              >
                <Search className="h-5 w-5" />
                Je cherche un logement
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
              </Link>
              <Link
                to="/register?role=PROPRIETAIRE"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-7 py-4 font-[Syne,sans-serif] text-base font-semibold text-white backdrop-blur-md transition hover:bg-white/20 sm:w-auto"
              >
                <Key className="h-5 w-5" />
                Je publie mon logement
              </Link>
            </div>

            <p className="mt-7 text-sm text-indigo-100">
              Pas de commission · Pas d’intermédiaire · Pensé au Maroc, pour les
              étudiants marocains.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
