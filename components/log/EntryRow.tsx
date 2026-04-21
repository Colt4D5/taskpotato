"use client";

import { useState } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { formatDurationShort, elapsedMs } from "@/lib/duration";
import { formatTime } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EntryEditor } from "./EntryEditor";
import { renderMarkdown, hasMarkdown } from "@/lib/markdown";

interface EntryRowProps {
  entry: TimeEntry;
  project?: Project;
  task?: Task;
  onUpdate: (id: string, patch: Partial<Omit<TimeEntry, "id">>) => void;
  onDelete: (id: string) => void;
  projects: Project[];
  tasks: Task[];
  onResume?: (entry: TimeEntry) => void;
  onDuplicate?: (entry: TimeEntry) => void;
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
  onDuplicate,
  hasRunning,
}: EntryRowProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const duration = elapsedMs(entry.startedAt, entry.stoppedAt);
  const notesHasMd = entry.notes ? hasMarkdown(entry.notes) : false;

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
              <button
                type="button"
                onClick={() => notesHasMd && setExpanded((x) => !x)}
                className={`text-sm text-zinc-100 text-left ${notesHasMd ? "cursor-pointer hover:text-orange-300" : ""} ${expanded ? "" : "truncate max-w-xs"}`}
                title={notesHasMd ? (expanded ? "Collapse preview" : "Expand markdown preview") : undefined}
              >
                {entry.notes}
              </button>
            ) : (
              <span className="text-sm text-zinc-500 italic">No description</span>
            )}
            {notesHasMd && (
              <span className="text-xs text-zinc-600 px-1 py-0.5 rounded bg-zinc-800 border border-zinc-700 font-mono">md</span>
            )}
            {project && <Badge label={project.name} color={project.color} />}
            {task && (
              <span className="text-xs text-zinc-500">{task.name}</span>
            )}
            {entry.tags && entry.tags.length > 0 && entry.tags.map((tag) => (
              <span key={tag} className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">#{tag}</span>
            ))}
            {!entry.billable && (
              <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full border border-zinc-700">non-billable</span>
            )}
          </div>
          <div className="text-xs text-zinc-500 mt-0.5">
            {formatTime(entry.startedAt)}
            {entry.stoppedAt && ` – ${formatTime(entry.stoppedAt)}`}
          </div>
          {expanded && notesHasMd && (
            <div
              className="mt-2 text-sm text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:text-zinc-200 prose-code:text-orange-300 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.notes) }}
            />
          )}
        </div>

        {/* Duration */}
        <span className="text-sm font-mono text-zinc-300 flex-shrink-0">
          {formatDurationShort(duration)}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onDuplicate && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDuplicate(entry)}
              className="text-xs px-2 py-1 text-zinc-400 hover:text-orange-400"
              title="Duplicate to today"
            >
              ⧉ Copy
            </Button>
          )}
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
