"use client";

import { useState, useMemo } from "react";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { EntryList } from "@/components/log/EntryList";

export default function LogPage() {
  const { completedEntries, runningEntry, updateEntry, deleteEntry, resumeEntry, duplicateEntry } = useEntries();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  const [filterProjectId, setFilterProjectId] = useState<string>("");
  const [filterTaskName, setFilterTaskName] = useState<string>("");
  const [filterTag, setFilterTag] = useState<string>("");

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of completedEntries) {
      for (const t of (e.tags ?? [])) set.add(t);
    }
    return Array.from(set).sort();
  }, [completedEntries]);

  const filteredEntries = useMemo(() => {
    return completedEntries.filter((e) => {
      if (filterProjectId && e.projectId !== filterProjectId) return false;
      if (filterTaskName.trim()) {
        const taskName = e.taskId ? (taskMap.get(e.taskId)?.name ?? "") : "";
        if (!taskName.toLowerCase().includes(filterTaskName.trim().toLowerCase())) return false;
      }
      if (filterTag && !(e.tags ?? []).includes(filterTag)) return false;
      return true;
    });
  }, [completedEntries, filterProjectId, filterTaskName, filterTag, taskMap]);

  const handleDuplicate = (entry: { id: string }) => {
    duplicateEntry(entry.id);
  };

  const handleResume = (entry: { id: string }) => {
    resumeEntry(entry.id);
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-4">Time Log</h1>

      {/* Filter bar */}
      <div className="flex gap-2 mb-6">
        <select
          value={filterProjectId}
          onChange={(e) => setFilterProjectId(e.target.value)}
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
          className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 placeholder-zinc-600 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="">All Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>#{t}</option>
            ))}
          </select>
        )}
        {(filterProjectId || filterTaskName || filterTag) && (
          <button
            onClick={() => { setFilterProjectId(""); setFilterTaskName(""); setFilterTag(""); }}
            className="px-3 py-2 text-xs text-zinc-500 hover:text-orange-400 border border-zinc-800 rounded-lg transition-colors"
          >
            Clear
          </button>
        )}
      </div>

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
