"use client";

import { useMemo } from "react";
import { StreakStats, getRecentDays } from "@/lib/streaks";
import { formatDurationShort } from "@/lib/duration";

interface ActivityHeatmapProps {
  stats: StreakStats;
  /** Number of days to show (default 112 = 16 weeks) */
  days?: number;
}

function intensityClass(ms: number): string {
  if (ms === 0) return "bg-zinc-800";
  if (ms < 30 * 60 * 1000) return "bg-orange-900/60"; // < 30 min
  if (ms < 2 * 3600 * 1000) return "bg-orange-700/70"; // < 2h
  if (ms < 4 * 3600 * 1000) return "bg-orange-500/80"; // < 4h
  return "bg-orange-400"; // 4h+
}

const DAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function ActivityHeatmap({ stats, days = 112 }: ActivityHeatmapProps) {
  const recentDays = useMemo(() => getRecentDays(days), [days]);

  // Pad beginning so first column starts on the right weekday
  const firstDate = new Date(recentDays[0] + "T00:00:00");
  const firstDow = firstDate.getDay(); // 0 = Sun
  // We'll render a grid where each column is a week (Sun..Sat)
  const padded = Array<string | null>(firstDow).fill(null).concat(recentDays);

  // Split into weeks
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    weeks.push(padded.slice(i, i + 7));
  }

  // Month labels: find first day of each month within recentDays
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    for (const day of week) {
      if (!day) continue;
      const d = new Date(day + "T00:00:00");
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        monthLabels.push({
          label: d.toLocaleDateString("en-US", { month: "short" }),
          weekIndex: wi,
        });
      }
      break;
    }
  });

  return (
    <div className="overflow-x-auto">
      {/* Month labels */}
      <div className="flex mb-1" style={{ paddingLeft: "20px" }}>
        {weeks.map((_, wi) => {
          const label = monthLabels.find((m) => m.weekIndex === wi);
          return (
            <div key={wi} className="flex-shrink-0 w-[14px] mr-[2px]">
              {label && (
                <span className="text-[9px] text-zinc-500 whitespace-nowrap">
                  {label.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-0">
        {/* Day-of-week labels */}
        <div className="flex flex-col mr-1">
          {DAYS.map((d, i) => (
            <div key={i} className="h-[14px] w-[14px] mb-[2px] flex items-center">
              <span className="text-[9px] text-zinc-600 leading-none">{i % 2 === 1 ? d : ""}</span>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="flex gap-[2px]">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-[2px]">
              {week.map((day, di) => {
                if (!day) {
                  return <div key={di} className="w-[14px] h-[14px] rounded-sm" />;
                }
                const ms = stats.dailyMs.get(day) ?? 0;
                const title = ms > 0
                  ? `${day}: ${formatDurationShort(ms)}`
                  : day;
                return (
                  <div
                    key={di}
                    title={title}
                    className={`w-[14px] h-[14px] rounded-sm transition-colors ${intensityClass(ms)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 justify-end">
        <span className="text-[10px] text-zinc-600">Less</span>
        {["bg-zinc-800", "bg-orange-900/60", "bg-orange-700/70", "bg-orange-500/80", "bg-orange-400"].map((cls, i) => (
          <div key={i} className={`w-[12px] h-[12px] rounded-sm ${cls}`} />
        ))}
        <span className="text-[10px] text-zinc-600">More</span>
      </div>
    </div>
  );
}
