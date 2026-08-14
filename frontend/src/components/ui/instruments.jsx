/**
 * UniHome dashboard instruments — hand-authored SVG, Control Room world.
 * No chart lib: every instrument speaks the pipeline's real numbers.
 * All motion is gated on prefers-reduced-motion and fires once on mount.
 */
import { useEffect, useRef, useState } from "react";

/* ---------------------------------------------------------------- helpers */

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/** Count up to `target` once, ease-out cubic. */
export function useCountUp(target, duration = 1100, enabled = true) {
  const [value, setValue] = useState(enabled ? 0 : target);
  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, enabled]);
  return value;
}

export function verdictColor(score) {
  if (score >= 70) return "#059669";
  if (score >= 40) return "#d97706";
  return "#ef4444";
}

export function verdictLabel(score) {
  if (score >= 70) return "Vérifiée";
  if (score >= 40) return "En revue";
  return "Risquée";
}

/* ------------------------------------------------------------ RadialGauge */

const GAUGE_TICKS = 56; // graduations on the dial

/**
 * Precision tick-dial: 240° of individual graduations that ignite one by
 * one as the score counts up, a spring needle, threshold marks at 40/70.
 * Not a progress arc — an instrument.
 */
export function RadialGauge({
  score = 0,
  size = 190,
  label = "Score IA moyen",
}) {
  const reduced = usePrefersReducedMotion();
  const shown = useCountUp(score, 1400, !reduced);

  const cx = size / 2;
  const cy = size / 2;
  const rOut = size / 2 - 16; // tick outer radius
  const rIn = rOut - 11; // tick inner radius
  const startAngle = 150;
  const sweep = 240;
  const polar = (angleDeg, radius) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + radius * Math.cos(a), cy + radius * Math.sin(a)];
  };

  const clamped = Math.max(0, Math.min(100, score));
  const color = verdictColor(clamped);
  // ticks ignite with the count-up so the dial "fills" tick by tick
  const litCount = Math.round((GAUGE_TICKS * shown) / 100);
  const needleAngle = startAngle + (sweep * shown) / 100;
  const [nx, ny] = polar(needleAngle, rIn - 8);
  const [nbx, nby] = polar(needleAngle + 180, 10);

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.84 }}>
        <svg
          width={size}
          height={size * 0.84}
          viewBox={`0 0 ${size} ${size * 0.84}`}
          aria-hidden="true"
        >
          {/* graduations */}
          {Array.from({ length: GAUGE_TICKS }, (_, i) => {
            const t = i / (GAUGE_TICKS - 1);
            const a = startAngle + sweep * t;
            const tickValue = t * 100;
            // threshold graduations (closest to 40 / 70) are longer
            const isThreshold =
              Math.abs(tickValue - 40) < 100 / GAUGE_TICKS / 2 + 0.01 ||
              Math.abs(tickValue - 70) < 100 / GAUGE_TICKS / 2 + 0.01;
            const [x1, y1] = polar(a, isThreshold ? rIn - 5 : rIn);
            const [x2, y2] = polar(a, isThreshold ? rOut + 4 : rOut);
            const lit = i < litCount;
            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke={lit ? verdictColor(tickValue) : undefined}
                className={
                  lit ? undefined : "stroke-zinc-200 dark:stroke-zinc-800"
                }
                strokeWidth={isThreshold ? 2.5 : 1.5}
                strokeLinecap="round"
                style={{
                  opacity: lit ? 0.35 + 0.65 * t : 1,
                }}
              />
            );
          })}

          {/* threshold labels outside the dial */}
          {[40, 70].map((t) => {
            const a = startAngle + (sweep * t) / 100;
            const [lx, ly] = polar(a, rOut + 14);
            return (
              <text
                key={t}
                x={lx}
                y={ly + 3}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-500"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {t}
              </text>
            );
          })}

          {/* needle — thin blade with counterweight, rides the count-up */}
          <line
            x1={nbx}
            y1={nby}
            x2={nx}
            y2={ny}
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          {/* hub */}
          <circle
            cx={cx}
            cy={cy}
            r="5"
            fill="none"
            stroke={color}
            strokeWidth="2"
          />
          <circle cx={cx} cy={cy} r="1.8" fill={color} />
        </svg>

        {/* readout — below the hub, inside the dial's open mouth */}
        <div
          className="absolute inset-x-0 flex flex-col items-center"
          style={{ top: "62%" }}
        >
          <div className="flex items-baseline gap-1">
            <span
              className="font-mono text-[38px] font-semibold leading-none tabular-nums tracking-tight"
              style={{ color }}
            >
              {shown}
            </span>
            <span className="font-mono text-[11px] text-zinc-400 dark:text-zinc-500">
              /100
            </span>
          </div>
        </div>
      </div>

      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-medium"
        style={{ color, backgroundColor: `${color}14` }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {verdictLabel(clamped)}
      </span>
      <p className="mt-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
        {label}
      </p>
    </div>
  );
}

