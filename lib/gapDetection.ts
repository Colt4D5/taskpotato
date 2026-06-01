import { TimeEntry } from "@/types";

export interface TimeGap {
  /** Gap start — end time of the preceding entry (epoch ms) */
  gapStart: number;
  /** Gap end — start time of the following entry (epoch ms) */
  gapEnd: number;
  /** Duration of the gap in milliseconds */
  gapMs: number;
  /** id of the entry immediately before this gap */
  beforeEntryId: string;
  /** id of the entry immediately after this gap */
  afterEntryId: string;
}

/**
 * Given a list of completed entries that all fall within the same calendar day
 * (sorted in any order), return the untracked gaps between consecutive entries.
 *
 * Gaps smaller than `minGapMs` (default 1 minute) are ignored — tiny rounding
 * artefacts shouldn't show up as actionable gaps.
 *
 * Only gaps between entries that have both a valid `stoppedAt` and the following
 * entry has a valid `startedAt` are considered.  The function does NOT produce a
 * gap for the time before the first entry or after the last entry — those are
 * intentional open ends of the day.
 */
export function findDayGaps(
  dayEntries: TimeEntry[],
  minGapMs = 60_000
): TimeGap[] {
  const completed = dayEntries.filter(
    (e): e is TimeEntry & { stoppedAt: number } => e.stoppedAt !== null
  );

  if (completed.length < 2) return [];

  // Sort by start time ascending
  const sorted = [...completed].sort((a, b) => a.startedAt - b.startedAt);

  const gaps: TimeGap[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    // The "end" of current is stoppedAt; next starts at startedAt
    const gapStart = current.stoppedAt;
    const gapEnd = next.startedAt;
    const gapMs = gapEnd - gapStart;

    if (gapMs >= minGapMs) {
      gaps.push({
        gapStart,
        gapEnd,
        gapMs,
        beforeEntryId: current.id,
        afterEntryId: next.id,
      });
    }
  }

  return gaps;
}

/**
 * Compute total untracked gap time for a set of entries in a single day.
 * Convenience wrapper used for summary display.
 */
export function totalGapMs(dayEntries: TimeEntry[], minGapMs = 60_000): number {
  return findDayGaps(dayEntries, minGapMs).reduce((s, g) => s + g.gapMs, 0);
}
