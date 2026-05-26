"use client";

import { useCallback } from "react";
import { useStorage } from "./useStorage";

// Per-day journal notes keyed by YYYY-MM-DD
// Stored under taskpotato:day-notes as a Record<string, string>
export function useDayNotes() {
  const [notes, setNotes] = useStorage<Record<string, string>>("day-notes", {});

  const getNote = useCallback(
    (dateKey: string): string => notes[dateKey] ?? "",
    [notes]
  );

  const setNote = useCallback(
    (dateKey: string, content: string) => {
      setNotes((prev) => {
        if (!content.trim()) {
          // Delete the key rather than storing an empty string
          if (!(dateKey in prev)) return prev;
          const next = { ...prev };
          delete next[dateKey];
          return next;
        }
        if (prev[dateKey] === content) return prev;
        return { ...prev, [dateKey]: content };
      });
    },
    [setNotes]
  );

  const deleteNote = useCallback(
    (dateKey: string) => {
      setNotes((prev) => {
        if (!(dateKey in prev)) return prev;
        const next = { ...prev };
        delete next[dateKey];
        return next;
      });
    },
    [setNotes]
  );

  // All date keys that have notes, sorted newest first
  const notedDays = Object.keys(notes).sort((a, b) => b.localeCompare(a));

  return { notes, notedDays, getNote, setNote, deleteNote };
}
