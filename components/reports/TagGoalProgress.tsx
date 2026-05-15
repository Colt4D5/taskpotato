"use client";

import { useMemo } from "react";
import { TimeEntry, AppSettings } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { startOfWeek } from "@/lib/dateUtils";

interface Props {
  entries: TimeEntry[];
  settings: AppSettings;
  weekOffset: number;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

export function TagGoalProgress({ entries, settings, weekOffset }: Props) {
  const tagGoals = settings.tagGoals ?? {};
  const goalTags = Object.keys(tagGoals).filter((t) => (tagGoals[t] ?? 0) > 0);

  const weekEntries = useMemo(() => {
    const ws = addWeeks(startOfWeek(new Date(), settings.weekStartsOn), weekOffset);
    const we = new Date(ws);
    we.setDate(we.getDate() + 7);
    return entries.filter(
      (e) => e.startedAt >= ws.getTime() && e.startedAt < we.getTime()
    );
  }, [entries, settings.weekStartsOn, weekOffset]);

  const tagMs = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of weekEntries) {
      for (const tag of e.tags ?? []) {
        map.set(tag, (map.get(tag) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
      }
    }
    return map;
  }, [weekEntries]);

  if (goalTags.length === 0) return null;

  // Sort: over-goal first, then by goal size descending
  const sorted = [...goalTags].sort((a, b) => {
    const aMs = tagMs.get(a) ?? 0;
    const bMs = tagMs.get(b) ?? 0;
    const aGoalMs = (tagGoals[a] ?? 0) * 3600000;
    const bGoalMs = (tagGoals[b] ?? 0) * 3600000;
    const aPct = aGoalMs > 0 ? aMs / aGoalMs : 0;
    const bPct = bGoalMs > 0 ? bMs / bGoalMs : 0;
    if (bPct !== aPct) return bPct - aPct;
    return bGoalMs - aGoalMs;
  });

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
        Tag Goals
      </h2>
      <div className="flex flex-col gap-4">
        {sorted.map((tag) => {
          const goalHours = tagGoals[tag] ?? 0;
          const goalMs = goalHours * 3600000;
          const trackedMs = tagMs.get(tag) ?? 0;
          const pct = goalMs > 0 ? Math.min(100, Math.round((trackedMs / goalMs) * 100)) : 0;
          const overGoal = trackedMs >= goalMs;
          const remainingMs = Math.max(0, goalMs - trackedMs);
          const overMs = Math.max(0, trackedMs - goalMs);

          return (
            <div key={tag}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-300">#{tag}</span>
                  {overGoal && trackedMs > 0 && (
                    <span className="text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5">
                      ✓ Done
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-300">
                    {formatDurationShort(trackedMs)}
                  </span>
                  <span className="text-xs text-zinc-600">/</span>
                  <span className="text-xs text-zinc-500">{goalHours}h goal</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    overGoal
                      ? "bg-green-500"
                      : pct >= 75
                      ? "bg-orange-400"
                      : "bg-orange-500/60"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Sub-label */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-zinc-600">{pct}%</span>
                {overGoal && overMs > 0 ? (
                  <span className="text-xs text-green-500">
                    +{formatDurationShort(overMs)} over
                  </span>
                ) : remainingMs > 0 ? (
                  <span className="text-xs text-zinc-600">
                    {formatDurationShort(remainingMs)} remaining
                  </span>
                ) : (
                  <span className="text-xs text-zinc-700">No time yet</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
