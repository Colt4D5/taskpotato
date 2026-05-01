"use client";

import { useMemo } from "react";
import type { TimeEntry } from "@/types";
import { formatDurationShort } from "@/lib/duration";
import { formatDayLabel } from "@/lib/dateUtils";

interface LogStatsBarProps {
  entries: TimeEntry[];
}

export function LogStatsBar({ entries }: LogStatsBarProps) {
  const stats = useMemo(() => {
    if (entries.length === 0) return null;

    let totalMs = 0;
    let billableMs = 0;
    const days = new Set<string>();

    for (const e of entries) {
      if (!e.stoppedAt) continue;
      const ms = e.stoppedAt - e.startedAt;
      totalMs += ms;
      if (e.billable !== false) billableMs += ms;
      // YYYY-MM-DD local date
      days.add(new Date(e.startedAt).toLocaleDateString("en-CA"));
    }

    const dayCount = days.size || 1;
    const avgPerDayMs = totalMs / dayCount;
    const billablePct = totalMs > 0 ? Math.round((billableMs / totalMs) * 100) : 0;

    return { totalMs, billableMs, billablePct, entryCount: entries.length, dayCount, avgPerDayMs };
  }, [entries]);

  if (!stats) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {/* Total time */}
      <StatChip
        label="Total"
        value={formatDurationShort(stats.totalMs)}
        accent="orange"
      />

      {/* Billable */}
      <StatChip
        label={`Billable (${stats.billablePct}%)`}
        value={formatDurationShort(stats.billableMs)}
        accent="green"
      />

      {/* Entries */}
      <StatChip
        label="Entries"
        value={String(stats.entryCount)}
      />

      {/* Days */}
      <StatChip
        label="Days"
        value={String(stats.dayCount)}
      />

      {/* Avg / day — only meaningful when >1 day */}
      {stats.dayCount > 1 && (
        <StatChip
          label="Avg / day"
          value={formatDurationShort(stats.avgPerDayMs)}
        />
      )}
    </div>
  );
}

interface StatChipProps {
  label: string;
  value: string;
  accent?: "orange" | "green";
}

function StatChip({ label, value, accent }: StatChipProps) {
  const valueColor =
    accent === "orange"
      ? "text-orange-400"
      : accent === "green"
      ? "text-emerald-400"
      : "text-zinc-200";

  return (
    <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5">
      <span className="text-xs text-zinc-500 font-medium">{label}</span>
      <span className={`text-sm font-mono font-semibold ${valueColor}`}>{value}</span>
    </div>
  );
}
