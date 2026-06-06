"use client";

import { useState, useEffect, useMemo } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { TagInput } from "@/components/ui/TagInput";
import { renderMarkdown } from "@/lib/markdown";
import { sortedProjectGroups } from "@/lib/projectSort";

import {
  SessionAnnotation,
  parseAnnotations as parseAnnotationBlock,
  buildAnnotatedNotes as buildNotesWithAnnotations,
  formatAnnotationElapsed,
} from "@/lib/sessionAnnotations";
import { findProposedOverlaps } from "@/lib/overlapDetection";
import { formatTime } from "@/lib/dateUtils";

interface EntryEditorProps {
  open: boolean;
  entry: TimeEntry;
  projects: Project[];
  tasks: Task[];
  allTags?: string[];
  allEntries?: TimeEntry[];  // full entry set for overlap detection
  onSave: (patch: Partial<Omit<TimeEntry, "id">>) => void;
  onClose: () => void;
}

function toDateInput(ms: number): string {
  const d = new Date(ms);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function toTimeInput(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function combineDateTime(dateStr: string, timeStr: string): number | null {
  if (!dateStr || !timeStr) return null;
  // Combine as local time — "YYYY-MM-DDTHH:MM:SS" parsed as local
  const iso = `${dateStr}T${timeStr}`;
  const ms = new Date(iso).getTime();
  return isNaN(ms) ? null : ms;
}

export function EntryEditor({
  open,
  entry,
  projects,
  tasks,
  allTags,
  allEntries,
  onSave,
  onClose,
}: EntryEditorProps) {
  // Split notes into base + annotations on open; merge back on save
  const { baseNotes: initialBase, annotations: initialAnnotations } = parseAnnotationBlock(entry.notes);
  const [notes, setNotes] = useState(initialBase);
  const [annotations, setAnnotations] = useState<SessionAnnotation[]>(initialAnnotations);
  const [projectId, setProjectId] = useState<string>(entry.projectId ?? "");
  const [taskId, setTaskId] = useState<string>(entry.taskId ?? "");
  const [startDate, setStartDate] = useState(toDateInput(entry.startedAt));
  const [startTime, setStartTime] = useState(toTimeInput(entry.startedAt));
  const [stopDate, setStopDate] = useState(
    entry.stoppedAt ? toDateInput(entry.stoppedAt) : ""
  );
  const [stopTime, setStopTime] = useState(
    entry.stoppedAt ? toTimeInput(entry.stoppedAt) : ""
  );
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(entry.tags ?? []);
  const [billable, setBillable] = useState(entry.billable ?? true);
  const [notesPreview, setNotesPreview] = useState(false);

  useEffect(() => {
    if (open) {
      const { baseNotes: b, annotations: a } = parseAnnotationBlock(entry.notes);
      setNotes(b);
      setAnnotations(a);
      setProjectId(entry.projectId ?? "");
      setTaskId(entry.taskId ?? "");
      setStartDate(toDateInput(entry.startedAt));
      setStartTime(toTimeInput(entry.startedAt));
      setStopDate(entry.stoppedAt ? toDateInput(entry.stoppedAt) : "");
      setStopTime(entry.stoppedAt ? toTimeInput(entry.stoppedAt) : "");
      setTags(entry.tags ?? []);
      setBillable(entry.billable ?? true);
      setNotesPreview(false);
      setError(null);
    }
  }, [open, entry]);

  const availableTasks = tasks.filter(
    (t) => t.projectId === projectId && !t.archived
  );

  // Reactive overlap check — updates as user edits times
  const overlapWarning = useMemo(() => {
    if (!allEntries || !entry.stoppedAt) return [];
    const start = combineDateTime(startDate, startTime);
    const stop = combineDateTime(stopDate, stopTime);
    if (!start || !stop || stop <= start) return [];
    return findProposedOverlaps(start, stop, entry.id, allEntries);
  }, [allEntries, startDate, startTime, stopDate, stopTime, entry.id, entry.stoppedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = () => {
    setError(null);

    const newStartedAt = combineDateTime(startDate, startTime);
    if (newStartedAt === null) {
      setError("Start date and time are required.");
      return;
    }

    let newStoppedAt: number | null = entry.stoppedAt;
    if (entry.stoppedAt !== null) {
      if (!stopDate || !stopTime) {
        setError("Stop date and time are required.");
        return;
      }
      newStoppedAt = combineDateTime(stopDate, stopTime);
      if (newStoppedAt === null) {
        setError("Invalid stop date or time.");
        return;
      }
      if (newStoppedAt <= newStartedAt) {
        setError("Stop time must be after start time.");
        return;
      }
    }

    onSave({
      notes: buildNotesWithAnnotations(notes, annotations),
      projectId: projectId || null,
      taskId: taskId || null,
      startedAt: newStartedAt,
      stoppedAt: newStoppedAt,
      tags,
      billable,
    });
  };

  const inputClass =
    "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full";

  return (
    <Modal open={open} onClose={onClose} title="Edit Entry">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-zinc-400">Description</label>
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setNotesPreview(false)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  !notesPreview ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setNotesPreview(true)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  notesPreview ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                Preview
              </button>
            </div>
          </div>
          {notesPreview ? (
            <div
              className="min-h-[80px] bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0 prose-headings:text-zinc-200 prose-code:text-orange-300 prose-code:bg-zinc-900 prose-code:px-1 prose-code:rounded"
              dangerouslySetInnerHTML={{
                __html: notes ? renderMarkdown(notes) : '<span class="text-zinc-600 italic">Nothing to preview</span>',
              }}
            />
          ) : (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What were you working on? Markdown supported."
              rows={3}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full resize-none"
            />
          )}        
        </div>

        {/* Session annotations — rendered when present */}
        {annotations.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-400">Session Notes</label>
              <span className="text-xs text-zinc-600">{annotations.length} timestamped note{annotations.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 max-h-40 overflow-y-auto">
              {annotations.map((a, idx) => {
                const label = formatAnnotationElapsed(a.timestampMs);
                return (
                  <div key={idx} className="group flex items-start gap-2 text-xs py-0.5">
                    <span className="font-mono text-orange-400/80 flex-shrink-0 pt-0.5">{label}</span>
                    <span className="text-zinc-300 flex-1">{a.text}</span>
                    <button
                      type="button"
                      onClick={() => setAnnotations((prev) => prev.filter((_, i) => i !== idx))}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0"
                      title="Remove this note"
                      aria-label="Delete annotation"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Tags</label>
          <TagInput tags={tags} onChange={setTags} placeholder="Add tags (Enter or comma)…" allTags={allTags} />
        </div>

        {/* Billable toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-400">Billable</label>
          <button
            type="button"
            onClick={() => setBillable((b) => !b)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              billable ? "bg-orange-500" : "bg-zinc-700"
            }`}
            aria-label="Toggle billable"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                billable ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Start date/time */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Start</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputClass}
            />
            <input
              type="time"
              step="1"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Stop date/time — only for completed entries */}
        {entry.stoppedAt !== null && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">Stop</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={stopDate}
                onChange={(e) => setStopDate(e.target.value)}
                className={inputClass}
              />
              <input
                type="time"
                step="1"
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Overlap advisory — non-blocking, shown when current times clash with other entries */}
        {overlapWarning.length > 0 && (
          <div className="flex flex-col gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-3 py-2.5 -mt-1">
            <div className="flex items-center gap-2">
              <span className="text-amber-400 text-sm font-medium">⚠ Overlap detected</span>
              <span className="text-xs text-amber-300/70">Save will still work — resolve manually if needed</span>
            </div>
            <ul className="flex flex-col gap-0.5 mt-0.5">
              {overlapWarning.map((e) => {
                const proj = projects.find((p) => p.id === e.projectId);
                return (
                  <li key={e.id} className="text-xs text-amber-200/80">
                    <span className="font-mono text-amber-300">
                      {formatTime(e.startedAt)}–{e.stoppedAt ? formatTime(e.stoppedAt) : "…"}
                    </span>
                    {proj && (
                      <span
                        className="ml-1.5 px-1 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: proj.color + "33", color: proj.color }}
                      >
                        {proj.name}
                      </span>
                    )}
                    {e.notes && (
                      <span className="ml-1.5 text-amber-200/60 truncate"> — {e.notes.slice(0, 40)}{e.notes.length > 40 ? "…" : ""}</span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Inline validation error */}
        {error && (
          <p className="text-sm text-red-400 -mt-2">{error}</p>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Project</label>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setTaskId("");
            }}
            className={inputClass}
          >
            <option value="">No project</option>
            {(() => {
              const { pinned, unpinned, hasPinned } = sortedProjectGroups(projects.filter((p) => !p.archived));
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
        </div>

        {availableTasks.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">Task</label>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className={inputClass}
            >
              <option value="">No task</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
