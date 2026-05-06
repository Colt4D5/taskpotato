"use client";

import { useEffect } from "react";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { formatDuration } from "@/lib/duration";

/**
 * Keeps the browser tab title in sync with the running timer.
 * When a timer is running: "▶ HH:MM:SS — description (project)"
 * When idle: "TaskPotato"
 *
 * Uses a 1-second interval driven by Date.now() so it ticks even when
 * the Shell hasn't re-rendered.
 */
export function DynamicTitle() {
  const { runningEntry } = useEntries();
  const { projects } = useProjects();

  useEffect(() => {
    if (!runningEntry) {
      document.title = "TaskPotato";
      return;
    }

    const project = runningEntry.projectId
      ? projects.find((p) => p.id === runningEntry.projectId)
      : null;

    const update = () => {
      const offset = runningEntry.offsetMs ?? 0;
      const base = runningEntry.resumedAt ?? runningEntry.startedAt;
      const elapsed = offset + (Date.now() - base);
      const duration = formatDuration(elapsed);

      const label = runningEntry.notes?.trim()
        ? project
          ? `${runningEntry.notes.trim()} (${project.name})`
          : runningEntry.notes.trim()
        : project
        ? project.name
        : "Timer running";

      document.title = `▶ ${duration} — ${label}`;
    };

    update();
    const id = setInterval(update, 1000);
    return () => {
      clearInterval(id);
      document.title = "TaskPotato";
    };
  }, [runningEntry, projects]);

  return null;
}
