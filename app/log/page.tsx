"use client";

import { useState, useMemo, useEffect } from "react";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { EntryList } from "@/components/log/EntryList";
import { DateRangeFilter, type DateRange } from "@/components/log/DateRangeFilter";
import { QuickEntryForm } from "@/components/log/QuickEntryForm";
import { startOfDay, endOfDay } from "@/lib/dateUtils";

export default function LogPage() {
  const { completedEntries, runningEntry, updateEntry, deleteEntry, resumeEntry, duplicateEntry, addEntry } = useEntries();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [filterTaskName, setFilterTaskName] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  // N shortcut: open quick entry form when not in an input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" || e.key === "N") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setQuickEntryOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of completedEntries) {
      for (const t of (e.tags ?? [])) set.add(t);
    }
    return Array.from(set).sort();
  }, [completedEntries]);

  const filteredEntries = useMemo(() => {
    const fromMs = dateRange.from
      ? startOfDay(new Date(dateRange.from + "T00:00:00"))
      : null;
    const toMs = dateRange.to
      ? endOfDay(new Date(dateRange.to + "T00:00:00"))
      : null;

    return completedEntries.filter((e) => {
      if (filterProjectId && e.projectId !== filterProjectId) return false;
      if (filterTaskName.trim()) {
        const taskName = e.taskId ? (taskMap.get(e.taskId)?.name ?? "") : "";
        if (!taskName.toLowerCase().includes(filterTaskName.trim().toLowerCase())) return false;
      }
      if (filterTag && !(e.tags ?? []).includes(filterTag)) return false;
      if (fromMs !== null && e.startedAt < fromMs) return false;
      if (toMs !== null && e.startedAt > toMs) return false;
      return true;
    });
  }, [completedEntries, filterProjectId, filterTaskName, filterTag, dateRange, taskMap]);

  const hasActiveFilter =
    filterProjectId || filterTaskName || filterTag || dateRange.from || dateRange.to;

  function clearFilters() {
    setFilterProjectId("");
    setFilterTaskName("");
    setFilterTag("");
    setDateRange({ from: "", to: "" });
  }

  const handleDuplicate = (entry: { id: string }) => {
    duplicateEntry(entry.id);
  };

  const handleResume = (entry: { id: string }) => {
    resumeEntry(entry.id);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">Time Log</h1>
        <button
          onClick={() => setQuickEntryOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors font-medium"
        >
          <span className="text-base leading-none">+</span> Log time
        </button>
      </div>

      {/* Date range filter */}
      <DateRangeFilter value={dateRange} onChange={setDateRange} />

      {/* Field filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter by task name…"
          value={filterTaskName}
          onChange={(e) => setFilterTaskName(e.target.value)}
          className="flex-1 min-w-[140px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="flex-1 min-w-[120px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>#{t}</option>
            ))}
          </select>
        )}
        {hasActiveFilter && (
          <button
            onClick={clearFilters}
            className="px-3 py-2 text-xs text-zinc-500 hover:text-orange-400 border border-zinc-800 rounded-lg transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Filtered entry count hint */}
      {(dateRange.from || dateRange.to) && (
        <p className="text-xs text-zinc-500 mb-3">
          {filteredEntries.length === 0
            ? "No entries in this range."
            : `${filteredEntries.length} entr${filteredEntries.length === 1 ? "y" : "ies"} in selected range`}
        </p>
      )}

      <QuickEntryForm
        open={quickEntryOpen}
        projects={projects}
        tasks={tasks}
        onSave={(entry) => addEntry(entry)}
        onClose={() => setQuickEntryOpen(false)}
      />

      <EntryList
        entries={filteredEntries}
        projects={projects}
        tasks={tasks}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
        onDuplicate={handleDuplicate}
        onResume={handleResume}
        hasRunning={runningEntry !== null}
      />
    </div>
  );
}
