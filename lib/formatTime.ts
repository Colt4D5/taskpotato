export function msToHMS(ms: number): string {
  const totalSecs = Math.floor(ms / 1000);
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function hmsToMs(hms: string): number {
  const parts = hms.split(":").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return 0;
  const [h, m, s] = parts;
  return (h * 3600 + m * 60 + s) * 1000;
}
