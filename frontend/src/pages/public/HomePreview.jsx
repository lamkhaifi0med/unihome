import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  MapPin,
  MessageCircle,
  Phone,
  ArrowRight,
  ArrowUpRight,
  Check,
  X,
  BadgeCheck,
  GraduationCap,
  Camera,
  FileCheck2,
  Flag,
  Home,
  KeyRound,
  Banknote,
  Sparkles,
} from "lucide-react";
import {
  HeroBuddy,
  StressedSearch,
  BotMascot,
  StudentMini,
  OwnerMini,
  CelebrateMoveIn,
  PlantPot,
} from "./homeScenes";

/*
  UniHome — Homepage ("Soft-depth SaaS", electric blue on near-white)
  Direction contract lives in index.html <body>. No seed/demo data:
  every visual below is an abstract, synthetic mockup, and the human
  moments are Storyset-style characters (see homeScenes.jsx).
*/

/* ------------------------------------------------------------------ */
/* Motion utilities                                                    */
/* ------------------------------------------------------------------ */

function useReveal(threshold = 0.18) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, shown];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, shown] = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out will-change-transform ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/** Primary CTA with a magnetic hover pull (desktop pointer only). */
function MagneticLink({ to, className = "", children }) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    el.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  };

  const onLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "translate(0, 0)";
  };

  return (
    <Link
      ref={ref}
      to={to}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`transition-transform duration-200 ease-out ${className}`}
    >
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePreview() {
  return (
    <div className="relative isolate overflow-hidden bg-[#fafafa] font-geist text-zinc-950 dark:bg-zinc-950 dark:text-zinc-50">
      <PageStyles />
      <Hero />
      <PainStrip />
      <PipelineBand />
      <FeatureBento />
      <AudienceSplit />
      <Honesty />
      <FinalCTA />
    </div>
  );
}

function PageStyles() {
  return (
    <style>{`
      @keyframes uh-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      @keyframes uh-ring {
        0% { transform: scale(0.75); opacity: 0.55; }
        100% { transform: scale(1.35); opacity: 0; }
      }
      .uh-ring { animation: uh-ring 3.2s ease-out infinite; }
      .uh-caret { animation: uh-blink 1.1s step-end infinite; }
      .uh-dotgrid {
        background-image: radial-gradient(circle, rgba(9,9,11,0.10) 1px, transparent 1px);
        background-size: 22px 22px;
      }
      .dark .uh-dotgrid {
        background-image: radial-gradient(circle, rgba(250,250,250,0.09) 1px, transparent 1px);
      }

      /* --- character rigging (homeScenes.jsx) --- */
      @keyframes uh-eyelid {
        0%, 94%, 100% { transform: scaleY(1); }
        97% { transform: scaleY(0.08); }
      }
      .uh-blink { animation: uh-eyelid 4.6s ease-in-out infinite; }
      @keyframes uh-wave {
        0%, 74%, 100% { transform: rotate(0deg); }
        80% { transform: rotate(-14deg); }
        86% { transform: rotate(10deg); }
        92% { transform: rotate(-10deg); }
      }
      .uh-wave-arm { animation: uh-wave 5.4s ease-in-out infinite; }
      .uh-wave-hover { transition: transform 300ms ease; }
      .group:hover .uh-wave-hover { animation: uh-wave 1.2s ease-in-out; animation-iteration-count: 2; }
      @keyframes uh-float {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-7px); }
      }
      .uh-float { animation: uh-float 3.4s ease-in-out infinite; }
      @keyframes uh-hop {
        0%, 100% { transform: translateY(0); }
        45% { transform: translateY(-9px); }
      }
      .uh-hop { animation: uh-hop 2.4s cubic-bezier(0.34,1.3,0.5,1) infinite; }
      @keyframes uh-swingkey {
        0%, 100% { transform: rotate(-8deg); }
        50% { transform: rotate(8deg); }
      }
      .uh-swing { animation: uh-swingkey 2.4s ease-in-out infinite; }
      @keyframes uh-sway {
        0%, 100% { transform: rotate(-2.5deg); }
        50% { transform: rotate(2.5deg); }
      }
      .uh-sway { animation: uh-sway 4.2s ease-in-out infinite; }
      @keyframes uh-pulsedot {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }
      .uh-pulse-dot { animation: uh-pulsedot 1.6s ease-in-out infinite; }

      @media (prefers-reduced-motion: reduce) {
        .uh-ring, .uh-caret, .uh-blink, .uh-wave-arm, .uh-float,
        .uh-hop, .uh-swing, .uh-sway, .uh-pulse-dot { animation: none; }
        .group:hover .uh-wave-hover { animation: none; }
      }
    `}</style>
  );
}

