"use client";

import { useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { DurationDisplay } from "@/components/ui/DurationDisplay";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { formatDurationShort, elapsedMs } from "@/lib/duration";
import { startOfDay, endOfDay, formatTime } from "@/lib/dateUtils";

export function TimerWidget() {
  const {
    isRunning,
    elapsed,
    selectedProjectId,
    setSelectedProjectId,
    selectedTaskId,
    setSelectedTaskId,
    notes,
    setNotes,
    toggle,
    activeProjects,
    tasks,
  } = useTimer();

  const { addProject } = useProjects();
  const { completedEntries } = useEntries();
  const { tasks: allTasks } = useTasks();

  const [showProjectForm, setShowProjectForm] = useState(false);

  // Today's entries
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const todayEntries = completedEntries.filter(
    (e) => e.startedAt >= todayStart && e.startedAt <= todayEnd
  );

  const projectMap = new Map(activeProjects.map((p) => [p.id, p]));
  const taskMap = new Map(allTasks.map((t) => [t.id, t]));

  const totalMs = todayEntries.reduce(
    (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
    0
  );

  // Per-project breakdown
  const projectTotals = new Map<string, number>();
  for (const e of todayEntries) {
    const key = e.projectId ?? "__none__";
    projectTotals.set(key, (projectTotals.get(key) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
  }
  const projectBreakdown = Array.from(projectTotals.entries())
    .map(([id, ms]) => ({ id, ms, project: id !== "__none__" ? projectMap.get(id) : undefined }))
    .sort((a, b) => b.ms - a.ms);

  return (
    <div className="max-w-lg mx-auto px-4">
      {/* Timer section */}
      <div className="flex flex-col items-center gap-6 py-12">
        {/* Big clock */}
        <DurationDisplay
          ms={elapsed}
          className="text-7xl md:text-8xl text-zinc-100 tracking-tight"
        />

        {/* Description input */}
        <input
          type="text"
          placeholder="What are you working on?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={isRunning}
          className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-center text-lg"
          onKeyDown={(e) => e.key === "Enter" && toggle()}
        />

        {/* Project selector */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex gap-3 items-center">
            <select
              value={selectedProjectId ?? ""}
              onChange={(e) => {
                setSelectedProjectId(e.target.value || null);
                setSelectedTaskId(null);
              }}
              disabled={isRunning}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              <option value="">No project</option>
              {activeProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {tasks.length > 0 && (
              <select
                value={selectedTaskId ?? ""}
                onChange={(e) => setSelectedTaskId(e.target.value || null)}
                disabled={isRunning}
                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-zinc-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                <option value="">No task</option>
                {tasks.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {!isRunning && (
            <button
              onClick={() => setShowProjectForm(true)}
              className="self-start text-xs text-orange-500 hover:text-orange-400 transition-colors"
            >
              + New Project
            </button>
          )}
        </div>

        {/* Start / Stop */}
        <Button
          size="lg"
          variant={isRunning ? "danger" : "primary"}
          onClick={toggle}
          className="w-full py-4 text-lg rounded-xl"
        >
          {isRunning ? "Stop" : "Start"}
        </Button>

        {/* Keyboard hint */}
        <p className="text-xs text-zinc-600">
          Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Enter</kbd> to start/stop
        </p>
      </div>

      {/* Today's Summary */}
      {todayEntries.length > 0 && (
        <div className="border-t border-zinc-800 pt-6 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">Today's Summary</h2>
            <span className="text-sm font-mono text-zinc-300">{formatDurationShort(totalMs)}</span>
          </div>

          {/* Bar chart */}
          {projectBreakdown.length > 0 && (
            <div className="mb-4 flex flex-col gap-1.5">
              {projectBreakdown.map(({ id, ms, project }) => {
                const pct = totalMs > 0 ? (ms / totalMs) * 100 : 0;
                const color = project?.color ?? "#52525b";
                return (
                  <div key={id} className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-20 truncate text-right">
                      {project?.name ?? "No project"}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 w-14 text-right">
                      {formatDurationShort(ms)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Entry list */}
          <div className="flex flex-col gap-1">
            {todayEntries.map((entry) => {
              const project = entry.projectId ? projectMap.get(entry.projectId) : undefined;
              const task = entry.taskId ? taskMap.get(entry.taskId) : undefined;
              const dur = elapsedMs(entry.startedAt, entry.stoppedAt);
              return (
                <div key={entry.id} className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-zinc-800/50">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project?.color ?? "#52525b" }}
                  />
                  <span className="flex-1 text-sm text-zinc-300 truncate">
                    {entry.notes || <span className="text-zinc-600 italic">No description</span>}
                  </span>
                  {project && <Badge label={project.name} color={project.color} />}
                  {task && <span className="text-xs text-zinc-500">{task.name}</span>}
                  <span className="text-xs font-mono text-zinc-500 flex-shrink-0">
                    {formatTime(entry.startedAt)}
                  </span>
                  <span className="text-xs font-mono text-zinc-400 flex-shrink-0">
                    {formatDurationShort(dur)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      <ProjectForm
        open={showProjectForm}
        onClose={() => setShowProjectForm(false)}
        onSave={({ name, color }) => {
          const project = addProject(name, color);
          setSelectedProjectId(project.id);
          setShowProjectForm(false);
        }}
      />
    </div>
  );
}
