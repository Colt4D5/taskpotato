"use client";

import { useState, useEffect, useCallback } from "react";
import { storageGet, storageSet } from "@/lib/storage";

export function useStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => storageGet(key, fallback));

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        storageSet(key, resolved);
        return resolved;
      });
    },
    [key]
  );

  // Sync across tabs
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === "taskpotato:" + key) {
        setValue(e.newValue ? JSON.parse(e.newValue) : fallback);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [key, fallback]);

  return [value, set] as const;
}