/* ------------------------------------------------------------------ */
/* 1. HERO                                                             */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section className="relative px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
      {/* Dot grid ground + single blue bloom */}
      <div className="uh-dotgrid pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,black,transparent)]" />
      <div className="pointer-events-none absolute left-1/2 top-[-12rem] -z-10 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl dark:bg-blue-500/10" />

      <div className="mx-auto max-w-5xl text-center">
        <Reveal>
          <h1 className="mx-auto max-w-4xl text-balance text-[2.6rem] font-bold leading-[1.04] tracking-[-0.03em] sm:text-6xl lg:text-[4.4rem]">
            Trouver un logement étudiant sans stress,{" "}
            <span className="text-blue-600 dark:text-blue-400">
              sans arnaque.
            </span>
          </h1>
        </Reveal>

        <Reveal delay={90}>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
            Des annonces contrôlées, une recherche autour de{" "}
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              ton campus
            </strong>
            , un contact direct avec le vrai propriétaire. Sans commission.
          </p>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MagneticLink
              to="/search"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] hover:bg-blue-700 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              Chercher mon logement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </MagneticLink>
            <Link
              to="/register?role=PROPRIETAIRE"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-7 py-3.5 text-[15px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              <Home className="h-4 w-4" />
              Je suis propriétaire
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            Déjà inscrit ?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Se connecter
            </Link>
          </p>
        </Reveal>

        {/* Abstract verification mock — 100% synthetic */}
        <Reveal delay={240}>
          <HeroMock />
        </Reveal>
      </div>
    </section>
  );
}

