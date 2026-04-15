import { TimeEntry } from "@/types";
import { elapsedMs } from "@/lib/duration";

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  /** Map of YYYY-MM-DD → total ms tracked that day */
  dailyMs: Map<string, number>;
  /** Total days with any tracked time */
  totalActiveDays: number;
}

/** Returns YYYY-MM-DD for a timestamp in local time */
function toDateKey(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA");
}

/** Returns YYYY-MM-DD for today in local time */
function todayKey(): string {
  return toDateKey(Date.now());
}

/** Subtracts `n` days from YYYY-MM-DD string */
function subtractDays(dateKey: string, n: number): string {
  const d = new Date(dateKey + "T00:00:00");
  d.setDate(d.getDate() - n);
  return d.toLocaleDateString("en-CA");
}

export function computeStreaks(entries: TimeEntry[]): StreakStats {
  const dailyMs = new Map<string, number>();

  for (const e of entries) {
    if (e.stoppedAt == null) continue; // skip running entries
    const key = toDateKey(e.startedAt);
    const ms = elapsedMs(e.startedAt, e.stoppedAt);
    dailyMs.set(key, (dailyMs.get(key) ?? 0) + ms);
  }

  const totalActiveDays = dailyMs.size;

  if (totalActiveDays === 0) {
    return { currentStreak: 0, longestStreak: 0, dailyMs, totalActiveDays: 0 };
  }

  // Sort all active days descending
  const sortedDays = Array.from(dailyMs.keys()).sort().reverse();

  // Current streak: count consecutive days back from today (or yesterday)
  const today = todayKey();
  const yesterday = subtractDays(today, 1);

  let currentStreak = 0;
  // Start from today; if today has no entries, try starting from yesterday
  const startKey = dailyMs.has(today) ? today : dailyMs.has(yesterday) ? yesterday : null;

  if (startKey) {
    let cursor = startKey;
    while (dailyMs.has(cursor)) {
      currentStreak++;
      cursor = subtractDays(cursor, 1);
    }
  }

  // Longest streak: scan all sorted days
  let longestStreak = 0;
  let runLength = 0;
  let prev: string | null = null;

  for (const day of sortedDays.slice().reverse()) {
    if (prev === null) {
      runLength = 1;
    } else {
      const expected = subtractDays(day, -1); // day + 1
      if (expected === prev) {
        // prev is exactly one day before current? Wait — sorted ascending
        // sorted ascending, so `day` comes after `prev`
        const expectedNext = subtractDays(prev, -1);
        if (expectedNext === day) {
          runLength++;
        } else {
          runLength = 1;
        }
      } else {
        runLength = 1;
      }
    }
    prev = day;
    if (runLength > longestStreak) longestStreak = runLength;
  }

  // Simpler approach: iterate sorted ascending
  const ascending = Array.from(dailyMs.keys()).sort();
  longestStreak = 0;
  runLength = 0;
  let prevDay: string | null = null;

  for (const day of ascending) {
    if (prevDay === null) {
      runLength = 1;
    } else {
      const expected = subtractDays(day, 1);
      if (expected === prevDay) {
        runLength++;
      } else {
        runLength = 1;
      }
    }
    if (runLength > longestStreak) longestStreak = runLength;
    prevDay = day;
  }

  return { currentStreak, longestStreak, dailyMs, totalActiveDays };
}

/** Returns an array of YYYY-MM-DD strings for the past `days` days, oldest first */
export function getRecentDays(days: number): string[] {
  const result: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    result.push(subtractDays(todayKey(), i));
  }
  return result;
}
