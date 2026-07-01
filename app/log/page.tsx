"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useClients } from "@/hooks/useClients";
import { EntryList } from "@/components/log/EntryList";
import { ProjectGroupedList } from "@/components/log/ProjectGroupedList";
import { BulkActionBar } from "@/components/log/BulkActionBar";
import { DateRangeFilter, type DateRange } from "@/components/log/DateRangeFilter";
import { QuickEntryForm } from "@/components/log/QuickEntryForm";
import { LogStatsBar } from "@/components/log/LogStatsBar";
import { UndoToast } from "@/components/ui/UndoToast";
import { useUndoDelete } from "@/hooks/useUndoDelete";
import { startOfDay, endOfDay } from "@/lib/dateUtils";
import { exportFilteredCSV } from "@/lib/csvExport";
import { useFilterPresets } from "@/hooks/useFilterPresets";
import { FilterPresetsBar } from "@/components/log/FilterPresetsBar";
import { useDayNotes } from "@/hooks/useDayNotes";
import { DayNote } from "@/components/log/DayNote";
import { sortedProjectGroups } from "@/lib/projectSort";
import { findOverlappingIds } from "@/lib/overlapDetection";
import { StandupSummaryModal } from "@/components/log/StandupSummaryModal";

export default function LogPage() {
  const { completedEntries, runningEntry, updateEntry, updateEntries, deleteEntry, deleteEntries, resumeEntry, duplicateEntry, addEntry, splitEntry, allTags: entriesAllTags } = useEntries();
  const { presets, addPreset, deletePreset } = useFilterPresets();
  const { getNote: getDayNote, setNote: saveDayNote } = useDayNotes();
  const [todayNoteForceOpen, setTodayNoteForceOpen] = useState(false);

  // Overlap detection — computed over full dataset so banner shows even when filter is active
  const overlapCount = useMemo(() => findOverlappingIds(completedEntries).size, [completedEntries]);

  // Today's key for J shortcut
  const todayKey = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  // Undo delete
  const { pending: undoPending, pendingIds, stage: stageDelete, undo: undoDelete, commit: commitDelete } = useUndoDelete({
    onCommit: (ids) => deleteEntries(ids),
  });
  const { projects } = useProjects();
  const { tasks } = useTasks();
  const { clients } = useClients();

  const clientNameMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c.name])),
    [clients]
  );

  const [filterClientId, setFilterClientId] = useState<string>("");
  const [filterTaskName, setFilterTaskName] = useState<string>("");
  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");
  const [filterNotes, setFilterNotes] = useState<string>("");
  const notesSearchRef = useRef<HTMLInputElement>(null);
  const [dateRange, setDateRange] = useState<DateRange>({ from: "", to: "" });
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [timelineMode, setTimelineMode] = useState(false);
  const [groupBy, setGroupBy] = useState<"day" | "project">("day");
  const [showGaps, setShowGaps] = useState(false);
  const [showStandup, setShowStandup] = useState(false);

  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // N shortcut: open quick entry form when not in an input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "v" || e.key === "V") {
        const tag2 = (e.target as HTMLElement).tagName;
        if (tag2 === "INPUT" || tag2 === "TEXTAREA" || tag2 === "SELECT") return;
        e.preventDefault();
        setTimelineMode((prev) => !prev);
      }
      if (e.key === "g" || e.key === "G") {
        const tagG = (e.target as HTMLElement).tagName;
        if (tagG === "INPUT" || tagG === "TEXTAREA" || tagG === "SELECT") return;
        e.preventDefault();
        setGroupBy((prev) => (prev === "day" ? "project" : "day"));
      }
      if (e.key === "j" || e.key === "J") {
        const tagJ = (e.target as HTMLElement).tagName;
        if (tagJ === "INPUT" || tagJ === "TEXTAREA" || tagJ === "SELECT") return;
        e.preventDefault();
        setTodayNoteForceOpen(true);
      }
      if (e.key === "n" || e.key === "N") {
        const tag = (e.target as HTMLElement).tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        e.preventDefault();
        setQuickEntryOpen(true);
      }
      if (e.key === "s" || e.key === "S") {
        const tagS = (e.target as HTMLElement).tagName;
        if (tagS === "INPUT" || tagS === "TEXTAREA" || tagS === "SELECT") return;
        e.preventDefault();
        setShowStandup(true);
      }
      // / shortcut: focus notes search
      if (e.key === "/") {
        const tag3 = (e.target as HTMLElement).tagName;
        if (tag3 === "INPUT" || tag3 === "TEXTAREA" || tag3 === "SELECT") return;
        e.preventDefault();
        notesSearchRef.current?.focus();
        notesSearchRef.current?.select();
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
      if (filterNotes.trim()) {
        const q = filterNotes.trim().toLowerCase();
        if (!e.notes?.toLowerCase().includes(q)) return false;
      }
      if (fromMs !== null && e.startedAt < fromMs) return false;
      if (toMs !== null && e.startedAt > toMs) return false;
      return true;
    });
  }, [completedEntries, filterClientId, filterProjectId, filterTaskName, filterTag, filterNotes, dateRange, taskMap, projectClientMap]);

  const hasActiveFilter =
    filterClientId || filterProjectId || filterTaskName || filterTag || filterNotes || dateRange.from || dateRange.to;

  function handleExportFiltered() {
    let rangeLabel: string | undefined;
    if (dateRange.from && dateRange.to) {
      rangeLabel = `${dateRange.from}_${dateRange.to}`;
    } else if (dateRange.from) {
      rangeLabel = `from_${dateRange.from}`;
    } else if (dateRange.to) {
      rangeLabel = `to_${dateRange.to}`;
    }
    exportFilteredCSV({
      entries: filteredEntries,
      projects,
      tasks,
      clientNames: clientNameMap,
      rangeLabel,
    });
  }

  function clearFilters() {
    setFilterClientId("");
    setFilterProjectId("");
    setFilterTaskName("");
    setFilterTag("");
    setFilterNotes("");
    setDateRange({ from: "", to: "" });
    setActivePresetId(null);
  }

  function applyPreset(preset: import("@/types").FilterPreset) {
    setFilterClientId(preset.clientId);
    setFilterProjectId(preset.projectId);
    setFilterTaskName(preset.taskName);
    setFilterTag(preset.tag);
    setFilterNotes(preset.notes);
    setDateRange({ from: preset.dateRangeFrom, to: preset.dateRangeTo });
    setActivePresetId(preset.id);
  }

  function saveCurrentAsPreset(name: string) {
    const preset = addPreset(name, {
      clientId: filterClientId,
      projectId: filterProjectId,
      taskName: filterTaskName,
      tag: filterTag,
      notes: filterNotes,
      dateRangeFrom: dateRange.from,
      dateRangeTo: dateRange.to,
    });
    setActivePresetId(preset.id);
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
    const toDelete = completedEntries.filter((e) => selectedIds.has(e.id));
    stageDelete(toDelete);
    setSelectedIds(new Set());
    setBulkMode(false);
  }, [selectedIds, completedEntries, stageDelete]);

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
                onClick={() => setGroupBy((v) => (v === "day" ? "project" : "day"))}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors font-medium ${
                  groupBy === "project"
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border-zinc-700"
                }`}
                title={groupBy === "project" ? "Group by date" : "Group by project"}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
                  <circle cx="7" cy="7" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="7" cy="12" r="1.5" fill="currentColor" stroke="none" />
                  <circle cx="7" cy="17" r="1.5" fill="currentColor" stroke="none" />
                </svg>
                By Project
              </button>
              <button
                onClick={() => setTimelineMode((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors font-medium ${
                  timelineMode
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border-zinc-700"
                }`}
                title={timelineMode ? "Switch to list view" : "Switch to timeline view"}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Timeline
              </button>
              <button
                onClick={() => setShowGaps((v) => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm border rounded-lg transition-colors font-medium ${
                  showGaps
                    ? "bg-orange-500/20 border-orange-500/50 text-orange-300"
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border-zinc-700"
                }`}
                title={showGaps ? "Hide untracked gaps" : "Show untracked gaps between entries"}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Gaps
              </button>
              <button
                onClick={() => setShowStandup(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg transition-colors font-medium"
                title="Generate stand-up summary (S)"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Stand-up
              </button>
              <button
                onClick={() => setBulkMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg transition-colors font-medium"
                title="Select multiple entries for bulk actions"
              >
                ☑ Select
              </button>
              {filteredEntries.length > 0 && (
                <button
                  onClick={handleExportFiltered}
                  title="Export filtered entries as CSV"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg transition-colors font-medium"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
              )}
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

      {/* Overlap warning banner */}
      {overlapCount > 0 && !bulkMode && (
        <div className="flex items-start gap-2.5 mb-4 px-3.5 py-2.5 rounded-xl bg-amber-500/8 border border-amber-500/25">
          <span className="text-amber-400 mt-0.5 flex-shrink-0">⚠</span>
          <p className="text-sm text-amber-300/90">
            <span className="font-medium">{overlapCount} {overlapCount === 1 ? "entry" : "entries"} with overlapping time ranges</span>
            {" "}— entries with an <span className="font-mono text-amber-400 text-xs">⚠ overlap</span> badge are flagged below.
            Open the entry editor to review and fix the conflicting times.
          </p>
        </div>
      )}

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

      {/* Filter presets bar (hidden in bulk mode) */}
      {!bulkMode && (
        <FilterPresetsBar
          presets={presets}
          activePresetId={activePresetId}
          currentFilters={{
            clientId: filterClientId,
            projectId: filterProjectId,
            taskName: filterTaskName,
            tag: filterTag,
            notes: filterNotes,
            dateRange,
          }}
          hasActiveFilter={!!hasActiveFilter}
          onApply={applyPreset}
          onSave={saveCurrentAsPreset}
          onDelete={deletePreset}
          onClearActivePreset={() => setActivePresetId(null)}
        />
      )}

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
            {(() => {
              const { pinned, unpinned, hasPinned } = sortedProjectGroups(projects);
              return hasPinned ? (
                <>
                  <optgroup label="⭐ Pinned">
                    {pinned.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                  <optgroup label="All Projects">
                    {unpinned.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </optgroup>
                </>
              ) : unpinned.map((p) => <option key={p.id} value={p.id}>{p.name}</option>);
            })()}
          </select>
          <input
            ref={notesSearchRef}
            type="text"
            placeholder="Search notes… (press /)"
            value={filterNotes}
            onChange={(e) => setFilterNotes(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setFilterNotes(""); notesSearchRef.current?.blur(); } }}
            className="flex-1 min-w-[160px] bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          />
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

      {/* Stats bar — shown whenever any filter is active or there are entries to summarize */}
      {!bulkMode && filteredEntries.length > 0 && (
        <LogStatsBar entries={filteredEntries} />
      )}

      <QuickEntryForm
        open={quickEntryOpen}
        projects={projects}
        tasks={tasks}
        allTags={entriesAllTags}
        onSave={(entry) => addEntry(entry)}
        onClose={() => setQuickEntryOpen(false)}
      />

      {/* Hidden DayNote for today — triggered by J shortcut */}
      <div className="hidden">
        <DayNote
          dateKey={todayKey}
          note={getDayNote(todayKey)}
          onSave={saveDayNote}
          forceOpen={todayNoteForceOpen}
          onOpenChange={(open) => { if (!open) setTodayNoteForceOpen(false); }}
        />
      </div>

      {groupBy === "project" && !bulkMode ? (
        <ProjectGroupedList
          searchQuery={filterNotes}
          entries={filteredEntries}
          allEntries={completedEntries}
          projects={projects}
          tasks={tasks}
          allTags={entriesAllTags}
          onUpdate={updateEntry}
          onDelete={(id) => {
            const entry = completedEntries.find((e) => e.id === id);
            if (entry) stageDelete([entry]);
          }}
          onDuplicate={handleDuplicate}
          onResume={handleResume}
          onSplit={handleSplit}
          hasRunning={runningEntry !== null}
          hiddenIds={pendingIds}
          bulkMode={bulkMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectGroup={selectDay}
          onDeselectGroup={deselectDay}
        />
      ) : (
        <EntryList
          searchQuery={filterNotes}
          entries={filteredEntries}
          allEntries={completedEntries}
          projects={projects}
          tasks={tasks}
          allTags={entriesAllTags}
          onUpdate={updateEntry}
          onDelete={(id) => {
            const entry = completedEntries.find((e) => e.id === id);
            if (entry) stageDelete([entry]);
          }}
          onDuplicate={handleDuplicate}
          onResume={handleResume}
          onSplit={handleSplit}
          hasRunning={runningEntry !== null}
          hiddenIds={pendingIds}
          timelineMode={timelineMode && !bulkMode}
          bulkMode={bulkMode}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
          onSelectDay={selectDay}
          onDeselectDay={deselectDay}
          getDayNote={getDayNote}
          onSaveDayNote={saveDayNote}
          showGaps={showGaps}
          onFillGap={(entry) => addEntry(entry)}
        />
      )}
      {undoPending && (
        <UndoToast
          label={undoPending.label}
          onUndo={undoDelete}
          onDismiss={commitDelete}
        />
      )}
      <StandupSummaryModal
        open={showStandup}
        onClose={() => setShowStandup(false)}
        entries={completedEntries}
        projects={projects}
        tasks={tasks}
      />
    </div>
  );
}
