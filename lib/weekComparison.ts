import { TimeEntry } from "@/types";
import { elapsedMs } from "@/lib/duration";

export interface ProjectComparisonRow {
  projectId: string | null;
  currentMs: number;
  previousMs: number;
  deltaMs: number;       // currentMs - previousMs; negative = regression
  deltaPct: number | null; // null when previousMs === 0
}

export interface WeekComparisonData {
  currentMs: number;
  previousMs: number;
  deltaMs: number;
  deltaPct: number | null; // null when previousMs === 0
  rows: ProjectComparisonRow[]; // sorted: largest max(currentMs, previousMs) first
}

/** Sums completed entry time for an array of entries. */
function sumMs(entries: TimeEntry[]): number {
  return entries.reduce((acc, e) => {
    if (e.stoppedAt == null) return acc;
    return acc + elapsedMs(e.startedAt, e.stoppedAt);
  }, 0);
}

/** Aggregate completed entries into a projectId → ms map. */
function aggregateByProject(entries: TimeEntry[]): Map<string | null, number> {
  const map = new Map<string | null, number>();
  for (const e of entries) {
    if (e.stoppedAt == null) continue;
    const key = e.projectId ?? null;
    map.set(key, (map.get(key) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
  }
  return map;
}

/**
 * Compute week-over-week comparison data.
 *
 * @param currentEntries  Completed entries for the current week
 * @param previousEntries Completed entries for the preceding week
 */
export function computeWeekComparison(
  currentEntries: TimeEntry[],
  previousEntries: TimeEntry[]
): WeekComparisonData {
  const currentMs = sumMs(currentEntries);
  const previousMs = sumMs(previousEntries);
  const deltaMs = currentMs - previousMs;
  const deltaPct = previousMs > 0 ? Math.round((deltaMs / previousMs) * 100) : null;

  const currentMap = aggregateByProject(currentEntries);
  const prevMap = aggregateByProject(previousEntries);

  // Union of all project ids that appear in either week
  const allKeys = new Set<string | null>([...currentMap.keys(), ...prevMap.keys()]);

  const rows: ProjectComparisonRow[] = [];
  for (const projectId of allKeys) {
    const cur = currentMap.get(projectId) ?? 0;
    const prev = prevMap.get(projectId) ?? 0;
    const d = cur - prev;
    rows.push({
      projectId,
      currentMs: cur,
      previousMs: prev,
      deltaMs: d,
      deltaPct: prev > 0 ? Math.round((d / prev) * 100) : null,
    });
  }

  // Sort: largest visible activity first
  rows.sort((a, b) => Math.max(b.currentMs, b.previousMs) - Math.max(a.currentMs, a.previousMs));

  return { currentMs, previousMs, deltaMs, deltaPct, rows };
}
