"use client";

import { useMemo, useState } from "react";
import { TimeEntry } from "@/types";
import { formatDurationShort } from "@/lib/duration";
import {
  computeWeekdayDistribution,
  weekdayStats,
  WeekdayBucket,
} from "@/lib/weekdayDistribution";

interface Props {
  entries: TimeEntry[];
  rangeStart: Date;
  rangeEnd: Date;
  /** 0 = Sunday, 1 = Monday */
  weekStartsOn?: 0 | 1;
  totalRangeMs: number;
}

type DisplayMode = "total" | "average";

export function WeekdayDistribution({
  entries,
  rangeStart,
  rangeEnd,
  weekStartsOn = 1,
  totalRangeMs,
}: Props) {
  const [mode, setMode] = useState<DisplayMode>("total");
  const [hoveredDow, setHoveredDow] = useState<number | null>(null);

  const buckets = useMemo(
    () =>
      computeWeekdayDistribution(entries, rangeStart, rangeEnd, weekStartsOn),
    [entries, rangeStart, rangeEnd, weekStartsOn]
  );

  const stats = useMemo(() => weekdayStats(buckets), [buckets]);

  if (totalRangeMs === 0) return null;

  const displayValues = buckets.map((b) =>
    mode === "total" ? b.totalMs : b.avgMs
  );
  const maxDisplay = Math.max(...displayValues, 1);

  // How many weeks does the range span? Used to decide whether avg mode makes sense.
  const rangeMs = rangeEnd.getTime() - rangeStart.getTime();
  const rangeDays = Math.round(rangeMs / 86_400_000);
  const showAvgToggle = rangeDays > 7;

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Day of Week
        </h2>
        {showAvgToggle && (
          <div className="flex items-center gap-1 bg-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setMode("total")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === "total"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Total
            </button>
            <button
              onClick={() => setMode("average")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                mode === "average"
                  ? "bg-zinc-700 text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Avg / week
            </button>
          </div>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex items-center gap-3 mb-5 flex-wrap">
        {stats.peakDow !== null && (
          <div className="flex items-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2.5 py-1">
            <span className="text-orange-400 text-xs font-medium">
              {buckets.find((b) => b.dow === stats.peakDow)?.label ?? "—"}
            </span>
            <span className="text-zinc-500 text-xs">peak day</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1">
          <span className="text-zinc-200 text-xs font-medium">{stats.activeDays}</span>
          <span className="text-zinc-500 text-xs">active days</span>
        </div>
        {stats.emptyDays > 0 && (
          <div className="flex items-center gap-1.5 bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1">
            <span className="text-zinc-400 text-xs font-medium">{stats.emptyDays}</span>
            <span className="text-zinc-500 text-xs">empty</span>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5">
        {buckets.map((bucket, i) => {
          const displayMs = mode === "total" ? bucket.totalMs : bucket.avgMs;
          const barHeight = Math.round((displayMs / maxDisplay) * 80);
          const isPeak = bucket.dow === stats.peakDow && bucket.totalMs > 0;
          const isHovered = hoveredDow === bucket.dow;
          const pct =
            totalRangeMs > 0
              ? Math.round((bucket.totalMs / totalRangeMs) * 100)
              : 0;

          return (
            <div
              key={bucket.dow}
              className="flex-1 flex flex-col items-center gap-1.5 relative group"
              onMouseEnter={() => setHoveredDow(bucket.dow)}
              onMouseLeave={() => setHoveredDow(null)}
            >
              {/* Tooltip */}
              {isHovered && displayMs > 0 && (
                <div
                  className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-20
                             bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2
                             text-xs whitespace-nowrap shadow-lg pointer-events-none"
                >
                  <p className="font-medium text-zinc-100 mb-0.5">{bucket.label}</p>
                  {mode === "total" ? (
                    <>
                      <p className="text-zinc-400">
                        Total:{" "}
                        <span className="text-zinc-200 font-mono">
                          {formatDurationShort(bucket.totalMs)}
                        </span>
                      </p>
                      <p className="text-zinc-500">{pct}% of range total</p>
                      {showAvgToggle && bucket.occurrences > 0 && (
                        <p className="text-zinc-500 mt-0.5">
                          Avg:{" "}
                          <span className="text-zinc-400 font-mono">
                            {formatDurationShort(bucket.avgMs)}
                          </span>
                          {" "}/ occ.
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-zinc-400">
                        Avg:{" "}
                        <span className="text-zinc-200 font-mono">
                          {formatDurationShort(bucket.avgMs)}
                        </span>
                        {" "}/ week
                      </p>
                      <p className="text-zinc-500">
                        Total:{" "}
                        <span className="font-mono">
                          {formatDurationShort(bucket.totalMs)}
                        </span>{" "}
                        over {bucket.occurrences} {bucket.occurrences === 1 ? "occ." : "occurrences"}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Bar area */}
              <div
                className="w-full flex items-end justify-center"
                style={{ height: "80px" }}
              >
                <div
                  className={`w-full rounded-t transition-all duration-150 ${
                    displayMs === 0
                      ? "bg-zinc-800/40"
                      : isPeak
                      ? "bg-orange-400"
                      : isHovered
                      ? "bg-orange-500/80"
                      : "bg-orange-500/55"
                  }`}
                  style={{
                    height: displayMs === 0 ? "4px" : `${Math.max(barHeight, 4)}px`,
                    opacity: displayMs === 0 ? 0.3 : 1,
                  }}
                />
              </div>

              {/* Day label */}
              <span
                className={`text-xs font-medium transition-colors ${
                  isPeak ? "text-orange-400" : "text-zinc-500"
                }`}
              >
                {bucket.label}
              </span>

              {/* Duration label under day */}
              <span className="text-xs font-mono text-zinc-600 leading-none">
                {displayMs > 0 ? formatDurationShort(displayMs) : "—"}
              </span>
            </div>
          );
        })}
      </div>

      {/* Footer note when avg mode */}
      {mode === "average" && showAvgToggle && (
        <p className="text-xs text-zinc-600 mt-3 italic">
          Average per calendar occurrence in the selected range.
        </p>
      )}
    </section>
  );
}
