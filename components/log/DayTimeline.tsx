"use client";

import { useMemo } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { formatDurationShort } from "@/lib/duration";
import { formatTime, startOfDay, endOfDay } from "@/lib/dateUtils";

interface DayTimelineProps {
  dateStr: string; // YYYY-MM-DD
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
}

const HOUR_HEIGHT = 48; // px per hour
const TOTAL_HOURS = 24;
const TOTAL_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;

// Which hours to show a label for
const LABEL_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

function formatHour(h: number): string {
  if (h === 0) return "12 AM";
  if (h < 12) return `${h} AM`;
  if (h === 12) return "12 PM";
  return `${h - 12} PM`;
}

export function DayTimeline({ dateStr, entries, projects, tasks }: DayTimelineProps) {
  const dayStart = useMemo(
    () => startOfDay(new Date(dateStr + "T00:00:00")),
    [dateStr]
  );
  const dayEnd = useMemo(
    () => endOfDay(new Date(dateStr + "T00:00:00")),
    [dateStr]
  );

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );
  const taskMap = useMemo(
    () => new Map(tasks.map((t) => [t.id, t])),
    [tasks]
  );

  // Compute layout columns to handle overlapping entries
  const blocks = useMemo(() => {
    // Sort by startedAt
    const sorted = [...entries].sort((a, b) => a.startedAt - b.startedAt);

    // Assign columns: simple greedy algorithm
    type Column = { end: number };
    const cols: Column[] = [];
    const assigned: { entry: TimeEntry; col: number; totalCols: number }[] = [];

    for (const entry of sorted) {
      const start = Math.max(entry.startedAt, dayStart);
      const stop = Math.min(entry.stoppedAt ?? dayEnd, dayEnd);
      if (stop <= start) continue;

      // Find first available column
      let col = cols.findIndex((c) => c.end <= start);
      if (col === -1) {
        col = cols.length;
        cols.push({ end: stop });
      } else {
        cols[col].end = stop;
      }

      assigned.push({ entry, col, totalCols: 0 });
    }

    // Second pass: determine max overlapping columns for width calculation
    // For each entry, count how many columns are active concurrently
    return assigned.map((item) => {
      const start = Math.max(item.entry.startedAt, dayStart);
      const stop = Math.min(item.entry.stoppedAt ?? dayEnd, dayEnd);
      // Count entries that overlap this time range
      const overlapping = assigned.filter((other) => {
        const os = Math.max(other.entry.startedAt, dayStart);
        const oe = Math.min(other.entry.stoppedAt ?? dayEnd, dayEnd);
        return os < stop && oe > start;
      });
      const maxCol = Math.max(...overlapping.map((o) => o.col)) + 1;
      return { ...item, totalCols: maxCol };
    });
  }, [entries, dayStart, dayEnd]);

  function msToPercent(ms: number): number {
    return ((ms - dayStart) / (dayEnd - dayStart + 1)) * 100;
  }

  function msToTop(ms: number): number {
    return ((ms - dayStart) / (86400 * 1000)) * TOTAL_HEIGHT;
  }

  function msToHeight(startMs: number, stopMs: number): number {
    return ((stopMs - startMs) / (86400 * 1000)) * TOTAL_HEIGHT;
  }

  const nowMs = Date.now();
  const isToday = dateStr === new Date().toLocaleDateString("en-CA");
  const nowTop = isToday ? msToTop(Math.max(nowMs, dayStart)) : null;

  return (
    <div className="relative flex" style={{ height: TOTAL_HEIGHT }}>
      {/* Hour labels column */}
      <div className="relative w-12 flex-shrink-0 select-none">
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, h) => (
          <div
            key={h}
            className="absolute right-2 text-[10px] text-zinc-600 leading-none"
            style={{ top: h * HOUR_HEIGHT - 5 }}
          >
            {LABEL_HOURS.includes(h) ? formatHour(h) : ""}
          </div>
        ))}
      </div>

      {/* Grid + blocks */}
      <div className="relative flex-1 overflow-hidden">
        {/* Hour grid lines */}
        {Array.from({ length: TOTAL_HOURS + 1 }, (_, h) => (
          <div
            key={h}
            className={`absolute left-0 right-0 border-t ${
              h % 6 === 0
                ? "border-zinc-700"
                : h % 3 === 0
                ? "border-zinc-800"
                : "border-zinc-900"
            }`}
            style={{ top: h * HOUR_HEIGHT }}
          />
        ))}

        {/* Now indicator */}
        {nowTop !== null && nowTop >= 0 && nowTop <= TOTAL_HEIGHT && (
          <div
            className="absolute left-0 right-0 z-20 pointer-events-none"
            style={{ top: nowTop }}
          >
            <div className="relative flex items-center">
              <div className="w-2 h-2 rounded-full bg-orange-400 -translate-y-1/2 flex-shrink-0" />
              <div className="flex-1 h-px bg-orange-400/60" />
            </div>
          </div>
        )}

        {/* Entry blocks */}
        {blocks.map(({ entry, col, totalCols }) => {
          const start = Math.max(entry.startedAt, dayStart);
          const stop = Math.min(entry.stoppedAt ?? dayEnd, dayEnd);
          const top = msToTop(start);
          const height = Math.max(msToHeight(start, stop), 6);
          const project = entry.projectId ? projectMap.get(entry.projectId) : null;
          const task = entry.taskId ? taskMap.get(entry.taskId) : null;
          const color = project?.color ?? "#71717a";
          const duration = formatDurationShort(stop - start);
          const shortEnough = height < 28;

          const widthPct = (1 / totalCols) * 100;
          const leftPct = (col / totalCols) * 100;

          return (
            <div
              key={entry.id}
              className="absolute rounded overflow-hidden group cursor-default"
              style={{
                top,
                height,
                left: `calc(${leftPct}% + 1px)`,
                width: `calc(${widthPct}% - 2px)`,
                backgroundColor: color + "33",
                borderLeft: `3px solid ${color}`,
                zIndex: 10,
              }}
              title={`${entry.notes || "(no description)"}\n${formatTime(entry.startedAt)} – ${entry.stoppedAt ? formatTime(entry.stoppedAt) : "running"} · ${duration}`}
            >
              {!shortEnough && (
                <div className="px-1 py-0.5 leading-tight overflow-hidden">
                  <div className="text-[11px] font-medium text-zinc-200 truncate">
                    {entry.notes || <span className="italic text-zinc-500">no description</span>}
                  </div>
                  {height > 44 && (
                    <div className="text-[10px] text-zinc-400 truncate">
                      {task ? task.name : project ? project.name : ""}
                      {task && project ? "" : ""}
                      {" "}
                      <span className="text-zinc-500">{duration}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
