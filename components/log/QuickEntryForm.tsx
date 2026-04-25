"use client";

import { useState, useEffect } from "react";
import { Project, Task, TimeEntry } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";

interface QuickEntryFormProps {
  open: boolean;
  projects: Project[];
  tasks: Task[];
  onSave: (entry: Omit<TimeEntry, "id">) => void;
  onClose: () => void;
}

function localDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localTimeStr(d: Date) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(dateStr: string, timeStr: string): number | null {
  if (!dateStr || !timeStr) return null;
  const ms = new Date(`${dateStr}T${timeStr}:00`).getTime();
  return isNaN(ms) ? null : ms;
}

function parseDuration(val: string): number | null {
  // Accepts: "1h 30m", "1:30", "90" (minutes), "1h", "30m"
  val = val.trim().toLowerCase();
  if (!val) return null;

  // HH:MM format
  const colonMatch = val.match(/^(\d+):(\d{1,2})$/);
  if (colonMatch) {
    const h = parseInt(colonMatch[1], 10);
    const m = parseInt(colonMatch[2], 10);
    return (h * 60 + m) * 60 * 1000;
  }

  // "Xh Ym" or "Xh" or "Ym"
  const hm = val.match(/^(?:(\d+(?:\.\d+)?)h)?\s*(?:(\d+(?:\.\d+)?)m)?$/);
  if (hm && (hm[1] || hm[2])) {
    const h = parseFloat(hm[1] ?? "0");
    const m = parseFloat(hm[2] ?? "0");
    return Math.round((h * 60 + m) * 60 * 1000);
  }

  // Plain number = minutes
  const plain = parseFloat(val);
  if (!isNaN(plain) && plain > 0) {
    return Math.round(plain * 60 * 1000);
  }

  return null;
}

export function QuickEntryForm({ open, projects, tasks, onSave, onClose }: QuickEntryFormProps) {
  const now = new Date();
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const [mode, setMode] = useState<"range" | "duration">("range");
  const [date, setDate] = useState(localDateStr(now));
  const [startTime, setStartTime] = useState(localTimeStr(oneHourAgo));
  const [endTime, setEndTime] = useState(localTimeStr(now));
  const [duration, setDuration] = useState("1h");
  const [notes, setNotes] = useState("");
  const [projectId, setProjectId] = useState("");
  const [taskId, setTaskId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [billable, setBillable] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reset form whenever modal opens
  useEffect(() => {
    if (open) {
      const n = new Date();
      const h = new Date(Date.now() - 60 * 60 * 1000);
      setDate(localDateStr(n));
      setStartTime(localTimeStr(h));
      setEndTime(localTimeStr(n));
      setDuration("1h");
      setNotes("");
      setProjectId("");
      setTaskId("");
      setTags([]);
      setBillable(true);
      setError(null);
      setMode("range");
    }
  }, [open]);

  const availableTasks = tasks.filter((t) => t.projectId === projectId && !t.archived);

  const handleSave = () => {
    setError(null);

    let startedAt: number;
    let stoppedAt: number;

    if (mode === "range") {
      const s = combineDateTime(date, startTime);
      const e = combineDateTime(date, endTime);
      if (s === null) { setError("Valid start date and time required."); return; }
      if (e === null) { setError("Valid end time required."); return; }
      // Allow end time crossing midnight: if end <= start, assume next day
      startedAt = s;
      stoppedAt = e <= s ? e + 24 * 60 * 60 * 1000 : e;
    } else {
      const s = combineDateTime(date, startTime);
      if (s === null) { setError("Valid start date and time required."); return; }
      const durMs = parseDuration(duration);
      if (durMs === null || durMs <= 0) {
        setError('Invalid duration. Try "1h 30m", "1:30", or "90" (minutes).');
        return;
      }
      startedAt = s;
      stoppedAt = s + durMs;
    }

    onSave({
      projectId: projectId || null,
      taskId: taskId || null,
      startedAt,
      stoppedAt,
      notes,
      tags,
      billable,
    });
    onClose();
  };

  const inputClass =
    "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full";

  return (
    <Modal open={open} onClose={onClose} title="Log Time">
      <div className="flex flex-col gap-4">

        {/* Mode toggle */}
        <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-sm">
          <button
            type="button"
            onClick={() => setMode("range")}
            className={`flex-1 py-1.5 transition-colors ${mode === "range" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Start → End
          </button>
          <button
            type="button"
            onClick={() => setMode("duration")}
            className={`flex-1 py-1.5 transition-colors ${mode === "duration" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
          >
            Start + Duration
          </button>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClass}
          />
        </div>

        {mode === "range" ? (
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
        ) : (
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
              <label className="text-sm font-medium text-zinc-400">Duration</label>
              <input
                type="text"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder='e.g. 1h 30m or 1:30'
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Description</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What were you working on?"
            rows={2}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full resize-none"
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Tags</label>
          <TagInput tags={tags} onChange={setTags} placeholder="Add tags (Enter or comma)…" />
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
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${billable ? "translate-x-6" : "translate-x-1"}`}
            />
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
            {projects.filter((p) => !p.archived).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
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
