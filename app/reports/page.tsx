"use client";

import { useState } from "react";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { startOfWeek } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { computeStreaks } from "@/lib/streaks";
import { ActivityHeatmap } from "@/components/reports/ActivityHeatmap";
import { WeeklyGoalProgress } from "@/components/reports/WeeklyGoalProgress";
import { ProjectBudgetCard } from "@/components/reports/ProjectBudgetCard";
import { useStorage } from "@/hooks/useStorage";
import { AppSettings, DEFAULT_SETTINGS } from "@/types";

function getWeekDays(weekStart: Date): { label: string; date: Date }[] {
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    days.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      date: d,
    });
  }
  return days;
}

function addWeeks(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

export default function ReportsPage() {
  const { completedEntries } = useEntries();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const [settings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);

  const [weekOffset, setWeekOffset] = useState(0);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const baseWeekStart = startOfWeek(new Date(), 1);
  const weekStart = addWeeks(baseWeekStart, weekOffset);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const weekEntries = completedEntries.filter(
    (e) => e.startedAt >= weekStart.getTime() && e.startedAt < weekEnd.getTime()
  );

  const weekDays = getWeekDays(weekStart);

  // Hours per day this week
  const hoursPerDay = weekDays.map(({ date }) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const ms = weekEntries
      .filter(
        (e) =>
          e.startedAt >= dayStart.getTime() && e.startedAt <= dayEnd.getTime()
      )
      .reduce((sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt), 0);
    return { label: date.toLocaleDateString("en-US", { weekday: "short" }), ms };
  });

  const maxMs = Math.max(...hoursPerDay.map((d) => d.ms), 1);

  // Project breakdown this week
  const projectMs = new Map<string, number>();
  for (const e of weekEntries) {
    const key = e.projectId ?? "__none__";
    projectMs.set(key, (projectMs.get(key) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
  }

  // Task totals this week
  const taskMs = new Map<string, number>();
  for (const e of weekEntries) {
    if (e.taskId) {
      taskMs.set(e.taskId, (taskMs.get(e.taskId) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
    }
  }

  const totalWeekMs = weekEntries.reduce(
    (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
    0
  );

  const sortedProjects = Array.from(projectMs.entries())
    .filter(([k]) => k !== "__none__")
    .sort((a, b) => b[1] - a[1]);

  const noProjectMs = projectMs.get("__none__") ?? 0;

  // Tag totals this week
  const tagMs = new Map<string, number>();
  for (const e of weekEntries) {
    for (const tag of (e.tags ?? [])) {
      tagMs.set(tag, (tagMs.get(tag) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
    }
  }
  const sortedTags = Array.from(tagMs.entries()).sort((a, b) => b[1] - a[1]);

  // Billable breakdown
  const billableMs = weekEntries
    .filter((e) => e.billable !== false)
    .reduce((sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt), 0);
  const nonBillableMs = totalWeekMs - billableMs;

  const sortedTasks = Array.from(taskMs.entries()).sort((a, b) => b[1] - a[1]);

  // Streak stats (all-time, not week-scoped)
  const streakStats = computeStreaks(completedEntries);

  const isCurrentWeek = weekOffset === 0;

  const weekLabel = `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-6">Reports</h1>

      {/* Streak stats */}
      {streakStats.totalActiveDays > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
            Activity
          </h2>
          <div className="flex items-center gap-6 mb-5">
            <div className="text-center">
              <p className="text-2xl font-semibold text-orange-400">
                {streakStats.currentStreak}
                <span className="text-lg ml-0.5">🔥</span>
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">Current streak</p>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="text-center">
              <p className="text-2xl font-semibold text-zinc-200">{streakStats.longestStreak}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Longest streak</p>
            </div>
            <div className="w-px h-10 bg-zinc-800" />
            <div className="text-center">
              <p className="text-2xl font-semibold text-zinc-200">{streakStats.totalActiveDays}</p>
              <p className="text-xs text-zinc-500 mt-0.5">Active days</p>
            </div>
          </div>
          <ActivityHeatmap stats={streakStats} />
        </section>
      )}

      {/* Week navigator */}
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset((o) => o - 1)}
          className="text-zinc-400 hover:text-zinc-100 px-3 py-1.5 border border-zinc-800 rounded-lg"
        >
          ← Prev
        </Button>
        <div className="text-center">
          <p className="text-sm font-medium text-zinc-200">{weekLabel}</p>
          {!isCurrentWeek && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-orange-400 hover:text-orange-300 mt-0.5"
            >
              Back to this week
            </button>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setWeekOffset((o) => o + 1)}
          disabled={isCurrentWeek}
          className="text-zinc-400 hover:text-zinc-100 px-3 py-1.5 border border-zinc-800 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Next →
        </Button>
      </div>

      {/* This week total */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">{isCurrentWeek ? "This week" : "Week total"}</p>
          <p className="text-3xl font-mono font-semibold text-zinc-100 mt-0.5">
            {formatDurationShort(totalWeekMs)}
          </p>
        </div>
        <p className="text-xs text-zinc-600">{weekLabel}</p>
      </div>

      {/* Weekly goal progress */}
      {(settings.weeklyGoalHours ?? 0) > 0 && (
        <WeeklyGoalProgress
          totalMs={totalWeekMs}
          goalHours={settings.weeklyGoalHours}
          isCurrentWeek={isCurrentWeek}
        />
      )}

      {/* Billable vs Non-billable */}
      {totalWeekMs > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
            Billable vs Non-Billable
          </h2>
          <div className="flex flex-col gap-3">
            {/* Stacked bar */}
            <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800 w-full">
              {billableMs > 0 && (
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${(billableMs / totalWeekMs) * 100}%` }}
                />
              )}
              {nonBillableMs > 0 && (
                <div
                  className="h-full bg-zinc-600 transition-all"
                  style={{ width: `${(nonBillableMs / totalWeekMs) * 100}%` }}
                />
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span className="text-sm text-zinc-300">Billable</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-500">
                  {totalWeekMs > 0 ? Math.round((billableMs / totalWeekMs) * 100) : 0}%
                </span>
                <span className="text-sm font-mono text-zinc-300">{formatDurationShort(billableMs)}</span>
              </div>
            </div>
            {nonBillableMs > 0 && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-600" />
                  <span className="text-sm text-zinc-300">Non-Billable</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-zinc-500">
                    {Math.round((nonBillableMs / totalWeekMs) * 100)}%
                  </span>
                  <span className="text-sm font-mono text-zinc-300">{formatDurationShort(nonBillableMs)}</span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bar chart */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
          Hours per Day
        </h2>
        <div className="flex items-end gap-2 h-24">
          {hoursPerDay.map(({ label, ms }) => (
            <div key={label} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                <div
                  className="w-full rounded-t bg-orange-500/80"
                  style={{
                    height: `${Math.round((ms / maxMs) * 72)}px`,
                    minHeight: ms > 0 ? "2px" : "0",
                  }}
                />
              </div>
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Project breakdown */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
          By Project
        </h2>
        {sortedProjects.length === 0 && noProjectMs === 0 ? (
          <p className="text-sm text-zinc-600 italic">No tracked time this week.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {sortedProjects.map(([projectId, ms]) => {
              const project = projectMap.get(projectId);
              const pct = totalWeekMs > 0 ? Math.round((ms / totalWeekMs) * 100) : 0;
              return (
                <div key={projectId}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {project ? (
                        <Badge label={project.name} color={project.color} />
                      ) : (
                        <span className="text-sm text-zinc-500">Unknown</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{pct}%</span>
                      <span className="text-sm font-mono text-zinc-300">
                        {formatDurationShort(ms)}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: project?.color ?? "#52525b",
                      }}
                    />
                  </div>
                </div>
              );
            })}
            {noProjectMs > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-zinc-500 italic">No project</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {totalWeekMs > 0 ? Math.round((noProjectMs / totalWeekMs) * 100) : 0}%
                    </span>
                    <span className="text-sm font-mono text-zinc-300">
                      {formatDurationShort(noProjectMs)}
                    </span>
                  </div>
                </div>
                <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-zinc-600 transition-all"
                    style={{
                      width: `${totalWeekMs > 0 ? Math.round((noProjectMs / totalWeekMs) * 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Task totals */}
      {sortedTasks.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
            Task Totals
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-zinc-500 border-b border-zinc-800">
                <th className="text-left pb-2 font-medium">Task</th>
                <th className="text-left pb-2 font-medium">Project</th>
                <th className="text-right pb-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {sortedTasks.map(([taskId, ms]) => {
                const task = taskMap.get(taskId);
                const proj = task?.projectId ? projectMap.get(task.projectId) : undefined;
                return (
                  <tr key={taskId} className="group">
                    <td className="py-2.5 text-zinc-200 pr-4">
                      {task?.name ?? <span className="italic text-zinc-500">Unknown task</span>}
                    </td>
                    <td className="py-2.5 pr-4">
                      {proj ? (
                        <Badge label={proj.name} color={proj.color} />
                      ) : (
                        <span className="text-zinc-600 text-xs">—</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right font-mono text-zinc-300">
                      {formatDurationShort(ms)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      )}

      {/* Tag totals */}
      {sortedTags.length > 0 && (
        <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4">
          <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
            Tag Totals
          </h2>
          <div className="flex flex-col gap-3">
            {sortedTags.map(([tag, ms]) => {
              const pct = totalWeekMs > 0 ? Math.round((ms / totalWeekMs) * 100) : 0;
              return (
                <div key={tag}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-zinc-300">#{tag}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-500">{pct}%</span>
                      <span className="text-sm font-mono text-zinc-300">{formatDurationShort(ms)}</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-orange-400/60 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <ProjectBudgetCard projects={projects} entries={completedEntries} />
    </div>
  );
}
