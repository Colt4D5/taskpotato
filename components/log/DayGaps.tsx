"use client";

import { useState } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { findDayGaps, TimeGap } from "@/lib/gapDetection";
import { formatTime } from "@/lib/dateUtils";
import { formatDurationShort } from "@/lib/duration";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { sortedProjectGroups } from "@/lib/projectSort";

interface DayGapsProps {
  /** Completed entries for this day (may be unsorted) */
  dayEntries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  allTags?: string[];
  hasRunning?: boolean;
  onFill: (entry: Omit<TimeEntry, "id">) => void;
}

// ---------------------------------------------------------------------------
// Small fill modal — pre-seeded with the gap's exact time range
// ---------------------------------------------------------------------------

interface FillModalProps {
  gap: TimeGap;
  projects: Project[];
  tasks: Task[];
  allTags?: string[];
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onClose: () => void;
}

function localTimeStr(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(base: number, timeStr: string): number | null {
  const d = new Date(base);
  const [h, m] = timeStr.split(":").map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  d.setHours(h, m, 0, 0);
  return d.getTime();
}

function FillGapModal({ gap, projects, tasks, allTags, onSave, onClose }: FillModalProps) {
  const [startTime, setStartTime] = useState(localTimeStr(gap.gapStart));
  const [endTime, setEndTime] = useState(localTimeStr(gap.gapEnd));
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [billable, setBillable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const availableTasks = tasks.filter((t) => t.projectId === projectId && !t.archived);

  const handleSave = () => {
    setError(null);
    const s = combineDateTime(gap.gapStart, startTime);
    const e = combineDateTime(gap.gapEnd, endTime);
    if (s === null) { setError("Valid start time required."); return; }
    if (e === null) { setError("Valid end time required."); return; }
    const stoppedAt = e <= s ? e + 24 * 60 * 60 * 1000 : e;
    if (stoppedAt <= s) { setError("End time must be after start time."); return; }
    onSave({
      projectId: projectId || null,
      taskId: taskId || null,
      startedAt: s,
      stoppedAt,
      notes,
      tags,
      billable,
    });
    onClose();
  };

  const inputClass =
    "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full";

  const gapLabel = `${formatTime(gap.gapStart)} – ${formatTime(gap.gapEnd)}`;

  return (
    <Modal
      open
      onClose={onClose}
      title="Fill Gap"
    >
      <div className="flex flex-col gap-4">
        {/* Gap summary pill */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
          <span className="text-zinc-400 text-xs">Untracked gap</span>
          <span className="text-zinc-200 text-sm font-mono">{gapLabel}</span>
          <span className="ml-auto text-xs text-orange-400 font-mono">{formatDurationShort(gap.gapMs)}</span>
        </div>

        {/* Time range — start & end editable */}
        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">Start time</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">End time</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Description</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What were you working on?"
            rows={2}
            autoFocus
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full resize-none"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Tags</label>
          <TagInput tags={tags} onChange={setTags} placeholder="Add tags…" allTags={allTags} />
        </div>

        {/* Billable */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-zinc-400">Billable</label>
          <button
            type="button"
            onClick={() => setBillable((b) => !b)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${billable ? "bg-orange-500" : "bg-zinc-700"}`}
            aria-label="Toggle billable"
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${billable ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {/* Project */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Project</label>
          <select
            value={projectId}
            onChange={(e) => { setProjectId(e.target.value); setTaskId(""); }}
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
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-400 -mt-2">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Entry</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main export — inline gap rows rendered between entries
// ---------------------------------------------------------------------------

export function DayGaps({
  dayEntries,
  projects,
  tasks,
  allTags,
  onFill,
}: DayGapsProps) {
  const [activeGap, setActiveGap] = useState<TimeGap | null>(null);

  const gaps = findDayGaps(dayEntries);

  if (gaps.length === 0) return null;

  return (
    <>
      {/* Compact banner listing all gaps for the day */}
      <div className="mt-1 mb-1 flex flex-col gap-1">
        {gaps.map((gap) => {
          const label = `${formatTime(gap.gapStart)} – ${formatTime(gap.gapEnd)}`;
          return (
            <div
              key={`${gap.beforeEntryId}-${gap.afterEntryId}`}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/40 border border-dashed border-zinc-700/60 hover:border-zinc-600 transition-colors group"
            >
              {/* Gap icon */}
              <svg
                className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0 group-hover:text-zinc-500 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                <circle cx="12" cy="12" r="9" strokeLinecap="round" />
              </svg>

              {/* Gap time range */}
              <span className="text-xs text-zinc-500 font-mono">{label}</span>

              {/* Duration pill */}
              <span className="text-xs text-zinc-600 font-mono ml-0.5">
                {formatDurationShort(gap.gapMs)}
              </span>

              {/* Untracked label */}
              <span className="text-xs text-zinc-600 italic">untracked</span>

              {/* Fill button */}
              <button
                onClick={() => setActiveGap(gap)}
                className="ml-auto flex items-center gap-1 px-2 py-0.5 text-xs text-zinc-500 hover:text-orange-400 hover:bg-orange-500/10 border border-zinc-700 hover:border-orange-500/30 rounded transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                title={`Fill this ${formatDurationShort(gap.gapMs)} gap`}
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Fill gap
              </button>
            </div>
          );
        })}
      </div>

      {/* Fill modal */}
      {activeGap && (
        <FillGapModal
          gap={activeGap}
          projects={projects}
          tasks={tasks}
          allTags={allTags}
          onSave={onFill}
          onClose={() => setActiveGap(null)}
        />
      )}
    </>
  );
}
