import { TimeEntry } from "@/types";
import { elapsedMs } from "@/lib/duration";

export interface WeekdayBucket {
  /** 0 = Sunday, 1 = Monday, … 6 = Saturday */
  dow: number;
  /** Short label: "Sun", "Mon", etc. */
  label: string;
  /** Total tracked milliseconds across all occurrences of this weekday in the range */
  totalMs: number;
  /** Number of calendar occurrences of this weekday in the range (for average) */
  occurrences: number;
  /** Average ms per occurrence (0 when occurrences === 0) */
  avgMs: number;
}

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/**
 * Count how many times each weekday (0–6) appears between rangeStart (inclusive,
 * midnight) and rangeEnd (exclusive or midnight of day after last day).
 *
 * rangeStart and rangeEnd are Date objects.  The range spans:
 *   [rangeStart, rangeEnd)
 * which for a 7-day week is exactly 7 occurrences of each DOW.
 * For a single day it is exactly 1 occurrence of that DOW.
 */
function countWeekdayOccurrences(
  rangeStart: Date,
  rangeEnd: Date
): number[] {
  const counts = new Array(7).fill(0);
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);
  const endMs = rangeEnd.getTime();

  while (cursor.getTime() < endMs) {
    counts[cursor.getDay()]++;
    cursor.setDate(cursor.getDate() + 1);
  }
  return counts;
}

/**
 * Distribute completed time entries into 7 day-of-week buckets.
 *
 * Each entry is assigned to the weekday of its `startedAt` timestamp (local
 * time).  A very long multi-day entry is NOT split across days here — it lands
 * on whatever day it started.  That matches how users conceptually think about
 * a working session started on a Tuesday.
 *
 * @param entries   Completed entries to analyse
 * @param rangeStart  Start of the date range (used to count occurrences)
 * @param rangeEnd    End of the date range (exclusive, i.e. midnight after last day)
 * @param weekStartsOn  0 = Sunday, 1 = Monday (controls array ordering)
 */
export function computeWeekdayDistribution(
  entries: TimeEntry[],
  rangeStart: Date,
  rangeEnd: Date,
  weekStartsOn: 0 | 1 = 1
): WeekdayBucket[] {
  const totalMs = new Array(7).fill(0);

  for (const entry of entries) {
    if (entry.stoppedAt == null) continue;
    const dow = new Date(entry.startedAt).getDay(); // 0 = Sun
    totalMs[dow] += elapsedMs(entry.startedAt, entry.stoppedAt);
  }

  const occurrences = countWeekdayOccurrences(rangeStart, rangeEnd);

  // Build buckets in week-order starting from weekStartsOn
  const buckets: WeekdayBucket[] = [];
  for (let i = 0; i < 7; i++) {
    const dow = (weekStartsOn + i) % 7;
    const occ = occurrences[dow];
    const ms = totalMs[dow];
    buckets.push({
      dow,
      label: DOW_LABELS[dow],
      totalMs: ms,
      occurrences: occ,
      avgMs: occ > 0 ? Math.round(ms / occ) : 0,
    });
  }
  return buckets;
}

export interface WeekdayStats {
  peakDow: number | null;
  peakMs: number;
  activeDays: number;
  /** Days with zero tracked time in the range */
  emptyDays: number;
}

export function weekdayStats(buckets: WeekdayBucket[]): WeekdayStats {
  const maxMs = Math.max(...buckets.map((b) => b.totalMs));
  const peakBucket = buckets.find((b) => b.totalMs === maxMs && b.totalMs > 0);
  const activeDays = buckets.filter((b) => b.totalMs > 0).length;
  const emptyDays = 7 - activeDays;
  return {
    peakDow: peakBucket?.dow ?? null,
    peakMs: maxMs,
    activeDays,
    emptyDays,
  };
}
