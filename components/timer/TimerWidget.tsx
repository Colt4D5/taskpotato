"use client";

import { useTimer } from "@/hooks/useTimer";
import { DurationDisplay } from "@/components/ui/DurationDisplay";
import { Button } from "@/components/ui/Button";

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

      {/* Project selector */}
      <div className="w-full flex gap-3">
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
  );
}
