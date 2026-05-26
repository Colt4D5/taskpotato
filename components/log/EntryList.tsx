"use client";

import { useState, useEffect } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { groupByDay, formatDayLabel } from "@/lib/dateUtils";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { EntryRow } from "./EntryRow";
import { DayTimeline } from "./DayTimeline";
import { DayNote } from "./DayNote";
import { renderMarkdown } from "@/lib/markdown";

interface EntryListProps {
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
  onSelectDay?: (ids: string[]) => void;
  onDeselectDay?: (ids: string[]) => void;
  timelineMode?: boolean;
  // Day notes
  getDayNote?: (dateKey: string) => string;
  onSaveDayNote?: (dateKey: string, content: string) => void;
}

function todayKey(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function EntryList({
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
  onSelectDay,
  onDeselectDay,
  timelineMode,
  getDayNote,
  onSaveDayNote,
}: EntryListProps) {
  const completed = entries.filter((e) => e.stoppedAt !== null && !hiddenIds?.has(e.id));
  const grouped = groupByDay(completed);
  const sortedDays = Array.from(grouped.keys()).sort((a, b) =>
    b.localeCompare(a)
  );

  const today = todayKey();

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const day of sortedDays) {
      init[day] = day !== today;
    }
    return init;
  });

  useEffect(() => {
    setCollapsed((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const day of sortedDays) {
        if (!(day in next)) {
          next[day] = day !== today;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [sortedDays.join(","), today]); // eslint-disable-line react-hooks/exhaustive-deps

  // In bulk mode, expand all days so entries are visible for selection
  useEffect(() => {
    if (bulkMode) {
      setCollapsed({});
    }
  }, [bulkMode]);

  const toggleDay = (day: string) => {
    if (bulkMode) return; // no collapsing in bulk mode
    setCollapsed((prev) => ({ ...prev, [day]: !prev[day] }));
  };

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  if (sortedDays.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
        <p className="text-4xl mb-4">🥔</p>
        <p className="text-sm">No entries yet. Start the timer.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {sortedDays.map((day) => {
        const dayEntries = (grouped.get(day) ?? []).sort(
          (a, b) => b.startedAt - a.startedAt
        );
        const totalMs = dayEntries.reduce(
          (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
          0
        );
        const isCollapsed = bulkMode ? false : (collapsed[day] ?? day !== today);
        const entryCount = dayEntries.length;
        const dayIds = dayEntries.map((e) => e.id);
        const allDaySelected = bulkMode && dayIds.every((id) => selectedIds?.has(id));

        return (
          <div key={day}>
            {/* Day header */}
            <button
              onClick={() => toggleDay(day)}
              className="w-full flex items-center justify-between px-4 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors group"
              aria-expanded={!isCollapsed}
            >
              <div className="flex items-center gap-2">
                {/* Per-day select-all checkbox in bulk mode */}
                {bulkMode && (
                  <input
                    type="checkbox"
                    checked={allDaySelected}
                    onChange={(e) => {
                      e.stopPropagation();
                      if (allDaySelected) {
                        onDeselectDay?.(dayIds);
                      } else {
                        onSelectDay?.(dayIds);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 accent-orange-500 cursor-pointer"
                    title={allDaySelected ? "Deselect day" : "Select all in day"}
                  />
                )}
                {/* Day note button */}
                {!bulkMode && getDayNote && onSaveDayNote && (
                  <DayNote
                    dateKey={day}
                    note={getDayNote(day)}
                    onSave={onSaveDayNote}
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
                <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider group-hover:text-zinc-300 transition-colors">
                  {formatDayLabel(day)}
                </h2>
                {isCollapsed && (
                  <span className="text-xs text-zinc-600 font-normal normal-case tracking-normal">
                    {entryCount} {entryCount === 1 ? "entry" : "entries"}
                  </span>
                )}
              </div>
              <span className="text-sm text-zinc-500 font-mono group-hover:text-zinc-400 transition-colors">
                {formatDurationShort(totalMs)}
              </span>
            </button>

            {/* Collapsible entry list */}
            {!isCollapsed && !timelineMode && getDayNote && onSaveDayNote && getDayNote(day) && !bulkMode && (
              <div className="mt-1 px-4 py-2.5 bg-amber-950/20 border border-amber-400/15 rounded-xl">
                <div
                  className="prose prose-invert prose-sm max-w-none text-amber-200/80 text-xs leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(getDayNote(day)) }}
                />
              </div>
            )}
            {!isCollapsed && !timelineMode && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 divide-y divide-zinc-800/50 mt-1">
                {dayEntries.map((entry) => (
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
                  />
                ))}
              </div>
            )}

            {/* Timeline view */}
            {!isCollapsed && timelineMode && (
              <div className="bg-zinc-900 rounded-xl border border-zinc-800 mt-1 overflow-hidden">
                <DayTimeline
                  dateStr={day}
                  entries={dayEntries}
                  projects={projects}
                  tasks={tasks}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
