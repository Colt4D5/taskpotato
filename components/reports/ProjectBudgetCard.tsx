"use client";

import { Project, TimeEntry } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";

interface ProjectBudgetCardProps {
  projects: Project[];
  entries: TimeEntry[];
}

function BudgetRow({ project, totalMs }: { project: Project; totalMs: number }) {
  const budgetMs = (project.budgetHours ?? 0) * 3_600_000;
  const pct = Math.min(totalMs / budgetMs, 1);
  const over = totalMs > budgetMs;
  const warn = pct >= 0.8 && !over;

  const barColor = over
    ? "bg-red-500"
    : warn
    ? "bg-amber-500"
    : "bg-orange-500";

  const labelColor = over
    ? "text-red-400"
    : warn
    ? "text-amber-400"
    : "text-zinc-400";

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <span className="text-zinc-200">{project.name}</span>
          {over && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 border border-red-700/50">
              over budget
            </span>
          )}
          {warn && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-700/50">
              near limit
            </span>
          )}
        </div>
        <span className={`text-xs font-mono ${labelColor}`}>
          {formatDurationShort(totalMs)} / {project.budgetHours}h
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{Math.round(pct * 100)}% used</span>
        <span>
          {over
            ? `${formatDurationShort(totalMs - budgetMs)} over`
            : `${formatDurationShort(budgetMs - totalMs)} remaining`}
        </span>
      </div>
    </div>
  );
}

export function ProjectBudgetCard({ projects, entries }: ProjectBudgetCardProps) {
  const budgetedProjects = projects.filter(
    (p) => p.budgetHours && p.budgetHours > 0 && !p.archived
  );

  if (budgetedProjects.length === 0) return null;

  // All-time totals per project
  const totalMsMap = new Map<string, number>();
  for (const e of entries) {
    if (!e.projectId) continue;
    totalMsMap.set(
      e.projectId,
      (totalMsMap.get(e.projectId) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt)
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-zinc-100">Project Budgets</h2>
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-5">
        {budgetedProjects.map((p) => (
          <BudgetRow
            key={p.id}
            project={p}
            totalMs={totalMsMap.get(p.id) ?? 0}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Budget burn is calculated from all tracked time (all-time, not just this week).
      </p>
    </section>
  );
}
