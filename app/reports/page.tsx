"use client";

import { useState, useMemo } from "react";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { startOfWeek } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { computeStreaks } from "@/lib/streaks";
import { ActivityHeatmap } from "@/components/reports/ActivityHeatmap";
import { WeeklyGoalProgress } from "@/components/reports/WeeklyGoalProgress";
import { ProjectBudgetCard } from "@/components/reports/ProjectBudgetCard";
import { ClientBreakdown } from "@/components/reports/ClientBreakdown";
import { EarningsBreakdown } from "@/components/reports/EarningsBreakdown";
import { useStorage } from "@/hooks/useStorage";
import { AppSettings, DEFAULT_SETTINGS } from "@/types";

type ReportMode = "week" | "custom";

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

/** ISO date string (YYYY-MM-DD) from a Date */
function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Parse a YYYY-MM-DD string as local midnight */
function fromIsoDate(s: string): Date {
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day, 0, 0, 0, 0);
}

/** All calendar days between two dates (inclusive), up to maxDays to avoid insane renders */
function daysBetween(start: Date, end: Date, maxDays = 60): { label: string; date: Date }[] {
  const days: { label: string; date: Date }[] = [];
  const cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);
  const endMs = end.getTime();
  while (cursor.getTime() <= endMs && days.length < maxDays) {
    days.push({
      label: cursor.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      date: new Date(cursor),
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

export default function ReportsPage() {
  const { completedEntries } = useEntries();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { clients } = useClients();
  const [settings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);

  const [mode, setMode] = useState<ReportMode>("week");
  const [weekOffset, setWeekOffset] = useState(0);

  // Custom range state — default to this week
  const baseWeekStart = startOfWeek(new Date(), 1);
  const [customFrom, setCustomFrom] = useState<string>(toIsoDate(baseWeekStart));
  const [customTo, setCustomTo] = useState<string>(toIsoDate(new Date()));

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Derive range bounds from mode
  const { rangeStart, rangeEnd, isCurrentWeek } = useMemo(() => {
    if (mode === "week") {
      const ws = addWeeks(baseWeekStart, weekOffset);
      const we = new Date(ws);
      we.setDate(we.getDate() + 7);
      return { rangeStart: ws, rangeEnd: we, isCurrentWeek: weekOffset === 0 };
    } else {
      const from = fromIsoDate(customFrom);
      const to = fromIsoDate(customTo);
      // end of the "to" day
      const toEnd = new Date(to);
      toEnd.setHours(23, 59, 59, 999);
      return { rangeStart: from, rangeEnd: toEnd, isCurrentWeek: false };
    }
  }, [mode, weekOffset, customFrom, customTo, baseWeekStart]);

  const rangeEntries = completedEntries.filter(
    (e) => e.startedAt >= rangeStart.getTime() && e.startedAt <= rangeEnd.getTime()
  );

  // Days for bar chart
  const chartDays = useMemo(() => {
    if (mode === "week") return getWeekDays(rangeStart);
    const to = fromIsoDate(customTo);
    return daysBetween(rangeStart, to, 60);
  }, [mode, rangeStart, customTo]);

  const hoursPerDay = chartDays.map(({ label, date }) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);
    const ms = rangeEntries
      .filter((e) => e.startedAt >= dayStart.getTime() && e.startedAt <= dayEnd.getTime())
      .reduce((sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt), 0);
    return { label, ms };
  });

  const maxMs = Math.max(...hoursPerDay.map((d) => d.ms), 1);

  const projectMs = new Map<string, number>();
  for (const e of rangeEntries) {
    const key = e.projectId ?? "__none__";
    projectMs.set(key, (projectMs.get(key) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
  }

  const taskMs = new Map<string, number>();
  for (const e of rangeEntries) {
    if (e.taskId) {
      taskMs.set(e.taskId, (taskMs.get(e.taskId) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
    }
  }

  const totalRangeMs = rangeEntries.reduce(
    (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
    0
  );

  const sortedProjects = Array.from(projectMs.entries())
    .filter(([k]) => k !== "__none__")
    .sort((a, b) => b[1] - a[1]);

  const noProjectMs = projectMs.get("__none__") ?? 0;

  const tagMs = new Map<string, number>();
  for (const e of rangeEntries) {
    for (const tag of e.tags ?? []) {
      tagMs.set(tag, (tagMs.get(tag) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
    }
  }
  const sortedTags = Array.from(tagMs.entries()).sort((a, b) => b[1] - a[1]);

  const billableMs = rangeEntries
    .filter((e) => e.billable !== false)
    .reduce((sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt), 0);
  const nonBillableMs = totalRangeMs - billableMs;

  const sortedTasks = Array.from(taskMs.entries()).sort((a, b) => b[1] - a[1]);

  const streakStats = computeStreaks(completedEntries);

  // Range label
  const weekLabel = mode === "week"
    ? `${rangeStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(rangeEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : (() => {
        const from = fromIsoDate(customFrom);
        const to = fromIsoDate(customTo);
        if (customFrom === customTo) {
          return from.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
        return `${from.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${to.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      })();

  // Validate custom range
  const customRangeValid = customFrom <= customTo;

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

      {/* Mode toggle */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setMode("week")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            mode === "week"
              ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
              : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          Weekly
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
            mode === "custom"
              ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
              : "border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
          }`}
        >
          Custom Range
        </button>
      </div>

      {/* Week navigator or custom range pickers */}
      {mode === "week" ? (
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
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-zinc-500 whitespace-nowrap">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-1">
              <label className="text-xs text-zinc-500 whitespace-nowrap">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                min={customFrom}
                className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  const today = toIsoDate(new Date());
                  setCustomFrom(today);
                  setCustomTo(today);
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 border border-zinc-700 rounded"
              >
                Today
              </button>
              <button
                onClick={() => {
                  setCustomFrom(toIsoDate(baseWeekStart));
                  setCustomTo(toIsoDate(new Date()));
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 border border-zinc-700 rounded"
              >
                This week
              </button>
              <button
                onClick={() => {
                  const firstOfMonth = new Date();
                  firstOfMonth.setDate(1);
                  setCustomFrom(toIsoDate(firstOfMonth));
                  setCustomTo(toIsoDate(new Date()));
                }}
                className="text-xs text-zinc-400 hover:text-zinc-200 px-2 py-1 border border-zinc-700 rounded"
              >
                This month
              </button>
            </div>
          </div>
          {!customRangeValid && (
            <p className="text-xs text-red-400 mt-2">Start date must be before or equal to end date.</p>
          )}
        </div>
      )}

      {customRangeValid && (
        <>
          {/* Range total */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">
                {mode === "week" && isCurrentWeek ? "This week" : "Total"}
              </p>
              <p className="text-3xl font-mono font-semibold text-zinc-100 mt-0.5">
                {formatDurationShort(totalRangeMs)}
              </p>
            </div>
            <p className="text-xs text-zinc-600">{weekLabel}</p>
          </div>

          {/* Weekly goal progress — only in week mode */}
          {mode === "week" && (settings.weeklyGoalHours ?? 0) > 0 && (
            <WeeklyGoalProgress
              totalMs={totalRangeMs}
              goalHours={settings.weeklyGoalHours}
              isCurrentWeek={isCurrentWeek}
            />
          )}

          {/* Billable vs Non-billable */}
          {totalRangeMs > 0 && (
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
              <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
                Billable vs Non-Billable
              </h2>
              <div className="flex flex-col gap-3">
                <div className="flex h-3 rounded-full overflow-hidden bg-zinc-800 w-full">
                  {billableMs > 0 && (
                    <div
                      className="h-full bg-orange-500 transition-all"
                      style={{ width: `${(billableMs / totalRangeMs) * 100}%` }}
                    />
                  )}
                  {nonBillableMs > 0 && (
                    <div
                      className="h-full bg-zinc-600 transition-all"
                      style={{ width: `${(nonBillableMs / totalRangeMs) * 100}%` }}
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
                      {totalRangeMs > 0 ? Math.round((billableMs / totalRangeMs) * 100) : 0}%
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
                        {Math.round((nonBillableMs / totalRangeMs) * 100)}%
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
            {hoursPerDay.length <= 31 ? (
              <div className="flex items-end gap-1 h-24 overflow-x-auto">
                {hoursPerDay.map(({ label, ms }, idx) => (
                  <div
                    key={idx}
                    className="flex-1 min-w-[20px] flex flex-col items-center gap-1"
                    title={`${label}: ${formatDurationShort(ms)}`}
                  >
                    <div className="w-full flex items-end justify-center" style={{ height: "72px" }}>
                      <div
                        className="w-full rounded-t bg-orange-500/80"
                        style={{
                          height: `${Math.round((ms / maxMs) * 72)}px`,
                          minHeight: ms > 0 ? "2px" : "0",
                        }}
                      />
                    </div>
                    {hoursPerDay.length <= 14 && (
                      <span className="text-xs text-zinc-500 truncate w-full text-center">{label}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Too many days — show a condensed list grouped by week */
              <div className="text-xs text-zinc-500 italic">
                Showing {hoursPerDay.length} days — hover each bar for details.
                <div className="flex items-end gap-px h-20 mt-2 overflow-x-auto">
                  {hoursPerDay.map(({ label, ms }, idx) => (
                    <div
                      key={idx}
                      className="flex-1 min-w-[6px] flex items-end"
                      title={`${label}: ${formatDurationShort(ms)}`}
                    >
                      <div
                        className="w-full rounded-sm bg-orange-500/80"
                        style={{
                          height: `${Math.round((ms / maxMs) * 72)}px`,
                          minHeight: ms > 0 ? "2px" : "0",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Earnings breakdown */}
          <EarningsBreakdown projects={projects} entries={rangeEntries} />

          {/* Client breakdown */}
          <ClientBreakdown
            clients={clients}
            projects={projects}
            entries={rangeEntries}
            totalMs={totalRangeMs}
          />

          {/* Project breakdown */}
          <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
            <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
              By Project
            </h2>
            {sortedProjects.length === 0 && noProjectMs === 0 ? (
              <p className="text-sm text-zinc-600 italic">No tracked time in this range.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {sortedProjects.map(([projectId, ms]) => {
                  const project = projectMap.get(projectId);
                  const pct = totalRangeMs > 0 ? Math.round((ms / totalRangeMs) * 100) : 0;
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
                          {totalRangeMs > 0 ? Math.round((noProjectMs / totalRangeMs) * 100) : 0}%
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
                          width: `${totalRangeMs > 0 ? Math.round((noProjectMs / totalRangeMs) * 100) : 0}%`,
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
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
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
            <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
              <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
                Tag Totals
              </h2>
              <div className="flex flex-col gap-3">
                {sortedTags.map(([tag, ms]) => {
                  const pct = totalRangeMs > 0 ? Math.round((ms / totalRangeMs) * 100) : 0;
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
        </>
      )}
    </div>
  );
}
