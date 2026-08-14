/**
 * TrustLens — score-threshold slider bound to real verdict zones.
 * Excluded rows dim rather than vanish; the count stays honest.
 */
import { verdictColor } from "../ui/instruments";

export default function TrustLens({ value, onChange, distribution = [] }) {
  /* at 0 the lens is off — earn the verdict color only once a threshold is set */
  const thumbColor = value === 0 ? "#71717a" : verdictColor(value);
  // distribution: array of scores of the current result set
  const buckets = { green: 0, amber: 0, red: 0 };
  distribution.forEach((s) => {
    if (s >= 70) buckets.green += 1;
    else if (s >= 40) buckets.amber += 1;
    else buckets.red += 1;
  });

  return (
    <div className="flex items-center gap-3">
      <span className="whitespace-nowrap font-mono text-[11px] text-zinc-500 dark:text-zinc-400">
        score ≥
      </span>
      <div className="relative flex h-8 w-40 items-center sm:w-48">
        {/* zone track — verdict colors are earned: neutral until the lens is engaged */}
        <div className="absolute inset-x-0 h-1.5 overflow-hidden rounded-full">
          {value === 0 ? (
            <div className="h-full bg-zinc-200 dark:bg-zinc-700" />
          ) : (
            <div className="flex h-full">
              <div
                className="h-full bg-red-200 dark:bg-red-500/30"
                style={{ width: "40%" }}
              />
              <div
                className="h-full bg-amber-200 dark:bg-amber-500/30"
                style={{ width: "30%" }}
              />
              <div
                className="h-full bg-emerald-200 dark:bg-emerald-500/30"
                style={{ width: "30%" }}
              />
            </div>
          )}
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="5"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Score de confiance minimum"
          className="uh-lens relative w-full appearance-none bg-transparent outline-none"
        />
        <style>{`
          .uh-lens::-webkit-slider-thumb {
            appearance: none; width: 18px; height: 18px; border-radius: 999px;
            background: ${thumbColor}; border: 2.5px solid white;
            box-shadow: 0 2px 8px rgba(9,9,11,0.25); cursor: grab;
          }
          .dark .uh-lens::-webkit-slider-thumb { border-color: #18181b; }
          .uh-lens::-moz-range-thumb {
            width: 18px; height: 18px; border-radius: 999px;
            background: ${thumbColor}; border: 2.5px solid white;
            box-shadow: 0 2px 8px rgba(9,9,11,0.25); cursor: grab;
          }
        `}</style>
      </div>
      <span
        className="w-7 text-right font-mono text-sm font-semibold tabular-nums"
        style={{ color: thumbColor }}
      >
        {value}
      </span>
    </div>
  );
}
