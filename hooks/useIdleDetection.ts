"use client";

import { useEffect, useRef, useState } from "react";
import { TimeEntry } from "@/types";

/**
 * Fires `onIdle` when a running entry's total elapsed time exceeds `thresholdMs`.
 * Only fires once per entry id — resets when the entry changes.
 */
export function useIdleDetection(
  runningEntry: TimeEntry | null,
  thresholdMs: number,
  onIdle: () => void
) {
  const firedForRef = useRef<string | null>(null);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    if (!runningEntry || thresholdMs === 0) {
      firedForRef.current = null;
      return;
    }

    const check = () => {
      if (!runningEntry || firedForRef.current === runningEntry.id) return;
      const offset = runningEntry.offsetMs ?? 0;
      const base = runningEntry.resumedAt ?? runningEntry.startedAt;
      const elapsed = offset + (Date.now() - base);
      if (elapsed >= thresholdMs) {
        firedForRef.current = runningEntry.id;
        onIdle();
      }
    };

    check(); // immediate check in case we mount mid-session

    const interval = setInterval(check, 30_000); // every 30 seconds
    return () => clearInterval(interval);
  }, [runningEntry, thresholdMs, onIdle, forceUpdate]);
}
