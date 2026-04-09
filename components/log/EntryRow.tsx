"use client";

import { useState } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { formatDurationShort, elapsedMs } from "@/lib/duration";
import { formatTime } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EntryEditor } from "./EntryEditor";

interface EntryRowProps {
  entry: TimeEntry;
  project?: Project;
  task?: Task;
  onUpdate: (id: string, patch: Partial<Omit<TimeEntry, "id">>) => void;
  onDelete: (id: string) => void;
  projects: Project[];
  tasks: Task[];
  onResume?: (entry: TimeEntry) => void;
  hasRunning?: boolean;
}

export function EntryRow({
  entry,
  project,
  task,
  onUpdate,
  onDelete,
  projects,
  tasks,
  onResume,
  hasRunning,
}: EntryRowProps) {
  const [editing, setEditing] = useState(false);
  const duration = elapsedMs(entry.startedAt, entry.stoppedAt);

  return (
    <>
      <div className="group flex items-center gap-3 py-3 px-4 hover:bg-zinc-800/50 rounded-lg transition-colors">
        {/* Color dot */}
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: project?.color ?? "#52525b" }}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {entry.notes ? (
              <span className="text-sm text-zinc-100 truncate">{entry.notes}</span>
            ) : (
              <span className="text-sm text-zinc-500 italic">No description</span>
            )}
            {project && <Badge label={project.name} color={project.color} />}
            {task && (
              <span className="text-xs text-zinc-500">{task.name}</span>
            )}
            {entry.tags && entry.tags.length > 0 && entry.tags.map((tag) => (
              <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">#{tag}</span>
            ))}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {formatTime(entry.startedAt)}
            {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
          </div>
        </div>

        {/* Duration */}
        <span className="text-sm font-mono text-zinc-300 flex-shrink-0">
          {formatDurationShort(duration)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!hasRunning && onResume && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onResume(entry)}
              className="text-xs px-2 py-1 text-zinc-400 hover:text-orange-400"
            >
              ▶ Resume
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
            className="text-xs px-2 py-1"
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(entry.id)}
            className="text-xs px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
          >
            Delete
          </Button>
        </div>
      </div>

      <EntryEditor
        open={editing}
        entry={entry}
        projects={projects}
        tasks={tasks}
        onSave={(patch) => {
          onUpdate(entry.id, patch);
          setEditing(false);
        }}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
