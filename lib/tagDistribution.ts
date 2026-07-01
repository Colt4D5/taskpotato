import { TimeEntry } from "@/types";
import { elapsedMs } from "@/lib/duration";

export interface TagDistributionRow {
  tag: string;
  totalMs: number;
  billableMs: number;
  nonBillableMs: number;
  entryCount: number;
  pct: number; // 0–100, share of total tagged time
}

export interface TagDistributionResult {
  rows: TagDistributionRow[];
  /** Total ms across all entries in the range (including untagged) */
  totalRangeMs: number;
  /** Total ms across entries that have at least one tag */
  totalTaggedMs: number;
  /** ms of entries with no tags at all */
  untaggedMs: number;
  /** Entry count with no tags */
  untaggedEntryCount: number;
}

/**
 * Compute how tracked time is distributed across tags for a set of entries.
 *
 * An entry with multiple tags contributes its full duration to each tag
 * (i.e. tags are not mutually exclusive — this is distribution, not partition).
 * The `pct` on each row is relative to `totalTaggedMs` so percentages reflect
 * how much of the *tagged* time each tag claims, not the range total.
 *
 * Rows are sorted by `totalMs` descending.
 */
export function computeTagDistribution(entries: TimeEntry[]): TagDistributionResult {
  const tagMap = new Map<
    string,
    { totalMs: number; billableMs: number; nonBillableMs: number; entryCount: number }
  >();

  let totalRangeMs = 0;
  let totalTaggedMs = 0;
  let untaggedMs = 0;
  let untaggedEntryCount = 0;

  for (const e of entries) {
    if (!e.stoppedAt) continue; // skip running entry
    const ms = elapsedMs(e.startedAt, e.stoppedAt);
    totalRangeMs += ms;

    const tags = e.tags ?? [];
    if (tags.length === 0) {
      untaggedMs += ms;
      untaggedEntryCount++;
      continue;
    }

    // Each entry contributes to the "tagged" pool once (even if multi-tagged)
    totalTaggedMs += ms;

    for (const tag of tags) {
      const existing = tagMap.get(tag) ?? {
        totalMs: 0,
        billableMs: 0,
        nonBillableMs: 0,
        entryCount: 0,
      };
      existing.totalMs += ms;
      if (e.billable !== false) {
        existing.billableMs += ms;
      } else {
        existing.nonBillableMs += ms;
      }
      existing.entryCount++;
      tagMap.set(tag, existing);
    }
  }

  const rows: TagDistributionRow[] = Array.from(tagMap.entries())
    .map(([tag, data]) => ({
      tag,
      ...data,
      pct: totalTaggedMs > 0 ? (data.totalMs / totalTaggedMs) * 100 : 0,
    }))
    .sort((a, b) => b.totalMs - a.totalMs);

  return {
    rows,
    totalRangeMs,
    totalTaggedMs,
    untaggedMs,
    untaggedEntryCount,
  };
}
