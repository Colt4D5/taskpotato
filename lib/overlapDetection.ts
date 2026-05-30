import { TimeEntry } from "@/types";

/**
 * Two completed entries overlap if their time ranges strictly intersect.
 * Touching (stoppedAt === other.startedAt) is NOT considered an overlap.
 */
export function entriesOverlap(a: TimeEntry, b: TimeEntry): boolean {
  if (!a.stoppedAt || !b.stoppedAt) return false;
  if (a.id === b.id) return false;
  return a.startedAt < b.stoppedAt && b.startedAt < a.stoppedAt;
}

/**
 * Returns a Set of entry IDs that overlap with at least one other completed entry.
 * O(n²) — acceptable for the typical entry counts in a local-first app.
 */
export function findOverlappingIds(entries: TimeEntry[]): Set<string> {
  const completed = entries.filter((e) => e.stoppedAt !== null);
  const overlapping = new Set<string>();

  for (let i = 0; i < completed.length; i++) {
    for (let j = i + 1; j < completed.length; j++) {
      if (entriesOverlap(completed[i], completed[j])) {
        overlapping.add(completed[i].id);
        overlapping.add(completed[j].id);
      }
    }
  }

  return overlapping;
}

/**
 * Returns all entries that would overlap with the proposed [proposedStart, proposedStop) range.
 * Excludes the entry being edited (by excludeId) so editing its own range doesn't self-flag.
 */
export function findProposedOverlaps(
  proposedStart: number,
  proposedStop: number,
  excludeId: string,
  entries: TimeEntry[]
): TimeEntry[] {
  return entries.filter(
    (e) =>
      e.id !== excludeId &&
      e.stoppedAt !== null &&
      proposedStart < e.stoppedAt! &&
      e.startedAt < proposedStop
  );
}
