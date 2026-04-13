"use client";

import { useState } from "react";
import { useTimer } from "@/hooks/useTimer";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { DurationDisplay } from "@/components/ui/DurationDisplay";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { formatDurationShort, elapsedMs } from "@/lib/duration";
import { startOfDay, endOfDay, formatTime } from "@/lib/dateUtils";

import { TagInput } from "@/components/ui/TagInput";
import { PomodoroWidget } from "@/components/timer/PomodoroWidget";
import { IdleAlert } from "@/components/timer/IdleAlert";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useIdleDetection } from "@/hooks/useIdleDetection";
import { useStorage } from "@/hooks/useStorage";
import { AppSettings, DEFAULT_SETTINGS } from "@/types";

export function TimerWidget() {
  const {
    isRunning,
    elapsed,
    runningEntry,
    selectedProjectId,
    setSelectedProjectId,
    selectedTaskId,
    setSelectedTaskId,
    notes,
    setNotes,
    tags,
    setTags,
    stop,
    toggle,
    activeProjects,
    tasks,
  } = useTimer();

  useKeyboardShortcuts({ onToggleTimer: toggle });

  const [showPomodoro, setShowPomodoro] = useState(false);
  const [showIdleAlert, setShowIdleAlert] = useState(false);
  const [settings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);
  const { completedEntries, updateEntry } = useEntries();
  const { addProject } = useProjects();

  const idleThresholdMs = (settings.idleAlertHours ?? 2) * 3_600_000;

  useIdleDetection(
    runningEntry ?? null,
    idleThresholdMs,
    () => setShowIdleAlert(true)
  );
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Today's summary
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const todayEntries = completedEntries.filter(
    (e) => e.stoppedAt !== null && e.startedAt >= todayStart && e.startedAt <= todayEnd
  );
  const todayTotalMs = todayEntries.reduce(
    (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
    0
  );

  // Project breakdown for bar chart
  const projectTotals = new Map<string, number>();
  for (const entry of todayEntries) {
    const key = entry.projectId ?? "__none__";
    projectTotals.set(key, (projectTotals.get(key) ?? 0) + elapsedMs(entry.startedAt, entry.stoppedAt));
  }
  const projectMap = new Map(activeProjects.map((p) => [p.id, p]));

  const handleNewProject = (data: { name: string; color: string }) => {
    const project = addProject(data.name, data.color);
    setSelectedProjectId(project.id);
    setSelectedTaskId(null);
    setShowProjectForm(false);
  };

  return (
    <div className="flex flex-col items-center gap-6 py-12 px-4 max-w-lg mx-auto">
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

      {/* Project selector + New Project button */}
      <div className="w-full flex gap-2">
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

        <Button
          size="sm"
          variant="ghost"
          onClick={() => setShowProjectForm(true)}
          disabled={isRunning}
          className="px-3 py-2.5 text-xs text-zinc-400 hover:text-orange-400 border border-zinc-800 rounded-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + New Project
        </Button>

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

      {/* Tags */}
      <div className="w-full">
        <TagInput
          tags={tags}
          onChange={setTags}
          disabled={isRunning}
          placeholder="Add tags (Enter or comma)…"
        />
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

      {/* Keyboard hint + Pomodoro toggle */}
      <div className="flex items-center justify-between w-full">
        <p className="text-xs text-zinc-600">
          Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">Enter</kbd> to start/stop
        </p>
        <button
          onClick={() => setShowPomodoro((s) => !s)}
          className="text-xs text-zinc-500 hover:text-orange-400 transition-colors"
          title="Toggle Pomodoro timer"
        >
          🍅 Pomodoro
        </button>
      </div>

      {/* Pomodoro widget */}
      {showPomodoro && (
        <PomodoroWidget onClose={() => setShowPomodoro(false)} />
      )}

      {/* Today's Summary */}
      {todayEntries.length > 0 && (
        <div className="w-full border border-zinc-800 rounded-xl bg-zinc-900/60 p-4 flex flex-col gap-3 mt-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Today&apos;s Summary</span>
            <span className="text-sm font-mono text-zinc-300">{formatDurationShort(todayTotalMs)}</span>
          </div>

          {/* Horizontal bar chart by project */}
          {projectTotals.size > 0 && todayTotalMs > 0 && (
            <div className="flex flex-col gap-1.5">
              {Array.from(projectTotals.entries()).map(([pid, ms]) => {
                const proj = pid === "__none__" ? null : projectMap.get(pid);
                const pct = (ms / todayTotalMs) * 100;
                const color = proj?.color ?? "#52525b";
                return (
                  <div key={pid} className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct.toFixed(1)}%`, backgroundColor: color }}
                      />
                    </div>
                    <span className="text-xs text-zinc-400 w-20 text-right truncate">
                      {proj ? proj.name : "No project"}
                    </span>
                    <span className="text-xs font-mono text-zinc-500 w-12 text-right">
                      {formatDurationShort(ms)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Entry list */}
          <div className="flex flex-col gap-1 border-t border-zinc-800 pt-3">
            {todayEntries.slice().sort((a, b) => b.startedAt - a.startedAt).map((entry) => {
              const proj = entry.projectId ? projectMap.get(entry.projectId) : undefined;
              return (
                <div key={entry.id} className="flex items-center gap-2 text-xs">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: proj?.color ?? "#52525b" }}
                  />
                  <span className="text-zinc-400 flex-shrink-0">{formatTime(entry.startedAt)}</span>
                  <span className="text-zinc-300 flex-1 truncate">
                    {entry.notes || <span className="italic text-zinc-600">No description</span>}
                  </span>
                  {proj && <Badge label={proj.name} color={proj.color} />}
                  <span className="font-mono text-zinc-500 flex-shrink-0">
                    {formatDurationShort(elapsedMs(entry.startedAt, entry.stoppedAt))}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Idle Alert */}
      {showIdleAlert && runningEntry && (
        <IdleAlert
          elapsedMs={elapsed}
          startedAt={runningEntry.startedAt}
          onDismiss={() => setShowIdleAlert(false)}
          onStop={() => {
            stop();
            setShowIdleAlert(false);
          }}
          onAdjustStart={(newStartMs) => {
            updateEntry(runningEntry.id, { startedAt: newStartMs });
            setShowIdleAlert(false);
          }}
        />
      )}

      {/* New Project Modal */}
      <ProjectForm
        open={showProjectForm}
        onSave={handleNewProject}
        onClose={() => setShowProjectForm(false)}
        title="New Project"
      />
    </div>
  );
}
