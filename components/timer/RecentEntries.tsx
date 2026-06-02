"use client";

import { useMemo } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { formatDurationShort, elapsedMs } from "@/lib/duration";
import { Badge } from "@/components/ui/Badge";

interface RecentEntriesProps {
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  onResume: (entry: TimeEntry) => void;
}

function getTimeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 2) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

/**
 * Deduplicate entries by (notes, projectId, taskId) — show the most recent
 * instance of each distinct "type of work" the user has done, up to `limit`.
 */
function deduplicateRecent(entries: TimeEntry[], limit = 3): TimeEntry[] {
  const seen = new Set<string>();
  const result: TimeEntry[] = [];
  for (const entry of entries) {
    if (entry.stoppedAt === null) continue;
    const key = `${entry.notes}|${entry.projectId ?? ""}|${entry.taskId ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(entry);
    if (result.length >= limit) break;
  }
  return result;
}

export function RecentEntries({ entries, projects, tasks, onResume }: RecentEntriesProps) {
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const recent = useMemo(() => deduplicateRecent(entries), [entries]);

  if (recent.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Continue</span>
        <span className="text-xs text-zinc-600">
          Press{" "}
          <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500 font-mono text-[10px]">
            C
          </kbd>{" "}
          to resume most recent
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {recent.map((entry, i) => {
          const proj = entry.projectId ? projectMap.get(entry.projectId) : undefined;
          const task = entry.taskId ? taskMap.get(entry.taskId) : undefined;
          const dur = elapsedMs(entry.startedAt, entry.stoppedAt!);

          return (
            <button
              key={entry.id}
              onClick={() => onResume(entry)}
              className="group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/80 hover:border-zinc-700 transition-all text-left"
              title={`Resume: ${entry.notes || "No description"}`}
            >
              {/* Project color dot */}
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: proj?.color ?? "#52525b" }}
              />

              {/* Description + meta */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-zinc-300 truncate">
                  {entry.notes || (
                    <span className="italic text-zinc-500">No description</span>
                  )}
                </p>
                {(proj || task || (entry.tags?.length ?? 0) > 0) && (
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {proj && <Badge label={proj.name} color={proj.color} />}
                    {task && (
                      <span className="text-xs text-zinc-500">{task.name}</span>
                    )}
                    {(entry.tags?.length ?? 0) > 0 && (
                      <span className="text-xs text-zinc-600">
                        {entry.tags.map((t) => `#${t}`).join(" ")}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Right: duration, time ago, play button */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-mono text-zinc-400">
                    {formatDurationShort(dur)}
                  </p>
                  <p className="text-xs text-zinc-600">{getTimeAgo(entry.stoppedAt!)}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-md border transition-colors ${
                    i === 0
                      ? "border-orange-700/50 text-orange-400 bg-orange-900/20 group-hover:bg-orange-900/40"
                      : "border-zinc-700 text-zinc-500 group-hover:text-zinc-300 group-hover:border-zinc-600"
                  }`}
                >
                  ▶
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
