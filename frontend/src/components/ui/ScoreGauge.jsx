/**
 * ScoreGauge — ECharts-backed trust-score dial, Control Room styling.
 * Zone-colored axis (rouge <40, ambre 40–69, vert ≥70), graduations,
 * needle + count-up readout, verdict pill. Dark-mode aware via `isDark`
 * read from the document root class (re-renders on theme change).
 */
import { useMemo } from "react";
import * as echarts from "echarts/core";
import { GaugeChart } from "echarts/charts";
import { CanvasRenderer } from "echarts/renderers";
import { useEChart, useIsDark } from "./charts";
import {
  usePrefersReducedMotion,
  verdictColor,
  verdictLabel,
} from "./instruments";

echarts.use([GaugeChart, CanvasRenderer]);

const MONO = "JetBrains Mono, monospace";

export default function ScoreGauge({
  score = 0,
  label = "Score IA moyen",
  height = 260,
}) {
  const reduced = usePrefersReducedMotion();
  const isDark = useIsDark();

  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const color = verdictColor(clamped);

  const option = useMemo(() => {
    const track = isDark ? "#27272a" : "#f4f4f5"; // zinc-800 / zinc-100
    const tickColor = isDark ? "#3f3f46" : "#e4e4e7"; // zinc-700 / zinc-200
    const labelColor = isDark ? "#71717a" : "#a1a1aa"; // zinc-500 / zinc-400

    return {
      animation: !reduced,
      animationDuration: 1400,
      animationEasing: "cubicOut",
      series: [
        // zone band — thin colored rail showing the three verdict zones
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          splitNumber: 10,
          center: ["50%", "56%"],
          radius: "100%",
          axisLine: {
            lineStyle: {
              width: 4,
              color: [
                [0.4, isDark ? "#7f1d1d" : "#fecaca"],
                [0.7, isDark ? "#78350f" : "#fde68a"],
                [1, isDark ? "#064e3b" : "#a7f3d0"],
              ],
            },
          },
          axisTick: {
            distance: -14,
            length: 6,
            splitNumber: 4,
            lineStyle: { color: tickColor, width: 1 },
          },
          splitLine: {
            distance: -18,
            length: 12,
            lineStyle: { color: tickColor, width: 2 },
          },
          axisLabel: {
            distance: -30,
            color: labelColor,
            fontSize: 9,
            fontFamily: MONO,
            formatter: (v) => (v === 40 || v === 70 ? `${v}` : ""),
          },
          pointer: { show: false },
          detail: { show: false },
          data: [{ value: clamped }],
        },
        // progress + needle — the live measurement
        {
          type: "gauge",
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          center: ["50%", "56%"],
          radius: "87%",
          progress: {
            show: true,
            width: 10,
            roundCap: true,
            itemStyle: { color },
          },
          axisLine: {
            lineStyle: { width: 10, color: [[1, track]] },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          pointer: {
            icon: "path://M2,0 L-2,0 L-1,-58 L1,-58 Z",
            length: "58%",
            width: 4,
            itemStyle: { color },
          },
          anchor: {
            show: true,
            size: 11,
            showAbove: true,
            itemStyle: {
              color: "transparent",
              borderColor: color,
              borderWidth: 2,
            },
          },
          detail: {
            valueAnimation: !reduced,
            offsetCenter: [0, "35%"],
            formatter: (v) => `{score|${Math.round(v)}}{unit|/100}`,
            rich: {
              score: {
                color,
                fontSize: 34,
                fontWeight: 600,
                fontFamily: MONO,
              },
              unit: {
                color: labelColor,
                fontSize: 11,
                fontFamily: MONO,
                padding: [0, 0, 0, 3],
              },
            },
          },
          title: { show: false },
          data: [{ value: clamped }],
        },
      ],
    };
  }, [clamped, color, isDark, reduced]);

  const hostRef = useEChart(option);

  return (
    <div className="flex w-full flex-col items-center">
      <div
        ref={hostRef}
        className="w-full"
        style={{ height }}
        role="img"
        aria-label={`${label} : ${clamped} sur 100 — ${verdictLabel(clamped)}`}
      />
      <span
        className="mt-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-medium"
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
