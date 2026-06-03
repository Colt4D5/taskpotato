"use client";

import { useMemo } from "react";
import { TimeEntry } from "@/types";
import { computeDailyGoal, DailyGoalDay } from "@/lib/dailyGoal";
import { formatDurationShort } from "@/lib/duration";

interface DailyGoalCalendarProps {
  entries: TimeEntry[];
  rangeStart: Date;
  rangeEnd: Date;
  dailyGoalHours: number;
}

function formatKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function DayBar({ day, maxMs }: { day: DailyGoalDay; maxMs: number }) {
  const pct = maxMs > 0 ? Math.min(day.trackedMs / maxMs, 1) : 0;
  const goalPct = maxMs > 0 ? Math.min(day.goalMs / maxMs, 1) : 0;
  const heightPx = Math.max(Math.round(pct * 100), day.trackedMs > 0 ? 2 : 0);
  const goalHeightPx = Math.round(goalPct * 100);

  let barColor: string;
  if (day.isFuture) {
    barColor = "bg-zinc-700/40";
  } else if (day.met) {
    barColor = "bg-green-500";
  } else if (day.isToday) {
    barColor = "bg-orange-400";
  } else if (day.trackedMs > 0) {
    barColor = "bg-orange-600/60";
  } else {
    barColor = "bg-zinc-700/30";
  }

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      {/* Bar area — fixed height 100px */}
      <div className="relative w-full flex items-end justify-center" style={{ height: 100 }}>
        {/* Goal marker line */}
        {!day.isFuture && day.goalMs > 0 && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-zinc-500/60 pointer-events-none"
            style={{ bottom: goalHeightPx }}
            title={`Goal: ${formatDurationShort(day.goalMs)}`}
          />
        )}
        {/* Actual bar */}
        <div
          className={`w-full rounded-t-sm transition-all duration-200 ${barColor}`}
          style={{ height: heightPx || 2 }}
          title={
            day.isFuture
              ? "Future"
              : `${formatDurationShort(day.trackedMs)} tracked${day.met ? " ✓" : ""}`
          }
        />
        {/* Today indicator dot */}
        {day.isToday && (
          <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-orange-400" />
        )}
      </div>
      {/* Day label */}
      <span
        className={`text-xs font-mono truncate w-full text-center ${
          day.isToday
            ? "text-orange-400 font-semibold"
            : day.met
            ? "text-green-400/70"
            : day.isFuture
            ? "text-zinc-600"
            : "text-zinc-500"
        }`}
        title={formatKey(day.dateKey)}
      >
        {formatKey(day.dateKey)}
      </span>
      {/* Duration label */}
      <span
        className={`text-xs font-mono ${
          day.isFuture ? "text-zinc-700" : day.trackedMs > 0 ? "text-zinc-400" : "text-zinc-700"
        }`}
      >
        {day.isFuture ? "—" : day.trackedMs > 0 ? formatDurationShort(day.trackedMs) : "—"}
      </span>
    </div>
  );
}

export function DailyGoalCalendar({
  entries,
  rangeStart,
  rangeEnd,
  dailyGoalHours,
}: DailyGoalCalendarProps) {
  const stats = useMemo(
    () => computeDailyGoal(entries, rangeStart, rangeEnd, dailyGoalHours),
    [entries, rangeStart, rangeEnd, dailyGoalHours]
  );

  if (stats.days.length === 0 || dailyGoalHours <= 0) return null;

  const maxMs = Math.max(
    stats.days.reduce((m, d) => Math.max(m, d.trackedMs), 0),
    stats.days[0]?.goalMs ?? 0
  );

  const metPct =
    stats.totalCount > 0
      ? Math.round((stats.metCount / stats.totalCount) * 100)
      : 0;

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Daily Goal · {dailyGoalHours}h/day
        </h2>
        <div className="flex items-center gap-3 text-xs text-zinc-500">
          {stats.currentStreak > 0 && (
            <span className="flex items-center gap-1 text-orange-400 font-medium">
              🔥 {stats.currentStreak}-day streak
            </span>
          )}
          {stats.bestStreak > 1 && stats.bestStreak > stats.currentStreak && (
            <span className="text-zinc-600">best: {stats.bestStreak}</span>
          )}
        </div>
      </div>

      {/* Stats chips */}
      {stats.totalCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-300 font-mono">
            <span className="text-green-400 font-semibold">{stats.metCount}</span>
            <span className="text-zinc-500"> / {stats.totalCount} days met</span>
          </span>
          {stats.totalCount > 0 && (
            <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-300 font-mono">
              <span className={metPct >= 80 ? "text-green-400" : metPct >= 50 ? "text-orange-400" : "text-red-400"}>
                {metPct}%
              </span>
              <span className="text-zinc-500"> success rate</span>
            </span>
          )}
          {stats.missedCount > 0 && (
            <span className="text-xs bg-zinc-800 px-2.5 py-1 rounded-full text-zinc-500 font-mono">
              {stats.missedCount} {stats.missedCount === 1 ? "miss" : "misses"}
            </span>
          )}
        </div>
      )}

      {/* Bar chart */}
      {stats.days.length > 0 && (
        <div className="flex items-end gap-1 overflow-x-auto pb-1">
          {stats.days.map((day) => (
            <DayBar key={day.dateKey} day={day} maxMs={maxMs} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-zinc-600">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-green-500" /> Goal met
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-orange-400" /> Today (in progress)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-2 rounded-sm bg-orange-600/60" /> Under goal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-6 border-t border-dashed border-zinc-500/60" /> Daily target
        </span>
      </div>
    </section>
  );
}
