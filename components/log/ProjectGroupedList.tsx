"use client";

import { useState, useEffect, useMemo } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { EntryRow } from "./EntryRow";

interface ProjectGroupedListProps {
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  allTags?: string[];
  onUpdate: (id: string, patch: Partial<Omit<TimeEntry, "id">>) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (entry: TimeEntry) => void;
  onResume?: (entry: TimeEntry) => void;
  onSplit?: (id: string, splitAt: number, secondProjectId: string | null, secondTaskId: string | null) => void;
  hasRunning?: boolean;
  searchQuery?: string;
  hiddenIds?: Set<string>;
  // bulk selection
  bulkMode?: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectGroup?: (ids: string[]) => void;
  onDeselectGroup?: (ids: string[]) => void;
}

function groupByProject(
  entries: TimeEntry[]
): Map<string | null, TimeEntry[]> {
  const map = new Map<string | null, TimeEntry[]>();
  for (const e of entries) {
    const key = e.projectId ?? null;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(e);
  }
  return map;
}

export function ProjectGroupedList({
  entries,
  projects,
  tasks,
  allTags,
  onUpdate,
  onDelete,
  onDuplicate,
  onResume,
  onSplit,
  hasRunning,
  searchQuery = "",
  hiddenIds,
  bulkMode,
  selectedIds,
  onToggleSelect,
  onSelectGroup,
  onDeselectGroup,
}: ProjectGroupedListProps) {
  const completed = entries.filter((e) => e.stoppedAt !== null && !hiddenIds?.has(e.id));

  const grouped = useMemo(() => groupByProject(completed), [completed]);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Sort project groups by total tracked time descending
  const sortedGroups = useMemo(() => {
    return Array.from(grouped.entries()).sort(([, aEntries], [, bEntries]) => {
      const aMs = aEntries.reduce((s, e) => s + elapsedMs(e.startedAt, e.stoppedAt), 0);
      const bMs = bEntries.reduce((s, e) => s + elapsedMs(e.startedAt, e.stoppedAt), 0);
      return bMs - aMs;
    });
  }, [grouped]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // In bulk mode, expand all
  useEffect(() => {
    if (bulkMode) {
      setCollapsed({});
    }
  }, [bulkMode]);

  const toggleGroup = (key: string) => {
    if (bulkMode) return;
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (sortedGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
        <p className="text-4xl mb-4">🥔</p>
        <p className="text-sm">No entries yet. Start the timer.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedGroups.map(([projectId, groupEntries]) => {
        const project = projectId ? projectMap.get(projectId) : undefined;
        const groupKey = projectId ?? "__none__";
        const totalMs = groupEntries.reduce(
          (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
          0
        );
        const isCollapsed = bulkMode ? false : (collapsed[groupKey] ?? false);
        const sortedEntries = [...groupEntries].sort((a, b) => b.startedAt - a.startedAt);
        const groupIds = sortedEntries.map((e) => e.id);
        const allGroupSelected = bulkMode && groupIds.every((id) => selectedIds?.has(id));

        return (
          <div key={groupKey}>
            {/* Group header */}
            <button
              onClick={() => toggleGroup(groupKey)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors group"
              aria-expanded={!isCollapsed}
            >
              <div className="flex items-center gap-2">
                {/* Per-group select-all checkbox in bulk mode */}
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={allGroupSelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (allGroupSelected) {
                        onDeselectGroup?.(groupIds);
                      } else {
                        onSelectGroup?.(groupIds);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                    title={allGroupSelected ? "Deselect group" : "Select all in project"}
                  />
                )}
                {!bulkMode && (
                  <svg
                    className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-150 ${
                      isCollapsed ? "-rotate-90" : "rotate-0"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}

                {/* Project color dot */}
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project?.color ?? "#52525b" }}
                />

                <h2 className="text-sm font-semibold text-zinc-300 group-hover:text-zinc-200 transition-colors">
                  {project?.name ?? (
                    <span className="italic text-zinc-500">No project</span>
                  )}
                </h2>

                <span className="text-xs text-zinc-600">
                  {groupEntries.length} {groupEntries.length === 1 ? "entry" : "entries"}
                </span>
              </div>

              <span className="text-sm text-zinc-500 font-mono group-hover:text-zinc-400 transition-colors">
                {formatDurationShort(totalMs)}
              </span>
            </button>

            {/* Entries */}
            {!isCollapsed && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800/50 mt-1">
                {sortedEntries.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    project={entry.projectId ? projectMap.get(entry.projectId) : undefined}
                    task={entry.taskId ? taskMap.get(entry.taskId) : undefined}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                    onDuplicate={onDuplicate}
                    projects={projects}
                    tasks={tasks}
                    allTags={allTags}
                    onResume={onResume}
                    hasRunning={hasRunning}
                    onSplit={onSplit}
                    selectable={bulkMode}
                    selected={selectedIds?.has(entry.id)}
                    onToggleSelect={onToggleSelect}
                    searchQuery={searchQuery}
                    showDate
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
