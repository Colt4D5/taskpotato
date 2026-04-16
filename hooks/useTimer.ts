"use client";

import { useState, useEffect, useRef } from "react";
import { useEntries } from "./useEntries";
import { useProjects } from "./useProjects";
import { useTasks } from "./useTasks";
import { useStorage } from "./useStorage";
import { AppSettings, DEFAULT_SETTINGS } from "@/types";
import { roundTimestamp } from "@/lib/duration";

export function useTimer() {
  const { runningEntry, startEntry, stopEntry } = useEntries();
  const { activeProjects } = useProjects();
  const { getTasksForProject } = useTasks();
  const [settings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);

  const [elapsed, setElapsed] = useState(0);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [billable, setBillable] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isRunning = runningEntry !== null;

  // Tick every second when running
  useEffect(() => {
    if (isRunning && runningEntry) {
      const offset = runningEntry.offsetMs ?? 0;
      const base = runningEntry.resumedAt ?? runningEntry.startedAt;
      const tick = () => setElapsed(offset + (Date.now() - base));
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
    startEntry(selectedProjectId, selectedTaskId, notes, tags, billable);
  };

  const stop = () => {
    if (!runningEntry) return;
    const rounding = settings.timeRounding ?? 0;
    const stoppedAt = roundTimestamp(Date.now(), rounding);
    stopEntry(runningEntry.id, stoppedAt);
    setNotes("");
    setTags([]);
    setBillable(true);
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
    tags,
    setTags,
    billable,
    setBillable,
    start,
    stop,
    toggle,
    activeProjects,
    tasks,
    timeRounding: settings.timeRounding ?? 0,
  };
}
