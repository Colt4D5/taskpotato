import { TimeEntry } from "@/types";

export interface HourBucket {
  /** 0–23 */
  hour: number;
  /** Total milliseconds tracked during this hour across all entries in the set */
  ms: number;
}

/**
 * Distribute completed time entries into 24 hourly buckets.
 *
 * An entry can span multiple hours (e.g. 10:30 → 13:15). For each entry we
 * slice the actual time range into per-hour segments and accumulate ms in the
 * corresponding bucket.  This is more accurate than assigning the full entry to
 * the start-hour, especially for entries spanning several hours.
 */
export function computePeakHours(entries: TimeEntry[]): HourBucket[] {
  const buckets = Array.from({ length: 24 }, (_, h) => ({ hour: h, ms: 0 }));

  for (const entry of entries) {
    if (entry.stoppedAt == null) continue;
    const start = entry.startedAt;
    const stop = entry.stoppedAt;
    if (stop <= start) continue;

    // Walk through each calendar hour that the entry overlaps
    const startDate = new Date(start);
    // Clamp cursor to the start of the first hour the entry touches
    const cursor = new Date(startDate);
    cursor.setMinutes(0, 0, 0);

    while (cursor.getTime() < stop) {
      const sliceStart = Math.max(cursor.getTime(), start);
      const sliceEnd = Math.min(cursor.getTime() + 3_600_000, stop);
      if (sliceEnd > sliceStart) {
        const h = cursor.getHours();
        buckets[h].ms += sliceEnd - sliceStart;
      }
      cursor.setHours(cursor.getHours() + 1);
    }
  }

  return buckets;
}

/** Format hour as "12 AM", "1 PM", etc. */
export function formatHourLabel(hour: number): string {
  if (hour === 0) return "12 AM";
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

/**
 * Return summary statistics about a set of hour buckets.
 */
export function peakHourStats(buckets: HourBucket[]): {
  peakHour: number | null;
  peakMs: number;
  activeHours: number;
  topQuartileHours: number[];
} {
  const maxMs = Math.max(...buckets.map((b) => b.ms));
  const peakBucket = buckets.find((b) => b.ms === maxMs && b.ms > 0);
  const activeHours = buckets.filter((b) => b.ms > 0).length;

  // Quartile threshold: top 25% by ms
  const sorted = [...buckets].sort((a, b) => b.ms - a.ms);
  const topN = Math.max(1, Math.ceil(activeHours * 0.25));
  const topMs = sorted
    .filter((b) => b.ms > 0)
    .slice(0, topN)
    .map((b) => b.ms);
  const minTopMs = topMs.length > 0 ? Math.min(...topMs) : Infinity;
  const topQuartileHours = buckets
    .filter((b) => b.ms >= minTopMs && b.ms > 0)
    .map((b) => b.hour);

  return {
    peakHour: peakBucket?.hour ?? null,
    peakMs: maxMs,
    activeHours,
    topQuartileHours,
  };
}
