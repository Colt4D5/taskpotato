"use client";

import { Project, TimeEntry } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { Badge } from "@/components/ui/Badge";

interface EarningsBreakdownProps {
  projects: Project[];
  entries: TimeEntry[]; // already week-scoped
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function EarningsBreakdown({ projects, entries }: EarningsBreakdownProps) {
  // Only consider projects with a rate set
  const ratedProjects = projects.filter((p) => p.hourlyRate !== undefined && p.hourlyRate > 0);
  if (ratedProjects.length === 0) return null;

  const ratedProjectIds = new Set(ratedProjects.map((p) => p.id));

  // Billable ms per project (only entries marked billable)
  const billableMsMap = new Map<string, number>();
  for (const e of entries) {
    if (!e.projectId || !ratedProjectIds.has(e.projectId)) continue;
    if (e.billable === false) continue;
    billableMsMap.set(
      e.projectId,
      (billableMsMap.get(e.projectId) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt)
    );
  }

  const rows = ratedProjects
    .map((p) => {
      const ms = billableMsMap.get(p.id) ?? 0;
      const hours = ms / 3_600_000;
      const earnings = hours * (p.hourlyRate ?? 0);
      return { project: p, ms, hours, earnings };
    })
    .filter((r) => r.ms > 0 || r.project.hourlyRate! > 0)
    .sort((a, b) => b.earnings - a.earnings);

  if (rows.length === 0) return null;

  const totalEarnings = rows.reduce((sum, r) => sum + r.earnings, 0);
  const maxEarnings = Math.max(...rows.map((r) => r.earnings), 0.01);

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
          Earnings (Billable)
        </h2>
        <span className="text-lg font-mono font-semibold text-green-400">
          {formatCurrency(totalEarnings)}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {rows.map(({ project, ms, earnings }) => {
          const pct = maxEarnings > 0 ? (earnings / maxEarnings) * 100 : 0;
          return (
            <div key={project.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Badge label={project.name} color={project.color} />
                  <span className="text-xs text-zinc-500">
                    @ {formatCurrency(project.hourlyRate!)}/hr
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500 font-mono">
                    {formatDurationShort(ms)}
                  </span>
                  <span className="text-sm font-mono font-semibold text-green-300">
                    {formatCurrency(earnings)}
                  </span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-500/70 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {rows.some((r) => r.ms === 0) && (
        <p className="text-xs text-zinc-600 mt-3 italic">
          Projects with a rate but no billable time this week are not shown.
        </p>
      )}
    </section>
  );
}
