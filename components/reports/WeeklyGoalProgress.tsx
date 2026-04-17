"use client";

import { formatDurationShort } from "@/lib/duration";
import { cn } from "@/lib/cn";

interface WeeklyGoalProgressProps {
  totalMs: number;
  goalHours: number;
  isCurrentWeek: boolean;
}

export function WeeklyGoalProgress({ totalMs, goalHours, isCurrentWeek }: WeeklyGoalProgressProps) {
  const goalMs = goalHours * 3600 * 1000;
  const pct = Math.min((totalMs / goalMs) * 100, 100);
  const overMs = totalMs > goalMs ? totalMs - goalMs : 0;
  const remainingMs = totalMs < goalMs ? goalMs - totalMs : 0;
  const reached = totalMs >= goalMs;

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Weekly Goal
        </h2>
        <span className="text-xs text-zinc-500">
          Target: {goalHours}h / week
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 bg-zinc-800 rounded-full overflow-hidden mb-3">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            reached ? "bg-green-500" : "bg-orange-500"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {reached ? (
            <span className="text-green-400 text-sm font-medium">
              ✓ Goal reached{overMs > 0 ? ` (+${formatDurationShort(overMs)} over)` : ""}
            </span>
          ) : isCurrentWeek ? (
            <span className="text-zinc-400 text-sm">
              {formatDurationShort(remainingMs)} remaining
            </span>
          ) : (
            <span className="text-zinc-500 text-sm italic">Goal not reached</span>
          )}
        </div>
        <span className="text-sm font-mono text-zinc-300">
          {formatDurationShort(totalMs)}{" "}
          <span className="text-zinc-600">/ {goalHours}h</span>
        </span>
      </div>

      {/* Percentage label */}
      <div className="mt-2">
        <span
          className={cn(
            "text-xs font-medium",
            reached ? "text-green-500" : "text-orange-400"
          )}
        >
          {Math.round(pct)}% complete
        </span>
      </div>
    </section>
  );
}
