export default function StatCard({
  icon: Icon,
  label,
  value,
  color = "blue",
  trend,
}) {
  // Control Room world: blue is the only brand accent; amber/red/emerald
  // appear only when the stat itself is a real state (pending, reports, verified).
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    indigo: "bg-blue-50 text-blue-600",
    purple: "bg-blue-50 text-blue-600",
    zinc: "bg-zinc-100 text-zinc-600",
    green: "bg-emerald-50 text-emerald-600",
    orange: "bg-amber-50 text-amber-600",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 transition-shadow hover:shadow-[0_16px_48px_-24px_rgba(9,9,11,0.2)] sm:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${tones[color] || tones.blue}`}
        >
          <Icon className="h-5 w-5" strokeWidth={2} />
        </div>
        {trend && (
          <span
            className={`rounded-full px-2 py-1 text-xs font-medium ${trend > 0 ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}
          >
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <p className="font-geist text-2xl font-bold tracking-[-0.01em] text-zinc-950 tabular-nums">
        {value}
      </p>
      <p className="mt-1 font-geist text-sm text-zinc-500">{label}</p>
    </div>
  );
}
