"use client";

import { useCallback } from "react";
import { useStorage } from "./useStorage";
import { TimeEntry } from "@/types";
import { uuid } from "@/lib/uuid";

export function useEntries() {
  const [entries, setEntries] = useStorage<TimeEntry[]>("entries", []);

  const startEntry = useCallback(
    (projectId: string | null, taskId: string | null, notes = "") => {
      const entry: TimeEntry = {
        id: uuid(),
        projectId,
        taskId,
        startedAt: Date.now(),
        stoppedAt: null,
        notes,
        tags: [],
      };
      setEntries((prev) => [...prev, entry]);
      return entry;
    },
    [setEntries]
  );

  const stopEntry = useCallback(
    (id: string) => {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id && e.stoppedAt === null
            ? { ...e, stoppedAt: Date.now() }
            : e
        )
      );
    },
    [setEntries]
  );

  const updateEntry = useCallback(
    (id: string, patch: Partial<Omit<TimeEntry, "id">>) => {
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? { ...e, ...patch } : e))
      );
    },
    [setEntries]
  );

  const deleteEntry = useCallback(
    (id: string) => {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    },
    [setEntries]
  );

  const runningEntry = entries.find((e) => e.stoppedAt === null) ?? null;

  const completedEntries = entries
    .filter((e) => e.stoppedAt !== null)
    .sort((a, b) => b.startedAt - a.startedAt);

  return {
    entries,
    runningEntry,
    completedEntries,
    startEntry,
    stopEntry,
    updateEntry,
    deleteEntry,
  };
}
