const PREFIX = "taskpotato:";

export function storageGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent("taskpotato:storage-update", { detail: { key } }));
  } catch {
    // quota exceeded or private browsing — fail silently but honestly
    console.error(`[taskpotato] Failed to write localStorage key: ${key}`);
  }
}

export function storageRemove(key: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PREFIX + key);
}

export function storageExportAll(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  if (typeof window === "undefined") return result;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIX)) {
      try {
        result[k.slice(PREFIX.length)] = JSON.parse(localStorage.getItem(k)!);
      } catch {
        // skip malformed
      }
    }
  }
  return result;
}
