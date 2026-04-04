"use client";

import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { startOfWeek } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/Badge";

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

export default function ReportsPage() {
  const { completedEntries } = useEntries();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  const projectMap = new Map(projects.map((p) => [p.id, p]));

  const weekStart = startOfWeek(new Date(), 1);
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
    if (e.projectId) {
      projectMs.set(e.projectId, (projectMs.get(e.projectId) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
    }
  }

  const totalWeekMs = weekEntries.reduce(
    (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
    0
  );

  const sortedProjects = Array.from(projectMs.entries())
    .sort((a, b) => b[1] - a[1]);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-8">Reports</h1>

      {/* This week total */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-zinc-500">This week</p>
          <p className="text-3xl font-mono font-semibold text-zinc-100 mt-0.5">
            {formatDurationShort(totalWeekMs)}
          </p>
        </div>
        <p className="text-xs text-zinc-600">
          {weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          {" – "}
          {new Date(weekEnd.getTime() - 1).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </p>
      </div>

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
      <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4">
        <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
          By Project
        </h2>
        {sortedProjects.length === 0 ? (
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
          </div>
        )}
      </section>
    </div>
  );
}
