/** Format milliseconds as HH:MM:SS */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((v) => String(v).padStart(2, "0"))
    .join(":");
}

/** Format milliseconds as "1h 23m" short form */
export function formatDurationShort(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}m`;
}

export function elapsedMs(startedAt: number, stoppedAt: number | null): number {
  return (stoppedAt ?? Date.now()) - startedAt;
}

/**
 * Round a timestamp to the nearest `minutes` boundary.
 * Pass 0 to skip rounding.
 */
export function roundTimestamp(ts: number, minutes: 0 | 5 | 10 | 15): number {
  if (minutes === 0) return ts;
  const intervalMs = minutes * 60 * 1000;
  return Math.round(ts / intervalMs) * intervalMs;
}
