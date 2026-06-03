import { TimeEntry } from "@/types";
import { elapsedMs } from "@/lib/duration";

export interface DailyGoalDay {
  dateKey: string;          // YYYY-MM-DD
  trackedMs: number;
  goalMs: number;
  pct: number;              // 0–1+; can exceed 1 when over goal
  met: boolean;
  isToday: boolean;
  isFuture: boolean;        // future days within the range
}

export interface DailyGoalStats {
  days: DailyGoalDay[];
  metCount: number;
  missedCount: number;      // past+today days that didn't meet goal
  totalCount: number;       // past+today days
  currentStreak: number;    // consecutive days ending today/yesterday that met goal
  bestStreak: number;
  totalTrackedMs: number;
}

function toDateKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function todayKey(): string {
  return toDateKey(Date.now());
}

function compareKeys(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Given the full set of completed entries, a date range [rangeStart, rangeEnd),
 * and a daily goal in hours, compute per-day stats and aggregate metrics.
 */
export function computeDailyGoal(
  entries: TimeEntry[],
  rangeStart: Date,
  rangeEnd: Date,
  dailyGoalHours: number
): DailyGoalStats {
  const goalMs = dailyGoalHours * 3_600_000;
  const today = todayKey();

  // Build a map of dateKey → trackedMs from completed entries
  const trackedByDay = new Map<string, number>();
  for (const e of entries) {
    if (e.stoppedAt === null) continue;
    const key = toDateKey(e.startedAt);
    const ms = elapsedMs(e.startedAt, e.stoppedAt) + (e.offsetMs ?? 0);
    trackedByDay.set(key, (trackedByDay.get(key) ?? 0) + ms);
  }

  // Enumerate every calendar day in [rangeStart, rangeEnd)
  const days: DailyGoalDay[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const endMs = rangeEnd.getTime();

  while (cursor.getTime() < endMs) {
    const key = toDateKey(cursor.getTime());
    const trackedMs = trackedByDay.get(key) ?? 0;
    const pct = goalMs > 0 ? trackedMs / goalMs : 0;
    const isFuture = key > today;
    const met = !isFuture && trackedMs >= goalMs;

    days.push({
      dateKey: key,
      trackedMs,
      goalMs,
      pct,
      met,
      isToday: key === today,
      isFuture,
    });

    cursor.setDate(cursor.getDate() + 1);
  }

  // Sort chronologically
  days.sort((a, b) => compareKeys(a.dateKey, b.dateKey));

  // Aggregate
  const evaluatedDays = days.filter((d) => !d.isFuture);
  const metCount = evaluatedDays.filter((d) => d.met).length;
  const missedCount = evaluatedDays.filter((d) => !d.met).length;
  const totalCount = evaluatedDays.length;
  const totalTrackedMs = days.reduce((sum, d) => sum + d.trackedMs, 0);

  // Current streak — consecutive days ending today (or yesterday if today has no data)
  let currentStreak = 0;
  const sortedEvaluated = [...evaluatedDays].sort((a, b) => compareKeys(b.dateKey, a.dateKey));
  for (const d of sortedEvaluated) {
    if (d.met) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Best streak across all evaluated days
  let bestStreak = 0;
  let run = 0;
  for (const d of evaluatedDays) {
    if (d.met) {
      run++;
      if (run > bestStreak) bestStreak = run;
    } else {
      run = 0;
    }
  }

  return {
    days,
    metCount,
    missedCount,
    totalCount,
    currentStreak,
    bestStreak,
    totalTrackedMs,
  };
}
