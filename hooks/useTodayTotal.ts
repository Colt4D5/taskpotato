"use client";

import { useState, useEffect, useRef } from "react";
import { TimeEntry } from "@/types";
import { startOfDay, endOfDay } from "@/lib/dateUtils";
import { elapsedMs } from "@/lib/duration";

/**
 * Computes today's total tracked milliseconds, live-ticking when a timer is
 * running. Updates once per second while the timer is active; stays static
 * when no timer is running.
 */
export function useTodayTotal(entries: TimeEntry[]): number {
  const [tick, setTick] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const running = entries.find((e) => e.stoppedAt === null) ?? null;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setTick((t) => t + 1), 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [running?.id]); // re-subscribe when running entry id changes

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  let total = 0;
  for (const e of entries) {
    // include entries that started today, or are running and started any time
    // (a timer started yesterday that is still running counts toward today
    //  only the portion from midnight onward)
    const start = e.startedAt;
    const stop = e.stoppedAt ?? Date.now();

    // Only include entries that overlap with today
    if (stop < todayStart || start > todayEnd) continue;

    const clampedStart = Math.max(start, todayStart);
    const clampedStop = Math.min(stop, todayEnd);

    // For a running entry, use the accumulated offset + live elapsed
    if (e.stoppedAt === null) {
      const priorMs = e.offsetMs ?? 0;
      const liveStart = e.resumedAt ?? e.startedAt;
      const liveElapsed = Date.now() - liveStart;
      // Clamp to today only: live portion started at max(liveStart, todayStart)
      const effectiveStart = Math.max(liveStart, todayStart);
      const liveToday = Math.max(0, Date.now() - effectiveStart);
      // Prior runs (offsetMs) — we can't easily clamp those to today without
      // more metadata, so include them only if startedAt is today
      const priorToday = start >= todayStart ? priorMs : 0;
      total += priorToday + liveToday;
    } else {
      total += clampedStop - clampedStart;
    }
  }

  return Math.max(0, total);
}
