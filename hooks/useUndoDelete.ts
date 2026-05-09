"use client";

import { useCallback, useRef, useState } from "react";
import { TimeEntry } from "@/types";

const UNDO_DURATION_MS = 5000;

interface PendingDelete {
  ids: string[];
  entries: TimeEntry[];
  label: string; // e.g. "1 entry deleted" or "3 entries deleted"
}

interface UseUndoDeleteOptions {
  onCommit: (ids: string[]) => void; // called when undo window expires
}

export function useUndoDelete({ onCommit }: UseUndoDeleteOptions) {
  const [pending, setPending] = useState<PendingDelete | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stage = useCallback(
    (entries: TimeEntry[]) => {
      if (entries.length === 0) return;

      // Cancel any in-flight deletion first (commit it immediately)
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
        // Commit the previous pending delete before staging new one
        setPending((prev) => {
          if (prev) onCommit(prev.ids);
          return null;
        });
      }

      const ids = entries.map((e) => e.id);
      const label =
        entries.length === 1 ? "1 entry deleted" : `${entries.length} entries deleted`;

      setPending({ ids, entries, label });

      timerRef.current = setTimeout(() => {
        onCommit(ids);
        setPending(null);
        timerRef.current = null;
      }, UNDO_DURATION_MS);
    },
    [onCommit]
  );

  const undo = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPending(null);
  }, []);

  const commit = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (pending) {
      onCommit(pending.ids);
      setPending(null);
    }
  }, [pending, onCommit]);

  const pendingIds = pending ? new Set(pending.ids) : new Set<string>();

  return { pending, pendingIds, stage, undo, commit };
}