/** Annonce → contrôle → verdict, as an abstract product frame. */
function HeroMock() {
  const [ref, verified] = useReveal(0.45);

  return (
    <div ref={ref} className="relative mx-auto mt-16 max-w-4xl">
      <div className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-[0_24px_60px_-30px_rgba(9,9,11,0.25)] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-[0_24px_60px_-30px_rgba(0,0,0,0.8)]">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-200 dark:bg-zinc-700" />
          <span className="ml-3 hidden rounded-md bg-zinc-100 px-2.5 py-1 font-mono text-[10px] text-zinc-500 sm:inline dark:bg-zinc-800 dark:text-zinc-400">
            unihome.ma — contrôle avant publication
          </span>
        </div>

        <div className="grid gap-2 rounded-xl bg-zinc-50 p-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center dark:bg-zinc-950">
          {/* Generic listing skeleton */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex h-24 items-center justify-center rounded-md bg-zinc-100 dark:bg-zinc-800">
              <Camera className="h-6 w-6 text-zinc-300 dark:text-zinc-600" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="h-2.5 w-3/4 rounded-full bg-zinc-200 dark:bg-zinc-700" />
              <div className="h-2.5 w-1/2 rounded-full bg-zinc-100 dark:bg-zinc-800" />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="h-2.5 w-16 rounded-full bg-zinc-100 dark:bg-zinc-800" />
              <span className="font-mono text-[10px] text-zinc-400 dark:text-zinc-500">
                nouvelle annonce
              </span>
            </div>
          </div>

          {/* Pipeline arrow */}
          <div className="flex items-center justify-center py-1 sm:flex-col sm:gap-1.5 sm:px-2">
            <span className="hidden font-mono text-[10px] uppercase tracking-wider text-zinc-400 sm:block dark:text-zinc-500">
              analyse
            </span>
            <ArrowRight className="h-5 w-5 rotate-90 text-blue-600 sm:rotate-0 dark:text-blue-400" />
            <span className="hidden font-mono text-[10px] text-zinc-400 sm:block dark:text-zinc-500">
              5 critères
            </span>
          </div>

          {/* Verdict card — the checks resolve in sequence, the badge lands last */}
          <div className="rounded-lg border border-zinc-200 bg-white p-4 text-left dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 transition-all duration-500 ease-out dark:bg-emerald-500/10 dark:text-emerald-400"
                style={{
                  opacity: verified ? 1 : 0,
                  transform: verified ? "scale(1)" : "scale(0.85)",
                  transitionDelay: "1150ms",
                }}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Vérifiée
              </span>
              <span className="font-mono text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                score ≥ 70
              </span>
            </div>
            <ul className="mt-3 space-y-2">
              {[
                "Justificatif de propriété",
                "Photos analysées par IA",
                "Prix cohérent avec le quartier",
              ].map((item, i) => (
                <li key={item} className="flex items-center gap-2 text-xs">
                  <span className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
                    <span
                      className="absolute h-1.5 w-1.5 rounded-full bg-zinc-300 transition-opacity duration-200 dark:bg-zinc-600"
                      style={{
                        opacity: verified ? 0 : 1,
                        transitionDelay: `${350 + i * 260}ms`,
                      }}
                    />
                    <Check
                      className="h-3.5 w-3.5 text-emerald-600 transition-all duration-300 ease-out dark:text-emerald-400"
                      style={{
                        opacity: verified ? 1 : 0,
                        transform: verified ? "scale(1)" : "scale(0.4)",
                        transitionDelay: `${350 + i * 260}ms`,
                      }}
                    />
                  </span>
                  <span
                    className="text-zinc-600 transition-opacity duration-300 dark:text-zinc-400"
                    style={{
                      opacity: verified ? 1 : 0.5,
                      transitionDelay: `${350 + i * 260}ms`,
                    }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <p
              className="mt-3 border-t border-zinc-100 pt-2.5 text-xs text-zinc-500 transition-opacity duration-500 dark:border-zinc-800 dark:text-zinc-400"
              style={{
                opacity: verified ? 1 : 0.35,
                transitionDelay: "1300ms",
              }}
            >
              Publiée automatiquement — visible par les étudiants.
            </p>
          </div>
        </div>
      </div>

      {/* Floating proof chips */}
      <div className="pointer-events-none absolute -left-6 top-10 hidden rotate-[-4deg] items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md lg:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <BadgeCheck className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        Identité CIN vérifiée
      </div>
      <div className="pointer-events-none absolute -bottom-4 right-6 hidden rotate-[3deg] items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-md lg:flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        <GraduationCap className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
        À 8 min de ton campus
      </div>

      {/* Student buddy leaning on the frame — eyes follow the cursor,
          waves every few seconds */}
      <HeroBuddy className="pointer-events-none absolute -right-36 bottom-0 hidden w-40 xl:block" />
      <PlantPot className="pointer-events-none absolute -left-[4.7rem] bottom-0 hidden w-16 xl:block" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* 2. PAIN STRIP                                                       */
/* ------------------------------------------------------------------ */

function PainStrip() {
  const pains = [
    "Fausses annonces avec des photos volées.",
    "Avance demandée avant même la visite.",
    "Groupes WhatsApp chaotiques.",
    "Visites pour rien à l'autre bout de la ville.",
  ];

  return (
    <section className="border-y border-zinc-200 bg-white px-5 py-20 sm:px-8 sm:py-24 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto grid max-w-6xl items-start gap-12 lg:grid-cols-[1fr_1.1fr]">
        <Reveal>
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
            Chercher une chambre au Maroc, aujourd'hui, c'est ça.
          </h2>
          <p className="mt-4 max-w-md text-pretty leading-relaxed text-zinc-600 dark:text-zinc-400">
            Entre les groupes Facebook et les intermédiaires flous, des
            étudiants perdent du temps — et parfois de l'argent. On a voulu que
            ça change.
          </p>
          {/* Perdu·e sur sa valise, annonce louche en main */}
          <StressedSearch className="mx-auto mt-8 w-full max-w-[17rem] sm:max-w-sm lg:mx-0" />
        </Reveal>

        <div className="space-y-3">
          {pains.map((pain, i) => (
            <Reveal key={pain} delay={i * 80}>
              <div className="group flex items-center gap-4 rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4 transition-colors hover:border-red-200 hover:bg-red-50/60 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-red-500/30 dark:hover:bg-red-500/5">
                <X className="h-4 w-4 shrink-0 text-red-500" />
                <p className="text-[15px] font-medium text-zinc-700 transition-colors group-hover:text-zinc-900 dark:text-zinc-300 dark:group-hover:text-zinc-100">
                  {pain}
                </p>
              </div>
            </Reveal>
          ))}
          <Reveal delay={360}>
            <div className="flex items-center gap-4 rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-500/30 dark:bg-blue-500/10">
              <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
              <p className="text-[15px] font-semibold text-blue-900 dark:text-blue-200">
                UniHome contrôle chaque annonce avant qu'elle ne t'atteigne.
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 3. DARK PIPELINE BAND (the authored moment)                         */
/* ------------------------------------------------------------------ */

const CRITERIA = [
  { label: "justificatif de propriété", weight: 35 },
  { label: "photos — analyse IA multimodale", weight: 20 },
  { label: "cohérence du prix", weight: 20 },
  { label: "description", weight: 15 },
  { label: "cohérence globale", weight: 10 },
];

function PipelineBand() {
  const [ref, shown] = useReveal(0.3);

  return (
    <section className="bg-zinc-950 px-5 py-24 text-zinc-50 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div>
            <Reveal>
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
                Chaque annonce passe au contrôle{" "}
                <span className="text-blue-400">avant</span> d'apparaître.
              </h2>
              <p className="mt-5 max-w-lg text-pretty leading-relaxed text-zinc-400">
                Une IA multimodale analyse les photos et le justificatif de
                propriété, croisés avec des règles strictes qui ne peuvent que
                baisser le score. Le résultat : un score de confiance de 0 à
                100, calculé sur 5 critères pondérés.
              </p>
            </Reveal>

            <Reveal delay={120}>
              <div className="mt-8 space-y-3">
                {[
                  {
                    icon: ShieldCheck,
                    tone: "text-emerald-400",
                    range: "score ≥ 70",
                    verdict: "Publiée automatiquement",
                  },
                  {
                    icon: FileCheck2,
                    tone: "text-amber-400",
                    range: "40 – 69",
                    verdict: "Revue par l'équipe avant publication",
                  },
                  {
                    icon: Flag,
                    tone: "text-red-400",
                    range: "score < 40",
                    verdict: "Écartée — jamais publiée",
                  },
                ].map((row) => (
                  <div
                    key={row.range}
                    className="flex items-center gap-4 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3"
                  >
                    <row.icon className={`h-4 w-4 shrink-0 ${row.tone}`} />
                    <span className="w-24 shrink-0 font-mono text-sm font-semibold tabular-nums">
                      {row.range}
                    </span>
                    <span className="text-sm text-zinc-400">{row.verdict}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Terminal */}
          <Reveal delay={80}>
            <div
              ref={ref}
              className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-[0_32px_80px_-40px_rgba(37,99,235,0.35)]"
            >
              <div className="flex items-center gap-1.5 border-b border-zinc-800 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="h-2.5 w-2.5 rounded-full bg-zinc-700" />
                <span className="ml-3 font-mono text-[11px] text-zinc-500">
                  unihome-ai — analyse d'annonce
                </span>
              </div>
              <div className="p-5 font-mono text-[13px] leading-relaxed sm:p-6">
                <p className="text-zinc-500">
                  <span className="text-blue-400">$</span> unihome analyse
                  --annonce <span className="text-zinc-300">nouvelle</span>
                </p>
                <div className="mt-4 space-y-3">
                  {CRITERIA.map((c, i) => (
                    <div key={c.label}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="truncate text-zinc-400">
                          {c.label}
                        </span>
                        <span className="shrink-0 tabular-nums text-zinc-200">
                          {c.weight}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                        <div
                          className="h-full origin-left rounded-full bg-blue-500"
                          style={{
                            width: `${c.weight * 2}%`,
                            transform: shown ? "scaleX(1)" : "scaleX(0)",
                            transition: `transform 900ms cubic-bezier(0.16,1,0.3,1) ${200 + i * 140}ms`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-zinc-500">
                  → score de confiance :{" "}
                  <span className="font-semibold text-emerald-400">
                    <CountUp target={87} run={shown} /> / 100
                  </span>
                </p>
                <p className="mt-1 text-zinc-500">
                  → verdict :{" "}
                  <span className="text-emerald-400">VALIDÉE — publiée</span>
                  <span className="uh-caret ml-1 inline-block h-3.5 w-2 translate-y-0.5 bg-zinc-400" />
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function CountUp({ target, run, duration = 1100 }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!run) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return undefined;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, duration]);

  return <span className="tabular-nums">{value}</span>;
}

/* ------------------------------------------------------------------ */
/* 4. FEATURE BENTO                                                    */
/* ------------------------------------------------------------------ */

function FeatureBento() {
  return (
    <section className="px-5 py-24 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="max-w-2xl text-balance text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
            Pensé autour de ton campus, pas autour d'une ville.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Campus radius — large tile */}
          <Reveal className="lg:col-span-2 lg:row-span-2">
            <div className="group relative h-full overflow-hidden rounded-2xl border border-zinc-200 bg-white p-7 transition-shadow hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)] dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xl font-bold tracking-[-0.01em]">
                Tu choisis ta fac. On cherche autour.
              </h3>
              <p className="mt-2 max-w-md text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                Tape le nom de ton université : les logements s'affichent selon
                ta vraie distance — à pied, en tram, en taxi. Parce qu'habiter à
                une heure des cours, c'est non.
              </p>

              {/* Abstract radius map */}
              <div className="uh-dotgrid relative mt-8 h-64 overflow-hidden rounded-xl border border-zinc-100 bg-zinc-50 sm:h-72 dark:border-zinc-800 dark:bg-zinc-950">
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="uh-ring absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500/40" />
                  <div className="uh-ring absolute left-1/2 top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-blue-500/30 [animation-delay:1.1s]" />
                  <div className="relative z-10 flex items-center gap-1.5 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30">
                    <GraduationCap className="h-3.5 w-3.5" />
                    Ton campus
                  </div>
                </div>
                {[
                  { pos: "left-[16%] top-[24%]", label: "6 min" },
                  { pos: "right-[14%] top-[32%]", label: "12 min" },
                  { pos: "left-[26%] bottom-[18%]", label: "9 min" },
                  { pos: "right-[24%] bottom-[14%]", label: "15 min" },
                ].map((pin) => (
                  <div
                    key={pin.pos}
                    className={`absolute ${pin.pos} flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-700 shadow-sm transition-transform duration-300 group-hover:scale-105 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300`}
                  >
                    <MapPin className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                    {pin.label}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* UniBot */}
          <Reveal delay={80}>
            <div className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)] dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-xl font-bold tracking-[-0.01em]">
                  UniBot parle ta langue.
                </h3>
                {/* Mascotte — les pupilles suivent le curseur */}
                <BotMascot className="-mt-1 w-14 shrink-0 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" />
              </div>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                Une question sur une annonce, un quartier, un loyer ?
                L'assistant répond en français, en arabe et en darija.
              </p>
              <div className="mt-5 space-y-2.5">
                <div className="max-w-[85%] rounded-2xl rounded-bl-md bg-zinc-100 px-4 py-2.5 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  bghit chy studio qrib l eniad f berkane
                </div>
                <div className="ml-auto flex max-w-[85%] items-start gap-2 rounded-2xl rounded-br-md bg-blue-600 px-4 py-2.5 text-sm text-white">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  J'ai trouvé plusieurs studios vérifiés à moins de 15 min…
                </div>
              </div>
            </div>
          </Reveal>

          {/* Direct contact */}
          <Reveal delay={140}>
            <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)] dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="text-xl font-bold tracking-[-0.01em]">
                Contact direct, zéro commission.
              </h3>
              <p className="mt-2 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                Le téléphone ou le WhatsApp du vrai propriétaire. Pas
                d'intermédiaire, pas de frais cachés.
              </p>
              <div className="mt-5 flex gap-2.5">
                <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                  <Phone className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  Appeler
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </span>
              </div>
            </div>
          </Reveal>

          {/* Protection */}
          <Reveal delay={100} className="lg:col-span-3">
            <div className="flex flex-col items-start gap-5 rounded-2xl border border-zinc-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)] sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <Flag className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold tracking-[-0.01em]">
                  Et si une annonce te semble louche, signale-la.
                </h3>
                <p className="mt-1 text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">
                  L'équipe relit les infos et les photos. Trois signalements
                  suspendent l'annonce automatiquement — on préfère te prévenir
                  que te laisser tomber dans le piège.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 5. AUDIENCE SPLIT                                                   */
/* ------------------------------------------------------------------ */

function AudienceSplit() {
  return (
    <section className="border-y border-zinc-200 bg-white px-5 py-24 sm:px-8 sm:py-28 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-balance text-center text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
            Étudiant ou propriétaire, chacun son chemin.
          </h2>
        </Reveal>

        <div className="mt-12 grid gap-4 lg:grid-cols-2">
          {/* Students */}
          <Reveal>
            <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-colors hover:border-blue-200 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-blue-500/30">
              {/* salue quand on survole le panneau */}
              <StudentMini className="pointer-events-none absolute -bottom-2 right-5 hidden w-24 sm:block" />
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white">
                <GraduationCap className="h-3.5 w-3.5" />
                Étudiants
              </span>
              <ul className="mt-7 flex-1 space-y-5">
                {[
                  {
                    icon: Search,
                    title: "Cherche autour de ta fac",
                    text: "Choisis ton université, vois ce qui est vraiment à pied ou à dix minutes.",
                  },
                  {
                    icon: ShieldCheck,
                    title: "Compare avec le score de confiance",
                    text: "Photos contrôlées, prix lisible, infos claires. Moins de mauvaises surprises sur place.",
                  },
                  {
                    icon: Phone,
                    title: "Contacte le propriétaire directement",
                    text: "Le numéro ou le WhatsApp du vrai propriétaire. C'est toi qui décides.",
                  },
                ].map((step) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                      <step.icon className="h-[18px] w-[18px] text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/search"
                className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] transition hover:bg-blue-700"
              >
                Lancer ma recherche
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </Reveal>

          {/* Owners */}
          <Reveal delay={100}>
            <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-8 transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700">
              {/* lève sa clé quand on survole le panneau */}
              <OwnerMini className="pointer-events-none absolute -bottom-2 right-5 hidden w-24 sm:block" />
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-zinc-900 px-3.5 py-1.5 text-xs font-bold text-white dark:bg-zinc-100 dark:text-zinc-900">
                <KeyRound className="h-3.5 w-3.5" />
                Propriétaires
              </span>
              <ul className="mt-7 flex-1 space-y-5">
                {[
                  {
                    icon: Camera,
                    title: "Publie en quelques minutes",
                    text: "Quelques photos, un prix, une adresse. Ton annonce est en ligne, simplement.",
                  },
                  {
                    icon: BadgeCheck,
                    title: "Prouve que tu es sérieux",
                    text: "Vérifie ton identité avec ta CIN : les étudiants voient tout de suite que tu es un vrai propriétaire.",
                  },
                  {
                    icon: Banknote,
                    title: "Garde 100 % de ton loyer",
                    text: "Zéro commission, zéro agence. Ton bien est proposé aux étudiants de ton quartier.",
                  },
                ].map((step) => (
                  <li key={step.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                      <step.icon className="h-[18px] w-[18px] text-zinc-700 dark:text-zinc-300" />
                    </div>
                    <div>
                      <p className="font-semibold">{step.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {step.text}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                to="/register?role=PROPRIETAIRE"
                className="group mt-8 inline-flex w-fit items-center gap-2 rounded-full bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Publier mon logement
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 6. HONESTY                                                          */
/* ------------------------------------------------------------------ */

function Honesty() {
  return (
    <section className="px-5 py-24 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <h2 className="text-balance text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-4xl">
            Ce qu'on est. Et ce qu'on n'est pas.
          </h2>
          <p className="mt-4 max-w-xl text-pretty leading-relaxed text-zinc-600 dark:text-zinc-400">
            On préfère être clairs dès le départ : UniHome ne signe pas de
            contrat, ne prend pas ton argent, ne se met pas entre vous.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Reveal>
            <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white px-6 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {[
                "On rassemble des annonces contrôlées, pensées pour étudiants.",
                "On donne un repère clair pour repérer les annonces sérieuses.",
                "On laisse étudiants et propriétaires se parler directement.",
                "On retire les annonces signalées comme louches.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3.5 py-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                  <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={100}>
            <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 bg-white px-6 dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {[
                "UniHome n'est pas une agence immobilière.",
                "On ne reçoit jamais ton loyer, ni ta caution.",
                "On ne signe pas de contrat à ta place.",
                "On ne prend aucune commission.",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3.5 py-4">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-700">
                    <X
                      className="h-3 w-3 text-zinc-600 dark:text-zinc-300"
                      strokeWidth={3}
                    />
                  </span>
                  <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* 7. FINAL CTA                                                        */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="px-5 pb-24 sm:px-8 sm:pb-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-3xl border border-zinc-200 bg-white px-6 py-20 text-center sm:py-24 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="uh-dotgrid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_65%_80%_at_50%_100%,black,transparent)]" />
        <div className="pointer-events-none absolute bottom-[-8rem] left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-blue-600/10 blur-3xl dark:bg-blue-500/15" />

        {/* Le moment "j'ai les clés" — saute de joie devant sa porte */}
        <CelebrateMoveIn className="pointer-events-none absolute bottom-0 left-2 hidden w-56 lg:block xl:left-10 xl:w-64" />
        <PlantPot className="pointer-events-none absolute bottom-0 right-4 hidden w-20 lg:block xl:right-12" />

        <Reveal>
          {/* Version mobile du moment clés, au-dessus du titre */}
          <CelebrateMoveIn className="relative mx-auto -mt-6 mb-4 w-44 lg:hidden" />
          <h2 className="relative mx-auto max-w-2xl text-balance text-3xl font-bold leading-tight tracking-[-0.02em] sm:text-5xl">
            Ton logement t'attend près de ton campus.
          </h2>
          <p className="relative mx-auto mt-5 max-w-xl text-pretty leading-relaxed text-zinc-600 dark:text-zinc-400">
            Des annonces contrôlées, un score clair, un contact direct. La
            recherche commence ici.
          </p>
        </Reveal>

        <Reveal delay={120}>
          <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <MagneticLink
              to="/search"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-7 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(37,99,235,0.5)] hover:bg-blue-700 sm:w-auto"
            >
              <Search className="h-4 w-4" />
              Chercher mon logement
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </MagneticLink>
            <Link
              to="/register?role=PROPRIETAIRE"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-zinc-300 bg-white px-7 py-3.5 text-[15px] font-semibold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 sm:w-auto dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
            >
              Publier mon logement
            </Link>
          </div>
          <p className="relative mt-6 text-sm text-zinc-500 dark:text-zinc-400">
            Déjà inscrit ?{" "}
            <Link
              to="/login"
              className="font-medium text-blue-600 underline-offset-4 hover:underline dark:text-blue-400"
            >
              Se connecter
            </Link>
          </p>
        </Reveal>
      </div>
    </section>
  );
}
