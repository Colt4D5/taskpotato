/**
 * Shared utilities for TaskPotato session annotation parsing and serialization.
 *
 * Annotations are stored as an HTML comment block appended to a TimeEntry's notes field:
 *
 *   <!-- session-annotations
 *   [00:23:41|1421000] decided to use Redis
 *   [00:47:02|2822000] blocked on auth — asked Jake
 *   -->
 *
 * The base notes (everything before the block) are plain text.
 * This format is backward-compatible: entries without annotations round-trip cleanly.
 */

export interface SessionAnnotation {
  /** Elapsed ms since session start when the annotation was added */
  timestampMs: number;
  /** The annotation text */
  text: string;
}

export interface ParsedAnnotations {
  /** Entry notes with the annotation block stripped */
  baseNotes: string;
  /** Parsed annotation lines, in order */
  annotations: Array<SessionAnnotation & { elapsed: string }>;
}

const OPEN = "<!-- session-annotations";
const CLOSE = "-->";

/** Parse the structured session annotations block out of raw entry notes. */
export function parseAnnotations(raw: string): ParsedAnnotations {
  const startIdx = raw.indexOf(OPEN);
  if (startIdx === -1) return { baseNotes: raw, annotations: [] };

  const closeIdx = raw.indexOf(CLOSE, startIdx + OPEN.length);
  if (closeIdx === -1) return { baseNotes: raw, annotations: [] };

  const baseNotes = raw.slice(0, startIdx).trimEnd();
  const block = raw.slice(startIdx + OPEN.length, closeIdx);

  const annotations: Array<SessionAnnotation & { elapsed: string }> = [];

  for (const line of block.split("\n")) {
    const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\|(\d+)\]\s?(.*)$/);
    if (match) {
      annotations.push({
        elapsed: match[1],
        timestampMs: parseInt(match[2], 10),
        text: match[3],
      });
    }
  }

  return { baseNotes, annotations };
}

/** Format elapsed milliseconds as HH:MM:SS */
export function formatAnnotationElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

/** Serialize base notes + annotation array back into the combined notes string */
export function buildAnnotatedNotes(
  baseNotes: string,
  annotations: SessionAnnotation[]
): string {
  if (annotations.length === 0) return baseNotes;

  const lines = annotations
    .map((a) => {
      const elapsed = formatAnnotationElapsed(a.timestampMs);
      return `[${elapsed}|${a.timestampMs}] ${a.text}`;
    })
    .join("\n");

  const base = baseNotes.trimEnd();
  return `${base}${base ? "\n\n" : ""}${OPEN}\n${lines}\n${CLOSE}`;
}
