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

  // Sync across tabs (StorageEvent) and within the same page (custom event)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "taskpotato:" + key) {
        setValue(e.newValue ? JSON.parse(e.newValue) : fallback);
      }
    };
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent<{ key: string }>).detail;
      if (detail?.key === key) {
        setValue(storageGet(key, fallback));
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("taskpotato:storage-update", handleCustom);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("taskpotato:storage-update", handleCustom);
    };
  }, [key, fallback]);

  return [value, set] as const;
}
