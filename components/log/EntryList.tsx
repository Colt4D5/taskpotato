"use client";

import { TimeEntry, Project, Task } from "@/types";
import { groupByDay, formatDayLabel } from "@/lib/dateUtils";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { EntryRow } from "./EntryRow";

interface EntryListProps {
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  onUpdate: (id: string, patch: Partial<Omit<TimeEntry, "id">>) => void;
  onDelete: (id: string) => void;
  onResume?: (entry: TimeEntry) => void;
  hasRunning?: boolean;
}

export function EntryList({
  entries,
  projects,
  tasks,
  onUpdate,
  onDelete,
  onResume,
  hasRunning = false,
}: EntryListProps) {
  const completed = entries.filter((e) => e.stoppedAt !== null);
  const grouped = groupByDay(completed);
  const sortedDays = Array.from(grouped.keys()).sort((a, b) =>
    b.localeCompare(a)
  );

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  if (sortedDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
        <p className="text-4xl mb-4">🥔</p>
        <p className="text-sm">No entries yet. Start the timer.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {sortedDays.map((day) => {
        const dayEntries = (grouped.get(day) ?? []).sort(
          (a, b) => b.startedAt - a.startedAt
        );
        const totalMs = dayEntries.reduce(
          (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
          0
        );

        return (
          <div key={day}>
            <div className="flex items-center justify-between px-4 mb-1">
              <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
                {formatDayLabel(day)}
              </h2>
              <span className="text-sm text-zinc-500 font-mono">
                {formatDurationShort(totalMs)}
              </span>
            </div>
            <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800/50">
              {dayEntries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  project={entry.projectId ? projectMap.get(entry.projectId) : undefined}
                  task={entry.taskId ? taskMap.get(entry.taskId) : undefined}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  projects={projects}
                  tasks={tasks}
                  onResume={onResume}
                  hasRunning={hasRunning}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
