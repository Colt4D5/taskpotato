"use client";

import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { EntryList } from "@/components/log/EntryList";

export default function LogPage() {
  const { completedEntries, updateEntry, deleteEntry, startEntry, runningEntry } = useEntries();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-6">Time Log</h1>
      <EntryList
        entries={completedEntries}
        projects={projects}
        tasks={tasks}
        onUpdate={updateEntry}
        onDelete={deleteEntry}
        onResume={(entry) => startEntry(entry.projectId, entry.taskId, entry.notes)}
        hasRunning={runningEntry !== null}
      />
    </div>
  );
}
