"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { EntryList } from "@/components/log/EntryList";
import { BulkActionBar } from "@/components/log/BulkActionBar";
import { DateRangeFilter, type DateRange } from "@/components/log/DateRangeFilter";
import { QuickEntryForm } from "@/components/log/QuickEntryForm";
import { startOfDay, endOfDay } from "@/lib/dateUtils";

export default function LogPage() {
  const { completedEntries, runningEntry, updateEntry, updateEntries, deleteEntry, deleteEntries, resumeEntry, duplicateEntry, addEntry, splitEntry } = useEntries();
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { clients } = useClients();

  const [filterClientId, setFilterClientId] = useState<string>("");
  const [filterTaskName, setFilterTaskName] = useState<string>("");
  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);

  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // N shortcut: open quick entry form when not in an input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "n" || e.key === "N") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setQuickEntryOpen(true);
      }
      // Escape exits bulk mode
      if (e.key === "Escape" && bulkMode) {
        setBulkMode(false);
        setSelectedIds(new Set());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [bulkMode]);

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of completedEntries) {
      for (const t of (e.tags ?? [])) set.add(t);
    }
    return Array.from(set).sort();
  }, [completedEntries]);

  const projectClientMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of projects) { if (p.clientId) map.set(p.id, p.clientId); }
    return map;
  }, [projects]);

  const filteredEntries = useMemo(() => {
    const fromMs = dateRange.from
      ? startOfDay(new Date(dateRange.from + "T00:00:00"))
      : null;
    const toMs = dateRange.to
      ? endOfDay(new Date(dateRange.to + "T00:00:00"))
      : null;

    return completedEntries.filter((e) => {
      if (filterClientId) {
        const cid = e.projectId ? projectClientMap.get(e.projectId) : undefined;
        if (cid !== filterClientId) return false;
      }
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
  }, [completedEntries, filterClientId, filterProjectId, filterTaskName, filterTag, dateRange, taskMap, projectClientMap]);

  const hasActiveFilter =
    filterClientId || filterProjectId || filterTaskName || filterTag || dateRange.from || dateRange.to;

  function clearFilters() {
    setFilterClientId("");
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

  // Bulk selection handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredEntries.map((e) => e.id)));
  }, [filteredEntries]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const selectDay = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }, []);

  const deselectDay = useCallback((ids: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
  }, []);

  const handleBulkDelete = useCallback(() => {
    deleteEntries(Array.from(selectedIds));
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds, deleteEntries]);

  const handleBulkReassign = useCallback((projectId: string | null) => {
    updateEntries(Array.from(selectedIds), { projectId, taskId: null });
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds, updateEntries]);

  const handleBulkAddTag = useCallback((tag: string) => {
    const ids = Array.from(selectedIds);
    for (const id of ids) {
      const entry = completedEntries.find((e) => e.id === id);
      if (!entry) continue;
      const tags = entry.tags ?? [];
      if (!tags.includes(tag)) {
        updateEntry(id, { tags: [...tags, tag] });
      }
    }
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds, completedEntries, updateEntry]);

  const handleBulkSetBillable = useCallback((billable: boolean) => {
    updateEntries(Array.from(selectedIds), { billable });
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds, updateEntries]);

  const handleSplit = useCallback(
    (id: string, splitAt: number, secondProjectId: string | null, secondTaskId: string | null) => {
      splitEntry(id, splitAt, { projectId: secondProjectId, taskId: secondTaskId });
    },
    [splitEntry]
  );

  function exitBulkMode() {
    setBulkMode(false);
    setSelectedIds(new Set());
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-zinc-100">Time Log</h1>
        <div className="flex items-center gap-2">
          {bulkMode ? (
            <button
              onClick={exitBulkMode}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
          ) : (
            <>
              <button
                onClick={() => setBulkMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg transition-colors font-medium"
                title="Select multiple entries for bulk actions"
              >
                ☑ Select
              </button>
              <button
                onClick={() => setQuickEntryOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors font-medium"
              >
                <span className="text-base leading-none">+</span> Log time
              </button>
            </>
          )}
        </div>
      </div>

      {/* Bulk action bar */}
      {bulkMode && (
        <BulkActionBar
          selectedCount={selectedIds.size}
          totalCount={filteredEntries.length}
          projects={projects}
          onSelectAll={selectAll}
          onDeselectAll={deselectAll}
          onDeleteSelected={handleBulkDelete}
          onReassignProject={handleBulkReassign}
          onAddTag={handleBulkAddTag}
          onSetBillable={handleBulkSetBillable}
        />
      )}

      {/* Date range filter (hidden in bulk mode) */}
      {!bulkMode && <DateRangeFilter value={dateRange} onChange={setDateRange} />}

      {/* Field filters (hidden in bulk mode) */}
      {!bulkMode && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {clients.length > 0 && (
            <select
              value={filterClientId}
              onChange={(e) => setFilterClientId(e.target.value)}
              className="flex-1 min-w-[130px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">All Clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
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
      )}

      {/* Filtered entry count hint */}
      {!bulkMode && (dateRange.from || dateRange.to) && (
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
        onSplit={handleSplit}
        hasRunning={runningEntry !== null}
        bulkMode={bulkMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onSelectDay={selectDay}
        onDeselectDay={deselectDay}
      />
    </div>
  );
}
