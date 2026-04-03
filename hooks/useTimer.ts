"use client";

import { useState, useEffect, useRef } from "react";
import { useEntries } from "./useEntries";
import { useProjects } from "./useProjects";
import { useTasks } from "./useTasks";

export function useTimer() {
  const { runningEntry, startEntry, stopEntry } = useEntries();
  const { activeProjects } = useProjects();
  const { getTasksForProject } = useTasks();

  const [elapsed, setElapsed] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = runningEntry !== null;

  // Tick every second when running
  useEffect(() => {
    if (isRunning && runningEntry) {
      const tick = () => setElapsed(Date.now() - runningEntry.startedAt);
      tick(); // immediate
      intervalRef.current = setInterval(tick, 1000);
    } else {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, runningEntry]);

  const start = () => {
    if (isRunning) return;
    startEntry(selectedProjectId, selectedTaskId, notes);
  };

  const stop = () => {
    if (!runningEntry) return;
    stopEntry(runningEntry.id);
    setNotes("");
  };

  const toggle = () => (isRunning ? stop() : start());

  const tasks = selectedProjectId ? getTasksForProject(selectedProjectId) : [];

  return {
    isRunning,
    elapsed,
    runningEntry,
    selectedProjectId,
    setSelectedProjectId,
    selectedTaskId,
    setSelectedTaskId,
    notes,
    setNotes,
    start,
    stop,
    toggle,
    activeProjects,
    tasks,
  };
}
