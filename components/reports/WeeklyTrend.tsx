"use client";

import { useMemo, useState } from "react";
import { TimeEntry, Project } from "@/types";
import { startOfWeek, startOfDay } from "@/lib/dateUtils";
import { elapsedMs, formatDurationShort } from "@/lib/duration";

interface Props {
  entries: TimeEntry[];
  projects: Project[];
  weekStartsOn: 0 | 1;
}

interface WeekBar {
  /** Label for x-axis, e.g. "Apr 7" */
  label: string;
  /** ISO date string of week start */
  weekKey: string;
  totalMs: number;
  billableMs: number;
  nonBillableMs: number;
}

const WEEKS = 12;

function getWeekStart(date: Date, weekStartsOn: 0 | 1): Date {
  return startOfWeek(date, weekStartsOn);
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function toWeekKey(date: Date): string {
  return date.toLocaleDateString("en-CA"); // YYYY-MM-DD
}

type BreakdownMode = "total" | "billable";

export function WeeklyTrend({ entries, projects: _projects, weekStartsOn }: Props) {
  const [mode, setMode] = useState<BreakdownMode>("total");

  const bars = useMemo<WeekBar[]>(() => {
    const now = new Date();
    const thisWeekStart = getWeekStart(now, weekStartsOn);

    // Build an array of WEEKS week-start dates, oldest first
    const weekStarts: Date[] = [];
    for (let i = WEEKS - 1; i >= 0; i--) {
      weekStarts.push(addWeeks(thisWeekStart, -i));
    }

    // Map week key → accumulated ms
    const buckets = new Map<string, { totalMs: number; billableMs: number }>();
    for (const ws of weekStarts) {
      buckets.set(toWeekKey(ws), { totalMs: 0, billableMs: 0 });
    }

    const oldestStart = weekStarts[0].getTime();
    const newestEnd = addWeeks(thisWeekStart, 1).getTime(); // exclusive upper bound

    for (const e of entries) {
      if (e.stoppedAt === null) continue;
      if (e.startedAt < oldestStart || e.startedAt >= newestEnd) continue;

      // Find which week bucket this entry belongs to
      const entryDate = new Date(e.startedAt);
      const ws = getWeekStart(entryDate, weekStartsOn);
      const key = toWeekKey(ws);
      if (!buckets.has(key)) continue;

      const ms = elapsedMs(e.startedAt, e.stoppedAt) + (e.offsetMs ?? 0);
      const bucket = buckets.get(key)!;
      bucket.totalMs += ms;
      if (e.billable !== false) bucket.billableMs += ms;
    }

    return weekStarts.map((ws) => {
      const key = toWeekKey(ws);
      const bucket = buckets.get(key) ?? { totalMs: 0, billableMs: 0 };
      return {
        label: ws.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        weekKey: key,
        totalMs: bucket.totalMs,
        billableMs: bucket.billableMs,
        nonBillableMs: bucket.totalMs - bucket.billableMs,
      };
    });
  }, [entries, weekStartsOn]);

  const maxMs = useMemo(() => Math.max(...bars.map((b) => b.totalMs), 1), [bars]);
  const totalTracked = bars.reduce((sum, b) => sum + b.totalMs, 0);

  if (totalTracked === 0) return null;

  // Average over weeks that have any time
  const activeWeeks = bars.filter((b) => b.totalMs > 0).length;
  const avgMs = activeWeeks > 0 ? totalTracked / activeWeeks : 0;
  const avgBillableMs = bars.reduce((sum, b) => sum + b.billableMs, 0) / Math.max(activeWeeks, 1);

  const thisWeekKey = toWeekKey(getWeekStart(new Date(), weekStartsOn));
  const thisWeek = bars.find((b) => b.weekKey === thisWeekKey);

  return (
    <div className="bg-zinc-800/50 rounded-xl p-5 border border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider">
            12-Week Trend
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Rolling weekly totals</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setMode("total")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === "total"
                ? "bg-orange-500 text-white"
                : "bg-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setMode("billable")}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              mode === "billable"
                ? "bg-orange-500 text-white"
                : "bg-zinc-700 text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Billable split
          </button>
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="bg-zinc-700/60 rounded-lg px-3 py-2">
          <p className="text-xs text-zinc-400">12-wk total</p>
          <p className="text-sm font-semibold text-orange-400 mt-0.5">
            {formatDurationShort(totalTracked)}
          </p>
        </div>
        <div className="bg-zinc-700/60 rounded-lg px-3 py-2">
          <p className="text-xs text-zinc-400">Avg / active week</p>
          <p className="text-sm font-semibold text-zinc-200 mt-0.5">
            {formatDurationShort(Math.round(avgMs))}
          </p>
        </div>
        <div className="bg-zinc-700/60 rounded-lg px-3 py-2">
          <p className="text-xs text-zinc-400">Avg billable / wk</p>
          <p className="text-sm font-semibold text-green-400 mt-0.5">
            {formatDurationShort(Math.round(avgBillableMs))}
          </p>
        </div>
        {thisWeek && thisWeek.totalMs > 0 && (
          <div className="bg-zinc-700/60 rounded-lg px-3 py-2">
            <p className="text-xs text-zinc-400">This week</p>
            <p className="text-sm font-semibold text-zinc-200 mt-0.5">
              {formatDurationShort(thisWeek.totalMs)}
            </p>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-36 w-full">
        {bars.map((bar) => {
          const isCurrentWeek = bar.weekKey === thisWeekKey;
          const heightPct = (bar.totalMs / maxMs) * 100;
          const billablePct = bar.totalMs > 0 ? (bar.billableMs / bar.totalMs) * 100 : 0;

          return (
            <div key={bar.weekKey} className="flex flex-col items-center flex-1 min-w-0 h-full group relative">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
                <div className="bg-zinc-900 border border-zinc-600 rounded-md px-2.5 py-1.5 text-xs whitespace-nowrap shadow-lg">
                  <p className="text-zinc-200 font-medium">{bar.label}</p>
                  {bar.totalMs > 0 ? (
                    <>
                      <p className="text-orange-400">Total: {formatDurationShort(bar.totalMs)}</p>
                      {mode === "billable" && (
                        <>
                          <p className="text-green-400">
                            Billable: {formatDurationShort(bar.billableMs)}
                          </p>
                          <p className="text-zinc-400">
                            Non-billable: {formatDurationShort(bar.nonBillableMs)}
                          </p>
                        </>
                      )}
                    </>
                  ) : (
                    <p className="text-zinc-500">No time logged</p>
                  )}
                </div>
                <div className="w-2 h-2 bg-zinc-900 border-r border-b border-zinc-600 rotate-45 -mt-1" />
              </div>

              {/* Bar column */}
              <div className="flex-1 w-full flex items-end">
                {bar.totalMs === 0 ? (
                  <div className="w-full h-1 rounded bg-zinc-700/40" />
                ) : mode === "total" ? (
                  <div
                    className={`w-full rounded-t transition-all ${
                      isCurrentWeek ? "bg-orange-500" : "bg-orange-500/60"
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                ) : (
                  /* Stacked: billable (green) on top, non-billable (zinc) on bottom */
                  <div
                    className="w-full rounded-t overflow-hidden flex flex-col-reverse"
                    style={{ height: `${heightPct}%` }}
                  >
                    <div
                      className={`w-full ${isCurrentWeek ? "bg-zinc-500" : "bg-zinc-600/80"}`}
                      style={{ height: `${100 - billablePct}%` }}
                    />
                    <div
                      className={`w-full ${isCurrentWeek ? "bg-green-400" : "bg-green-500/70"}`}
                      style={{ height: `${billablePct}%` }}
                    />
                  </div>
                )}
              </div>

              {/* X-axis label */}
              <p
                className={`text-center mt-1 leading-tight truncate w-full px-0.5 ${
                  isCurrentWeek ? "text-orange-400 font-semibold" : "text-zinc-500"
                }`}
                style={{ fontSize: "9px" }}
              >
                {bar.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Legend (billable mode only) */}
      {mode === "billable" && (
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-xs text-zinc-400">Billable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-zinc-600" />
            <span className="text-xs text-zinc-400">Non-billable</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-orange-500" />
            <span className="text-xs text-zinc-400">Current week</span>
          </div>
        </div>
      )}
    </div>
  );
}
