"use client";

import { useMemo } from "react";
import { TimeEntry, Project } from "@/types";
import { computeWeekComparison } from "@/lib/weekComparison";
import { formatDurationShort } from "@/lib/duration";
import { Badge } from "@/components/ui/Badge";

interface WeekComparisonProps {
  currentEntries: TimeEntry[];
  previousEntries: TimeEntry[];
  projects: Project[];
  /** Label for the current week, e.g. "May 26 – Jun 1" */
  currentLabel: string;
  /** Label for the previous week, e.g. "May 19 – May 25" */
  previousLabel: string;
}

function DeltaPill({ deltaMs, deltaPct }: { deltaMs: number; deltaPct: number | null }) {
  if (deltaMs === 0) {
    return (
      <span className="text-xs font-mono text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded">
        —
      </span>
    );
  }
  const positive = deltaMs > 0;
  const arrow = positive ? "↑" : "↓";
  const colorClass = positive
    ? "text-green-400 bg-green-400/10"
    : "text-red-400 bg-red-400/10";
  const pctStr = deltaPct !== null ? ` ${Math.abs(deltaPct)}%` : "";
  return (
    <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${colorClass}`}>
      {arrow} {formatDurationShort(Math.abs(deltaMs))}{pctStr}
    </span>
  );
}

export function WeekComparison({
  currentEntries,
  previousEntries,
  projects,
  currentLabel,
  previousLabel,
}: WeekComparisonProps) {
  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const data = useMemo(
    () => computeWeekComparison(currentEntries, previousEntries),
    [currentEntries, previousEntries]
  );

  // Nothing to show if both weeks are empty
  if (data.currentMs === 0 && data.previousMs === 0) return null;

  const maxMs = Math.max(data.currentMs, data.previousMs, 1);

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Week over Week
        </h2>
        <DeltaPill deltaMs={data.deltaMs} deltaPct={data.deltaPct} />
      </div>

      {/* Totals comparison row */}
      <div className="flex items-stretch gap-4 mb-5 pb-4 border-b border-zinc-800">
        {/* Previous week */}
        <div className="flex-1">
          <p className="text-[11px] text-zinc-500 mb-1 truncate">{previousLabel}</p>
          <p className="text-xl font-mono text-zinc-400">
            {formatDurationShort(data.previousMs)}
          </p>
          <div className="mt-1.5 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-zinc-600 transition-all duration-300"
              style={{ width: `${(data.previousMs / maxMs) * 100}%` }}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-zinc-800 self-stretch" />

        {/* Current week */}
        <div className="flex-1">
          <p className="text-[11px] text-zinc-500 mb-1 truncate">{currentLabel}</p>
          <p className="text-xl font-mono text-orange-300">
            {formatDurationShort(data.currentMs)}
          </p>
          <div className="mt-1.5 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-400 transition-all duration-300"
              style={{ width: `${(data.currentMs / maxMs) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Per-project rows */}
      {data.rows.length > 0 && (
        <div className="flex flex-col gap-3">
          {data.rows.map((row) => {
            const project = row.projectId ? projectMap.get(row.projectId) : undefined;
            const rowMax = Math.max(row.currentMs, row.previousMs, 1);
            const rowMaxAll = Math.max(data.currentMs, data.previousMs, 1);
            // Scale bars relative to the overall total so widths are comparable across rows
            const prevWidth = (row.previousMs / rowMaxAll) * 100;
            const curWidth = (row.currentMs / rowMaxAll) * 100;

            return (
              <div key={row.projectId ?? "__none__"}>
                {/* Project name + delta */}
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {project ? (
                      <Badge label={project.name} color={project.color} />
                    ) : (
                      <span className="text-xs text-zinc-500 italic">No project</span>
                    )}
                  </div>
                  <DeltaPill deltaMs={row.deltaMs} deltaPct={row.deltaPct} />
                </div>

                {/* Dual-bar: prev (zinc) on top, current (project color / orange) below */}
                <div className="flex flex-col gap-0.5">
                  {/* Previous */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 w-6 text-right shrink-0">
                      prev
                    </span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-zinc-600 transition-all duration-300"
                        style={{ width: `${prevWidth}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 w-14 text-right shrink-0">
                      {row.previousMs > 0 ? formatDurationShort(row.previousMs) : "—"}
                    </span>
                  </div>
                  {/* Current */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-600 w-6 text-right shrink-0">
                      this
                    </span>
                    <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${curWidth}%`,
                          backgroundColor: project?.color ?? "#f97316",
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-400 w-14 text-right shrink-0">
                      {row.currentMs > 0 ? formatDurationShort(row.currentMs) : "—"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer note */}
      <p className="mt-4 text-[11px] text-zinc-600">
        Comparing completed entries only.{" "}
        {data.previousMs === 0 && (
          <span>No data for the previous week — delta percentages unavailable.</span>
        )}
      </p>
    </section>
  );
}
