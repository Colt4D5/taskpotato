"use client";

import { useCallback } from "react";
import { useStorage } from "./useStorage";
import { TimeEntry } from "@/types";
import { uuid } from "@/lib/uuid";
import { elapsedMs } from "@/lib/duration";

export function useEntries() {
  const [entries, setEntries] = useStorage<TimeEntry[]>("entries", []);

  const startEntry = useCallback(
    (projectId: string | null, taskId: string | null, notes = "", tags: string[] = [], billable = true) => {
      const entry: TimeEntry = {
        id: uuid(),
        projectId,
        taskId,
        startedAt: Date.now(),
        stoppedAt: null,
        notes,
        tags,
        billable,
      };
      setEntries((prev) => [...prev, entry]);
      return entry;
    },
    [setEntries]
  );

  // Resume an existing entry — mark it running again with offsetMs from prior duration
  const resumeEntry = useCallback(
    (id: string) => {
      setEntries((prev) =>
        prev.map((e) => {
          if (e.id !== id || e.stoppedAt === null) return e;
          const prior = elapsedMs(e.startedAt, e.stoppedAt);
          return {
            ...e,
            stoppedAt: null,
            resumedAt: Date.now(),
            offsetMs: (e.offsetMs ?? 0) + prior,
          };
        })
      );
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
    resumeEntry,
    stopEntry,
    updateEntry,
    deleteEntry,
  };
}
