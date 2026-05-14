"use client";

import { useEntries } from "@/hooks/useEntries";
import { useStorage } from "@/hooks/useStorage";
import { useTodayTotal } from "@/hooks/useTodayTotal";
import { AppSettings, DEFAULT_SETTINGS } from "@/types";
import { formatDurationShort } from "@/lib/duration";
import { useState } from "react";

const R = 16;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Compact "today's progress" widget for the desktop sidebar nav.
 *
 * Shows today's total tracked time with a circular progress ring.
 * When a weekly goal is set, the ring fills proportional to
 * today's share of the daily implied goal (weeklyGoal / 5).
 * When no goal is set, an orange arc at 100% opacity is drawn.
 * Ticks live while a timer is running.
 */
export function TodayProgress() {
  const { entries } = useEntries();
  const [settings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);
  const [showTooltip, setShowTooltip] = useState(false);

  const todayMs = useTodayTotal(entries);
  const weeklyGoalMs = (settings.weeklyGoalHours ?? 0) * 60 * 60 * 1000;
  const dailyGoalMs = weeklyGoalMs > 0 ? weeklyGoalMs / 5 : 0;

  const hasGoal = dailyGoalMs > 0;
  const pct = hasGoal ? Math.min(1, todayMs / dailyGoalMs) : 0;
  const dashOffset = CIRCUMFERENCE * (1 - pct);

  const isRunning = entries.some((e) => e.stoppedAt === null);

  const tooltipText = hasGoal
    ? `Today: ${formatDurationShort(todayMs)} / ${formatDurationShort(dailyGoalMs)} daily goal`
    : `Today: ${formatDurationShort(todayMs)}`;

  // Compact label — "4h 23m" becomes two lines: "4h" / "23m" when there's an hour
  // component; otherwise single "Xm"
  const label = formatDurationShort(todayMs);
  const parts = label.split(" "); // ["4h", "23m"] or ["23m"]

  return (
    <div
      className="hidden md:flex md:flex-col md:items-center px-3 py-2 relative cursor-default select-none"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title="Today's tracked time"
    >
      {/* Ring + label stacked in a relative container */}
      <div className="relative w-[38px] h-[38px] flex items-center justify-center">
        {/* SVG ring */}
        <svg
          width="38"
          height="38"
          className="absolute inset-0 -rotate-90"
          aria-hidden
        >
          {/* Track */}
          <circle
            cx="19" cy="19" r={R}
            fill="none"
            stroke="#3f3f46"
            strokeWidth="2.5"
          />

          {/* Progress arc */}
          {hasGoal ? (
            /* Goal mode: fills proportionally; turns green at 100% */
            <circle
              cx="19" cy="19" r={R}
              fill="none"
              stroke={pct >= 1 ? "#22c55e" : "#f97316"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{ transition: "stroke-dashoffset 1s linear" }}
            />
          ) : todayMs > 0 || isRunning ? (
            /* No goal: static muted orange full ring */
            <circle
              cx="19" cy="19" r={R}
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeOpacity="0.4"
            />
          ) : null}
        </svg>

        {/* Time label centered inside ring */}
        <div
          className={`relative flex flex-col items-center leading-none font-mono tabular-nums ${
            isRunning ? "text-orange-400" : todayMs > 0 ? "text-zinc-200" : "text-zinc-600"
          }`}
        >
          {parts.length === 2 ? (
            <>
              <span className="text-[8px]">{parts[0]}</span>
              <span className="text-[8px]">{parts[1]}</span>
            </>
          ) : (
            <span className="text-[9px]">{parts[0]}</span>
          )}
        </div>
      </div>

      {/* Running pulse indicator */}
      {isRunning && (
        <span
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse"
          aria-label="Timer running"
        />
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute left-full ml-2 top-1/2 -translate-y-1/2 z-50 whitespace-nowrap rounded-md bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 text-xs text-zinc-200 shadow-lg pointer-events-none"
          role="tooltip"
        >
          {tooltipText}
        </div>
      )}
    </div>
  );
}
