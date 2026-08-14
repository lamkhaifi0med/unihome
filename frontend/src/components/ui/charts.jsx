/**
 * charts.jsx — ECharts-backed dashboard instruments, Control Room styling.
 * Shared setup (tree-shaken), dark-mode aware, reduced-motion gated.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import * as echarts from "echarts/core";
import { BarChart, PieChart } from "echarts/charts";
import {
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { usePrefersReducedMotion, verdictColor } from "./instruments";

echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  MarkLineComponent,
  TooltipComponent,
  CanvasRenderer,
]);

const MONO = "JetBrains Mono, monospace";

/** Watch the <html> class list so charts restyle on theme toggle. */
export function useIsDark() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return dark;
}

/** Mount an ECharts instance on a host div, kept in sync with `option`. */
export function useEChart(option) {
  const hostRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const chart = echarts.init(host, null, { renderer: "canvas" });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(host);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option);
  }, [option]);

  return hostRef;
}

const CRITERIA_ORDER = [
  { key: "justificatif", label: "justificatif", weight: "×0.35" },
  { key: "photos", label: "photos", weight: "×0.20" },
  { key: "prix", label: "prix", weight: "×0.20" },
  { key: "description", label: "description", weight: "×0.15", alt: "texte" },
  { key: "coherence", label: "cohérence", weight: "×0.10" },
];

/**
 * CriteriaChart — the 5 IA criteria as horizontal bars,
 * verdict-colored, with mono weight annotations and score readouts.
 */
export function CriteriaChart({ detail = {}, height = 200 }) {
  const isDark = useIsDark();
  const reduced = usePrefersReducedMotion();

  const rows = useMemo(() => {
    return CRITERIA_ORDER.map((c) => {
      const raw = detail[c.key] ?? (c.alt ? detail[c.alt] : undefined);
      const value = Math.max(0, Math.min(100, Number(raw ?? 0)));
      return { ...c, value };
    });
  }, [detail]);

  const option = useMemo(() => {
    const track = isDark ? "#27272a" : "#f4f4f5";
    const labelColor = isDark ? "#a1a1aa" : "#71717a";
    const weightColor = isDark ? "#52525b" : "#a1a1aa";
    // reversed so the heaviest criterion sits on top
    const reversed = [...rows].reverse();

    return {
      animation: !reduced,
      animationDuration: 900,
      animationEasing: "cubicOut",
      grid: { left: 0, right: 34, top: 4, bottom: 4, containLabel: true },
      xAxis: {
        type: "value",
        min: 0,
        max: 100,
        show: false,
      },
      yAxis: {
        type: "category",
        data: reversed.map((r) => r.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: labelColor,
          fontFamily: MONO,
          fontSize: 11,
          margin: 12,
          formatter: (label) => {
            const row = rows.find((r) => r.label === label);
            return `{n|${label}} {w|${row?.weight ?? ""}}`;
          },
          rich: {
            n: { color: labelColor, fontFamily: MONO, fontSize: 11 },
            w: { color: weightColor, fontFamily: MONO, fontSize: 9 },
          },
        },
      },
      tooltip: {
        trigger: "axis",
        axisPointer: { type: "none" },
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        textStyle: {
          color: isDark ? "#e4e4e7" : "#27272a",
          fontFamily: MONO,
          fontSize: 11,
        },
        formatter: (params) => {
          const p = params[0];
          return `${p.name} — <b>${p.value}</b>/100`;
        },
      },
      series: [
        {
          type: "bar",
          data: reversed.map((r) => ({
            value: r.value,
            itemStyle: { color: verdictColor(r.value), borderRadius: 3 },
          })),
          barWidth: 8,
          showBackground: true,
          backgroundStyle: { color: track, borderRadius: 3 },
          label: {
            show: true,
            position: "right",
            distance: 8,
            fontFamily: MONO,
            fontSize: 11,
            fontWeight: 600,
            color: labelColor,
            formatter: ({ value }) => `${value}`,
          },
        },
      ],
    };
  }, [rows, isDark, reduced]);

  const hostRef = useEChart(option);
  return <div ref={hostRef} className="w-full" style={{ height }} />;
}

/**
 * PipelineChart — one stacked horizontal bar (statuses of the park),
 * with a mono legend row. Clicking navigates to the listings page.
 */
