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
    (id: string, stoppedAt?: number) => {
      const ts = stoppedAt ?? Date.now();
      setEntries((prev) =>
        prev.map((e) =>
          e.id === id && e.stoppedAt === null
            ? { ...e, stoppedAt: ts }
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

  const duplicateEntry = useCallback(
    (id: string) => {
      const source = entries.find((e) => e.id === id);
      if (!source || source.stoppedAt === null) return;
      const durationMs = elapsedMs(source.startedAt, source.stoppedAt) + (source.offsetMs ?? 0);
      const now = Date.now();
      const newEntry: TimeEntry = {
        id: uuid(),
        projectId: source.projectId,
        taskId: source.taskId,
        startedAt: now - durationMs,
        stoppedAt: now,
        notes: source.notes,
        tags: source.tags ? [...source.tags] : [],
        billable: source.billable ?? true,
      };
      setEntries((prev) => [...prev, newEntry]);
      return newEntry;
    },
    [entries, setEntries]
  );

  const addEntry = useCallback(
    (entry: Omit<TimeEntry, "id">) => {
      const newEntry: TimeEntry = { ...entry, id: uuid() };
      setEntries((prev) => [...prev, newEntry]);
      return newEntry;
    },
    [setEntries]
  );

  const updateAllTags = useCallback(
    (oldTag: string, newTag: string | null) => {
      setEntries((prev) =>
        prev.map((e) => {
          if (!e.tags || !e.tags.includes(oldTag)) return e;
          const next =
            newTag === null
              ? e.tags.filter((t) => t !== oldTag)
              : e.tags.map((t) => (t === oldTag ? newTag : t));
          return { ...e, tags: next };
        })
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
    addEntry,
    resumeEntry,
    stopEntry,
    updateEntry,
    updateAllTags,
    deleteEntry,
    duplicateEntry,
  };
}
