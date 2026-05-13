"use client";

import { useMemo, useState } from "react";
import { TimeEntry } from "@/types";
import { computePeakHours, formatHourLabel, peakHourStats } from "@/lib/peakHours";
import { formatDurationShort } from "@/lib/duration";

interface Props {
  entries: TimeEntry[];
}

/** Descriptive label for a given hour's category */
function timePeriodLabel(hour: number): string {
  if (hour >= 5 && hour < 12) return "Morning";
  if (hour >= 12 && hour < 17) return "Afternoon";
  if (hour >= 17 && hour < 21) return "Evening";
  return "Night";
}

/** Hex color for a bar based on whether it's peak, top-quartile, or normal */
function barClass(hour: number, isPeak: boolean, isTopQ: boolean): string {
  if (isPeak) return "bg-orange-400";
  if (isTopQ) return "bg-orange-500/60";
  return "bg-zinc-700/80";
}

export function PeakHoursChart({ entries }: Props) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null);

  const buckets = useMemo(() => computePeakHours(entries), [entries]);
  const stats = useMemo(() => peakHourStats(buckets), [buckets]);

  const maxMs = Math.max(...buckets.map((b) => b.ms), 1);
  const totalMs = buckets.reduce((s, b) => s + b.ms, 0);

  if (totalMs === 0) return null;

  const topQuartileSet = new Set(stats.topQuartileHours);

  // Determine primary work block descriptor
  const morningMs = buckets.slice(5, 12).reduce((s, b) => s + b.ms, 0);
  const afternoonMs = buckets.slice(12, 17).reduce((s, b) => s + b.ms, 0);
  const eveningMs = buckets.slice(17, 21).reduce((s, b) => s + b.ms, 0);
  const nightMs =
    buckets.slice(21, 24).reduce((s, b) => s + b.ms, 0) +
    buckets.slice(0, 5).reduce((s, b) => s + b.ms, 0);
  const periods: [string, number][] = [
    ["Morning (5–11)", morningMs],
    ["Afternoon (12–16)", afternoonMs],
    ["Evening (17–20)", eveningMs],
    ["Night (21–4)", nightMs],
  ];
  const dominantPeriod = periods.reduce((a, b) => (b[1] > a[1] ? b : a), ["", 0]);

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Peak Hours
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">When you work, distributed by hour of day</p>
        </div>
        {stats.peakHour !== null && (
          <div className="text-right">
            <p className="text-sm font-semibold text-orange-400">
              {formatHourLabel(stats.peakHour)}
            </p>
            <p className="text-xs text-zinc-600">peak hour</p>
          </div>
        )}
      </div>

      {/* Summary stat chips */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {stats.peakHour !== null && (
          <div className="flex items-center gap-1.5 bg-zinc-800 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-zinc-400">Peak:</span>
            <span className="text-xs font-semibold text-orange-400">
              {formatHourLabel(stats.peakHour)}
            </span>
            <span className="text-xs text-zinc-600">({formatDurationShort(stats.peakMs)})</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 bg-zinc-800 rounded-lg px-2.5 py-1.5">
          <span className="text-xs text-zinc-400">Active hours:</span>
          <span className="text-xs font-semibold text-zinc-200">{stats.activeHours}</span>
        </div>
        {dominantPeriod[1] > 0 && (
          <div className="flex items-center gap-1.5 bg-zinc-800 rounded-lg px-2.5 py-1.5">
            <span className="text-xs text-zinc-400">Peak period:</span>
            <span className="text-xs font-semibold text-zinc-200">{dominantPeriod[0]}</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="relative">
        {/* Bars */}
        <div className="flex items-end gap-px" style={{ height: "80px" }}>
          {buckets.map(({ hour, ms }) => {
            const isPeak = hour === stats.peakHour && ms > 0;
            const isTopQ = topQuartileSet.has(hour);
            const heightPx = ms > 0 ? Math.max(2, Math.round((ms / maxMs) * 72)) : 0;
            const isHovered = hoveredHour === hour;

            return (
              <div
                key={hour}
                className="flex-1 flex flex-col justify-end cursor-default relative group"
                style={{ height: "80px" }}
                onMouseEnter={() => setHoveredHour(hour)}
                onMouseLeave={() => setHoveredHour(null)}
              >
                {/* Tooltip */}
                {isHovered && ms > 0 && (
                  <div
                    className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
                    style={{ minWidth: "100px" }}
                  >
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-2 shadow-xl text-center whitespace-nowrap">
                      <p className="text-xs font-semibold text-zinc-100">
                        {formatHourLabel(hour)}–{formatHourLabel((hour + 1) % 24)}
                      </p>
                      <p className="text-xs text-orange-400 font-mono mt-0.5">
                        {formatDurationShort(ms)}
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {totalMs > 0 ? Math.round((ms / totalMs) * 100) : 0}% of total
                      </p>
                    </div>
                  </div>
                )}

                {/* Bar */}
                <div
                  className={`w-full rounded-t transition-all ${barClass(hour, isPeak, isTopQ)} ${
                    isHovered ? "opacity-100 ring-1 ring-orange-400/40" : "opacity-90"
                  }`}
                  style={{ height: `${heightPx}px` }}
                />
              </div>
            );
          })}
        </div>

        {/* X-axis labels — only midnight, 6am, noon, 6pm */}
        <div className="flex items-start mt-1.5" style={{ position: "relative" }}>
          {buckets.map(({ hour }) => {
            const showLabel = hour % 6 === 0;
            return (
              <div key={hour} className="flex-1 text-center">
                {showLabel ? (
                  <span className={`text-xs ${hour === 0 || hour === 12 ? "text-zinc-400" : "text-zinc-600"}`}>
                    {formatHourLabel(hour)}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* Period breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
        {periods.map(([label, ms]) => {
          const pct = totalMs > 0 ? Math.round((ms / totalMs) * 100) : 0;
          const isDominant = label === dominantPeriod[0] && ms > 0;
          return (
            <div
              key={label}
              className={`rounded-lg px-3 py-2 border ${
                isDominant
                  ? "bg-orange-500/10 border-orange-500/30"
                  : "bg-zinc-800/50 border-zinc-800"
              }`}
            >
              <p className={`text-xs font-medium ${isDominant ? "text-orange-300" : "text-zinc-400"}`}>
                {label.split(" ")[0]}
              </p>
              <p className={`text-sm font-semibold mt-0.5 ${isDominant ? "text-orange-400" : "text-zinc-300"}`}>
                {ms > 0 ? formatDurationShort(ms) : "—"}
              </p>
              {pct > 0 && (
                <p className="text-xs text-zinc-600 mt-0.5">{pct}%</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
