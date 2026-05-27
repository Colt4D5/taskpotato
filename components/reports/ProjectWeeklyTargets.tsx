"use client";

import { useMemo } from "react";
import { Project, TimeEntry } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { Badge } from "@/components/ui/Badge";

interface Props {
  projects: Project[];
  /** Entries already filtered to the current week's range */
  weekEntries: TimeEntry[];
}

export function ProjectWeeklyTargets({ projects, weekEntries }: Props) {
  // Only care about projects with a weekly target set
  const targetedProjects = projects.filter(
    (p) => !p.archived && (p.weeklyTargetHours ?? 0) > 0
  );

  const projectMs = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of weekEntries) {
      if (e.projectId) {
        map.set(e.projectId, (map.get(e.projectId) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
      }
    }
    return map;
  }, [weekEntries]);

  if (targetedProjects.length === 0) return null;

  // Sort by progress percentage descending so the most-advanced targets surface first
  const sorted = [...targetedProjects].sort((a, b) => {
    const aMs = projectMs.get(a.id) ?? 0;
    const bMs = projectMs.get(b.id) ?? 0;
    const aGoalMs = (a.weeklyTargetHours ?? 0) * 3_600_000;
    const bGoalMs = (b.weeklyTargetHours ?? 0) * 3_600_000;
    const aPct = aGoalMs > 0 ? aMs / aGoalMs : 0;
    const bPct = bGoalMs > 0 ? bMs / bGoalMs : 0;
    if (bPct !== aPct) return bPct - aPct;
    return bGoalMs - aGoalMs;
  });

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
        Project Weekly Targets
      </h2>
      <div className="flex flex-col gap-4">
        {sorted.map((project) => {
          const goalHours = project.weeklyTargetHours ?? 0;
          const goalMs = goalHours * 3_600_000;
          const trackedMs = projectMs.get(project.id) ?? 0;
          const rawPct = goalMs > 0 ? trackedMs / goalMs : 0;
          const displayPct = Math.min(100, Math.round(rawPct * 100));
          const overGoal = trackedMs >= goalMs;
          const remainingMs = Math.max(0, goalMs - trackedMs);
          const overMs = Math.max(0, trackedMs - goalMs);

          // Color tier: green when done, orange-400 at 75%+, muted below
          const barColor = overGoal
            ? "bg-green-500"
            : rawPct >= 0.75
            ? "bg-orange-400"
            : "bg-orange-500/60";

          return (
            <div key={project.id}>
              {/* Header row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Badge label={project.name} color={project.color} />
                  {overGoal && (
                    <span className="text-xs font-medium text-green-400 bg-green-500/10 border border-green-500/20 rounded px-1.5 py-0.5">
                      ✓ Done
                    </span>
                  )}
                  {!overGoal && rawPct >= 0.8 && rawPct < 1 && (
                    <span className="text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                      Near target
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-zinc-300">
                    {formatDurationShort(trackedMs)}
                  </span>
                  <span className="text-xs text-zinc-600">/</span>
                  <span className="text-xs text-zinc-500">{goalHours}h target</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="relative h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${displayPct}%` }}
                />
              </div>

              {/* Sub-label */}
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-zinc-600">{displayPct}%</span>
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