export function PipelineChart({ segments = [], onNavigate, height = 46 }) {
  const isDark = useIsDark();
  const reduced = usePrefersReducedMotion();
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  const option = useMemo(() => {
    const track = isDark ? "#27272a" : "#f4f4f5";
    const visible = segments.filter((s) => s.count > 0);

    return {
      animation: !reduced,
      animationDuration: 900,
      animationEasing: "cubicOut",
      grid: { left: 0, right: 0, top: 6, bottom: 6 },
      xAxis: { type: "value", min: 0, max: Math.max(total, 1), show: false },
      yAxis: { type: "category", data: [""], show: false },
      tooltip: {
        trigger: "item",
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        textStyle: {
          color: isDark ? "#e4e4e7" : "#27272a",
          fontFamily: MONO,
          fontSize: 11,
        },
        formatter: ({ seriesName, value }) => `${seriesName} — <b>${value}</b>`,
      },
      series: visible.length
        ? visible.map((s, i) => ({
            name: s.label,
            type: "bar",
            stack: "pipeline",
            data: [s.count],
            barWidth: 12,
            itemStyle: {
              color: s.color,
              borderRadius:
                visible.length === 1
                  ? 6
                  : i === 0
                    ? [6, 0, 0, 6]
                    : i === visible.length - 1
                      ? [0, 6, 6, 0]
                      : 0,
            },
            emphasis: { itemStyle: { opacity: 0.85 } },
          }))
        : [
            {
              name: "vide",
              type: "bar",
              stack: "pipeline",
              data: [1],
              barWidth: 12,
              itemStyle: { color: track, borderRadius: 6 },
              silent: true,
            },
          ],
    };
  }, [segments, total, isDark, reduced]);

  const hostRef = useEChart(option);

  return (
    <div>
      <div
        ref={hostRef}
        className={`w-full ${onNavigate ? "cursor-pointer" : ""}`}
        style={{ height }}
        onClick={onNavigate}
        role={onNavigate ? "button" : undefined}
        tabIndex={onNavigate ? 0 : undefined}
        onKeyDown={
          onNavigate
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") onNavigate();
              }
            : undefined
        }
        aria-label="Répartition des annonces par statut — ouvrir mes annonces"
      />
      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {segments.map((s) => (
          <span
            key={s.key}
            className="inline-flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 dark:text-zinc-400"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {s.count}
            </span>
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * DonutChart — platform-state breakdown as an ECharts donut with a
 * total readout in the hole and a mono legend below.
 */
export function DonutChart({
  items = [],
  height = 190,
  centerLabel = "annonces",
}) {
  const isDark = useIsDark();
  const reduced = usePrefersReducedMotion();
  const total = items.reduce((sum, it) => sum + it.count, 0);

  const option = useMemo(() => {
    const track = isDark ? "#27272a" : "#f4f4f5";
    const inkColor = isDark ? "#fafafa" : "#09090b";
    const labelColor = isDark ? "#71717a" : "#a1a1aa";
    const border = isDark ? "#18181b" : "#ffffff";
    const visible = items.filter((it) => it.count > 0);

    return {
      animation: !reduced,
      animationDuration: 900,
      animationEasing: "cubicOut",
      tooltip: {
        trigger: "item",
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        textStyle: {
          color: isDark ? "#e4e4e7" : "#27272a",
          fontFamily: MONO,
          fontSize: 11,
        },
        formatter: ({ name, value, percent }) =>
          `${name} — <b>${value}</b> (${percent}%)`,
      },
      series: [
        {
          type: "pie",
          radius: ["68%", "88%"],
          center: ["50%", "50%"],
          avoidLabelOverlap: false,
          padAngle: 2,
          itemStyle: { borderRadius: 5, borderColor: border, borderWidth: 2 },
          label: {
            show: true,
            position: "center",
            formatter: () =>
              `{total|${total.toLocaleString("fr-FR")}}\n{cap|${centerLabel}}`,
            rich: {
              total: {
                color: inkColor,
                fontSize: 26,
                fontWeight: 600,
                fontFamily: MONO,
                lineHeight: 30,
              },
              cap: {
                color: labelColor,
                fontSize: 10,
                fontFamily: MONO,
                lineHeight: 16,
              },
            },
          },
          emphasis: {
            scale: true,
            scaleSize: 4,
            label: { show: true },
          },
          labelLine: { show: false },
          data: visible.length
            ? visible.map((it) => ({
                name: it.label,
                value: it.count,
                itemStyle: { color: it.color },
              }))
            : [
                {
                  name: "vide",
                  value: 1,
                  itemStyle: { color: track },
                  tooltip: { show: false },
                },
              ],
        },
      ],
    };
  }, [items, total, centerLabel, isDark, reduced]);

  const hostRef = useEChart(option);

  return (
    <div>
      <div
        ref={hostRef}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`Répartition — ${items
          .map((it) => `${it.count} ${it.label}`)
          .join(", ")}`}
      />
      <div className="mt-3 space-y-1.5">
        {items.map((it) => (
          <div
            key={it.label}
            className="flex items-center justify-between font-mono text-[11px] text-zinc-500 dark:text-zinc-400"
          >
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: it.color }}
              />
              {it.label}
            </span>
            <span className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
              {it.count.toLocaleString("fr-FR")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * MarketChart — loyers of nearby listings as vertical bars,
 * with the student's budget as a dashed markLine. Bars within
 * budget are blue; above budget, red.
 */
export function MarketChart({ items = [], budget = null, height = 200 }) {
  const isDark = useIsDark();
  const reduced = usePrefersReducedMotion();

  const option = useMemo(() => {
    const inkColor = isDark ? "#fafafa" : "#09090b";
    const labelColor = isDark ? "#71717a" : "#a1a1aa";
    const gridLine = isDark ? "#27272a" : "#f4f4f5";
    const blue = isDark ? "#60a5fa" : "#2563eb";
    const sorted = [...items].sort((a, b) => a.loyer - b.loyer);

    return {
      animation: !reduced,
      animationDuration: 800,
      animationEasing: "cubicOut",
      grid: { left: 8, right: 12, top: 18, bottom: 8, containLabel: true },
      tooltip: {
        trigger: "item",
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        textStyle: {
          color: isDark ? "#e4e4e7" : "#27272a",
          fontFamily: MONO,
          fontSize: 11,
        },
        formatter: ({ dataIndex }) => {
          const it = sorted[dataIndex];
          return `${it.label}<br/><b>${it.loyer.toLocaleString("fr-FR")} MAD</b>${
            it.distanceKm != null ? ` — ${it.distanceKm} km` : ""
          }`;
        },
      },
      xAxis: {
        type: "category",
        data: sorted.map((it) => it.short),
        axisLine: { lineStyle: { color: gridLine } },
        axisTick: { show: false },
        axisLabel: {
          color: labelColor,
          fontFamily: MONO,
          fontSize: 9,
          interval: 0,
        },
      },
      yAxis: {
        type: "value",
        splitLine: { lineStyle: { color: gridLine } },
        axisLabel: {
          color: labelColor,
          fontFamily: MONO,
          fontSize: 9,
          formatter: (v) => (v >= 1000 ? `${v / 1000}k` : v),
        },
      },
      series: [
        {
          type: "bar",
          barWidth: "52%",
          data: sorted.map((it) => ({
            value: it.loyer,
            itemStyle: {
              color: budget != null && it.loyer > budget ? "#ef4444" : blue,
              borderRadius: [4, 4, 0, 0],
              opacity: budget != null && it.loyer > budget ? 0.75 : 1,
            },
          })),
          label: {
            show: true,
            position: "top",
            fontFamily: MONO,
            fontSize: 9,
            color: inkColor,
            formatter: ({ value }) => value.toLocaleString("fr-FR"),
          },
          markLine:
            budget != null
              ? {
                  silent: true,
                  symbol: "none",
                  lineStyle: {
                    color: isDark ? "#fbbf24" : "#d97706",
                    type: "dashed",
                    width: 1.5,
                  },
                  label: {
                    position: "insideEndTop",
                    fontFamily: MONO,
                    fontSize: 10,
                    color: isDark ? "#fbbf24" : "#d97706",
                    formatter: () => `budget ${budget.toLocaleString("fr-FR")}`,
                  },
                  data: [{ yAxis: budget }],
                }
              : undefined,
        },
      ],
    };
  }, [items, budget, isDark, reduced]);

  const hostRef = useEChart(option);

  return (
    <div
      ref={hostRef}
      className="w-full"
      style={{ height }}
      role="img"
      aria-label={`Loyers autour du campus — ${items
        .map((it) => `${it.short} ${it.loyer} MAD`)
        .join(", ")}${budget != null ? ` — budget ${budget} MAD` : ""}`}
    />
  );
}
