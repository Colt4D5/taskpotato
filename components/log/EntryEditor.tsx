"use client";

import { useState, useEffect } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface EntryEditorProps {
  open: boolean;
  entry: TimeEntry;
  projects: Project[];
  tasks: Task[];
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
  onSave,
  onClose,
}: EntryEditorProps) {
  const [notes, setNotes] = useState(entry.notes);
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

  useEffect(() => {
    if (open) {
      setNotes(entry.notes);
      setProjectId(entry.projectId ?? "");
      setTaskId(entry.taskId ?? "");
      setStartDate(toDateInput(entry.startedAt));
      setStartTime(toTimeInput(entry.startedAt));
      setStopDate(entry.stoppedAt ? toDateInput(entry.stoppedAt) : "");
      setStopTime(entry.stoppedAt ? toTimeInput(entry.stoppedAt) : "");
      setError(null);
    }
  }, [open, entry]);

  const availableTasks = tasks.filter(
    (t) => t.projectId === projectId && !t.archived
  );

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
      notes,
      projectId: projectId || null,
      taskId: taskId || null,
      startedAt: newStartedAt,
      stoppedAt: newStoppedAt,
    });
  };

  const inputClass =
    "bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full";

  return (
    <Modal open={open} onClose={onClose} title="Edit Entry">
      <div className="flex flex-col gap-4">
        <Input
          label="Description"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What were you working on?"
        />

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
            {projects.filter((p) => !p.archived).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
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
