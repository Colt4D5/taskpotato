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

function toTimeInput(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function applyTimeInput(original: number, timeStr: string): number {
  const [hh, mm] = timeStr.split(":").map(Number);
  const d = new Date(original);
  d.setHours(hh, mm, 0, 0);
  return d.getTime();
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
  const [startTime, setStartTime] = useState(toTimeInput(entry.startedAt));
  const [stopTime, setStopTime] = useState(
    entry.stoppedAt ? toTimeInput(entry.stoppedAt) : ""
  );

  useEffect(() => {
    if (open) {
      setNotes(entry.notes);
      setProjectId(entry.projectId ?? "");
      setTaskId(entry.taskId ?? "");
      setStartTime(toTimeInput(entry.startedAt));
      setStopTime(entry.stoppedAt ? toTimeInput(entry.stoppedAt) : "");
    }
  }, [open, entry]);

  const availableTasks = tasks.filter(
    (t) => t.projectId === projectId && !t.archived
  );

  const handleSave = () => {
    const newStartedAt = applyTimeInput(entry.startedAt, startTime);
    const newStoppedAt =
      stopTime && entry.stoppedAt
        ? applyTimeInput(entry.stoppedAt, stopTime)
        : entry.stoppedAt;

    onSave({
      notes,
      projectId: projectId || null,
      taskId: taskId || null,
      startedAt: newStartedAt,
      stoppedAt: newStoppedAt,
    });
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Entry">
      <div className="flex flex-col gap-4">
        <Input
          label="Description"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What were you working on?"
        />

        <div className="flex gap-3">
          <div className="flex-1 flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          {entry.stoppedAt && (
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-400">Stop</label>
              <input
                type="time"
                value={stopTime}
                onChange={(e) => setStopTime(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Project</label>
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setTaskId("");
            }}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
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