/* ----------------------------------------------------------- CriteriaBars */

const CRITERIA = [
  { key: "justificatif", label: "justificatif", weight: 0.35 },
  { key: "photos", label: "photos", weight: 0.2 },
  { key: "prix", label: "prix", weight: 0.2 },
  { key: "description", label: "description", weight: 0.15 },
  { key: "coherence", label: "cohérence", weight: 0.1 },
];

/**
 * The 5-criteria diagnostic. detail = { justificatif, photos, prix, description, coherence }.
 * Bars stagger in 140ms, weakest criterion carries an "à améliorer" chip.
 */
export function CriteriaBars({ detail = {}, compact = false }) {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMounted(true)),
    );
    return () => cancelAnimationFrame(t);
  }, []);

  const rows = CRITERIA.map((c) => ({
    ...c,
    value: Number(detail[c.key] ?? 0),
  }));
  const weakest = rows.reduce(
    (min, r) => (r.value < min.value ? r : min),
    rows[0],
  );
  const show = reduced || mounted;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {rows.map((row, i) => {
        const isWeak = row.key === weakest.key && row.value < 70;
        return (
          <div key={row.key}>
            <div className="mb-1 flex items-baseline justify-between font-mono text-[11px]">
              <span className="text-zinc-500 dark:text-zinc-400">
                {row.label}{" "}
                <span className="text-zinc-300 dark:text-zinc-600">
                  ×{row.weight.toFixed(2)}
                </span>
                {isWeak && !compact && (
                  <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 font-geist text-[10px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                    à améliorer
                  </span>
                )}
              </span>
              <span
                className="tabular-nums font-medium"
                style={{ color: verdictColor(row.value) }}
              >
                {row.value}
              </span>
            </div>
            <div
              className={`overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800 ${compact ? "h-1" : "h-1.5"}`}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: show ? `${row.value}%` : "0%",
                  backgroundColor: verdictColor(row.value),
                  transition: reduced
                    ? "none"
                    : `width 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 140}ms`,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------- SegmentBar */

/**
 * One horizontal pipeline bar segmented by status.
 * segments = [{ key, label, count, color, to? }]
 */
export function SegmentBar({ segments = [], onNavigate }) {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMounted(true)),
    );
    return () => cancelAnimationFrame(t);
  }, []);
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  const show = reduced || mounted;

  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full">
        {segments
          .filter((s) => s.count > 0)
          .map((seg, i) => (
            <button
              key={seg.key}
              type="button"
              onClick={() => onNavigate?.(seg)}
              title={`${seg.label} : ${seg.count}`}
              className="h-full rounded-sm transition-all first:rounded-l-full last:rounded-r-full hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
              style={{
                width: show ? `${(seg.count / total) * 100}%` : "0%",
                backgroundColor: seg.color,
                transition: reduced
                  ? "none"
                  : `width 0.8s cubic-bezier(0.16,1,0.3,1) ${i * 110}ms`,
              }}
            />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((seg) => (
          <span
            key={seg.key}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: seg.color }}
            />
            <span className="font-mono tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
              {seg.count}
            </span>
            {seg.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- DonutBreakdown */

/**
 * Status donut with count-up center. items = [{ label, count, color }]
 */
export function DonutBreakdown({
  items = [],
  size = 168,
  centerLabel = "annonces",
}) {
  const reduced = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(false);
  const [hovered, setHovered] = useState(null);
  useEffect(() => {
    const t = requestAnimationFrame(() =>
      requestAnimationFrame(() => setMounted(true)),
    );
    return () => cancelAnimationFrame(t);
  }, []);
  const total = items.reduce((s, i) => s + i.count, 0);
  const shown = useCountUp(total, 1000, !reduced);
  const r = size / 2 - 12;
  const cx = size / 2;
  const cy = size / 2;
  const C = 2 * Math.PI * r;
  const show = reduced || mounted;

  let acc = 0;
  const arcs = items
    .filter((i) => i.count > 0)
    .map((item) => {
      const frac = total > 0 ? item.count / total : 0;
      const arc = { ...item, offset: acc, frac };
      acc += frac;
      return arc;
    });

  return (
    <div className="flex items-center gap-6">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          aria-hidden="true"
          className="-rotate-90"
        >
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            className="stroke-zinc-100 dark:stroke-zinc-800"
            strokeWidth="14"
          />
          {arcs.map((arc, i) => (
            <circle
              key={arc.label}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={arc.color}
              strokeWidth={hovered === arc.label ? 18 : 14}
              strokeDasharray={`${show ? Math.max(arc.frac * C - 3, 1) : 0.01} ${C}`}
              strokeDashoffset={-arc.offset * C}
              strokeLinecap="round"
              onMouseEnter={() => setHovered(arc.label)}
              onMouseLeave={() => setHovered(null)}
              style={{
                transition: reduced
                  ? "stroke-width 0.2s"
                  : `stroke-dasharray 0.9s cubic-bezier(0.16,1,0.3,1) ${i * 120}ms, stroke-width 0.2s`,
                cursor: "default",
              }}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
            {shown}
          </span>
          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {centerLabel}
          </span>
        </div>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.label}
            className={`flex items-center gap-2 text-sm transition-opacity ${hovered && hovered !== item.label ? "opacity-40" : ""}`}
            onMouseEnter={() => setHovered(item.label)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="font-mono tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
              {item.count}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400">
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ ScoreRuler */

/**
 * A score on the 0–100 threshold ruler — shows *why* a listing is in a zone.
 */
export function ScoreRuler({ score = 0 }) {
  const clamped = Math.max(0, Math.min(100, score));
  const color = verdictColor(clamped);
  return (
    <div className="w-full">
      <div className="relative h-1.5 w-full rounded-full bg-gradient-to-r from-red-100 via-amber-100 to-emerald-100 dark:from-red-500/20 dark:via-amber-500/20 dark:to-emerald-500/20">
        {/* threshold marks */}
        <span
          className="absolute top-[-3px] h-3 w-px bg-zinc-300 dark:bg-zinc-600"
          style={{ left: "40%" }}
        />
        <span
          className="absolute top-[-3px] h-3 w-px bg-zinc-300 dark:bg-zinc-600"
          style={{ left: "70%" }}
        />
        {/* marker */}
        <span
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm dark:border-zinc-900"
          style={{ left: `${clamped}%`, backgroundColor: color }}
        />
      </div>
      <div className="mt-1 flex justify-between font-mono text-[9px] text-zinc-300 dark:text-zinc-600">
        <span>0</span>
        <span className="ml-[24%]">40</span>
        <span className="mr-[18%]">70</span>
        <span>100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- MiniFunnel */

/**
 * vues → favoris engagement pair for a listing row.
 */
export function MiniFunnel({ vues = 0, favoris = 0 }) {
  const max = Math.max(vues, 1);
  return (
    <div className="flex items-center gap-3 font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
      <div className="flex items-center gap-1.5">
        <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
          {vues}
        </span>
        <span>vues</span>
      </div>
      <svg
        width="34"
        height="12"
        viewBox="0 0 34 12"
        aria-hidden="true"
        className="text-zinc-200 dark:text-zinc-700"
      >
        <path
          d="M0 1 L22 4 L34 6 L22 8 L0 11 Z"
          fill="currentColor"
          opacity="0.6"
        />
        <path
          d="M0 1 L22 4 L34 6 L22 8 L0 11 Z"
          fill="#2563eb"
          opacity="0.65"
          style={{
            clipPath: `inset(0 ${100 - Math.min((favoris / max) * 100, 100)}% 0 0)`,
          }}
        />
      </svg>
      <div className="flex items-center gap-1.5">
        <span className="tabular-nums font-medium text-zinc-900 dark:text-zinc-100">
          {favoris}
        </span>
        <span>favoris</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- RadarRings */

/**
 * Ambient campus radar: pin + expanding rings (same loop as the homepage map).
 * Decorative; gated on reduced motion via CSS animation classes.
 */
export function RadarRings({ size = 150 }) {
  const c = size / 2;
  return (
    <>
      <style>{`
        @keyframes uh-radar { 0% { r: 10; opacity: 0.55; } 100% { r: ${c - 6}px; opacity: 0; } }
        .uh-radar-ring { animation: uh-radar 3.2s cubic-bezier(0.16,1,0.3,1) infinite; }
        .uh-radar-ring2 { animation-delay: 1.05s; }
        .uh-radar-ring3 { animation-delay: 2.1s; }
        @media (prefers-reduced-motion: reduce) { .uh-radar-ring { animation: none; r: ${c * 0.55}px; opacity: 0.25; } }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        <circle
          className="uh-radar-ring"
          cx={c}
          cy={c}
          r="10"
          fill="none"
          stroke="#2563eb"
          strokeWidth="1.5"
        />
        <circle
          className="uh-radar-ring uh-radar-ring2"
          cx={c}
          cy={c}
          r="10"
          fill="none"
          stroke="#2563eb"
          strokeWidth="1.5"
        />
        <circle
          className="uh-radar-ring uh-radar-ring3"
          cx={c}
          cy={c}
          r="10"
          fill="none"
          stroke="#2563eb"
          strokeWidth="1.5"
        />
        <circle
          cx={c}
          cy={c}
          r="16"
          className="fill-blue-50 dark:fill-blue-500/10"
        />
        {/* campus pin */}
        <g transform={`translate(${c - 8}, ${c - 10})`}>
          <path
            d="M8 0C3.6 0 0 3.6 0 8c0 5.4 8 12 8 12s8-6.6 8-12c0-4.4-3.6-8-8-8z"
            fill="#2563eb"
          />
          <circle cx="8" cy="8" r="3" fill="white" />
        </g>
      </svg>
    </>
  );
}
