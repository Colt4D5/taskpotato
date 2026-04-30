"use client";

import { useState, useEffect } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatTime } from "@/lib/dateUtils";
import { formatDurationShort, elapsedMs } from "@/lib/duration";

interface EntrySplitModalProps {
  open: boolean;
  entry: TimeEntry;
  projects: Project[];
  tasks: Task[];
  onSplit: (splitAtMs: number, secondProjectId: string | null, secondTaskId: string | null) => void;
  onClose: () => void;
}

function toTimeValue(ms: number): string {
  const d = new Date(ms);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function fromTimeValue(base: number, timeStr: string): number {
  const [hh, mm, ss = "0"] = timeStr.split(":");
  const d = new Date(base);
  d.setHours(Number(hh), Number(mm), Number(ss), 0);
  return d.getTime();
}

export function EntrySplitModal({
  open,
  entry,
  projects,
  tasks,
  onSplit,
  onClose,
}: EntrySplitModalProps) {
  const totalMs = elapsedMs(entry.startedAt, entry.stoppedAt);
  const midMs = entry.startedAt + Math.floor(totalMs / 2);

  const [splitTimeStr, setSplitTimeStr] = useState(toTimeValue(midMs));
  const [secondProjectId, setSecondProjectId] = useState<string>(entry.projectId ?? "");
  const [secondTaskId, setSecondTaskId] = useState<string>(entry.taskId ?? "");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (open) {
      const freshMid = entry.startedAt + Math.floor(elapsedMs(entry.startedAt, entry.stoppedAt) / 2);
      setSplitTimeStr(toTimeValue(freshMid));
      setSecondProjectId(entry.projectId ?? "");
      setSecondTaskId(entry.taskId ?? "");
      setError("");
    }
  }, [open, entry]);

  const currentProject = projects.find((p) => p.id === entry.projectId);
  const availableTasks = tasks.filter(
    (t) => t.projectId === secondProjectId && !t.archived
  );

  function handleSplit() {
    const splitMs = fromTimeValue(entry.startedAt, splitTimeStr);

    if (!entry.stoppedAt) {
      setError("Entry has no stop time.");
      return;
    }
    if (splitMs <= entry.startedAt) {
      setError("Split time must be after the entry's start time.");
      return;
    }
    if (splitMs >= entry.stoppedAt) {
      setError("Split time must be before the entry's stop time.");
      return;
    }

    const durationA = elapsedMs(entry.startedAt, splitMs);
    const durationB = elapsedMs(splitMs, entry.stoppedAt);
    if (durationA < 1000 || durationB < 1000) {
      setError("Each split segment must be at least 1 second.");
      return;
    }

    onSplit(
      splitMs,
      secondProjectId || null,
      secondTaskId || null
    );
  }

  function handleProjectChange(pid: string) {
    setSecondProjectId(pid);
    setSecondTaskId("");
  }

  const splitMs = fromTimeValue(entry.startedAt, splitTimeStr);
  const segAMs = entry.stoppedAt && splitMs > entry.startedAt && splitMs < entry.stoppedAt
    ? elapsedMs(entry.startedAt, splitMs)
    : null;
  const segBMs = entry.stoppedAt && segAMs !== null
    ? elapsedMs(splitMs, entry.stoppedAt)
    : null;

  return (
    <Modal open={open} onClose={onClose} title="Split Entry">
      <div className="space-y-5">
        {/* Original entry summary */}
        <div className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3">
          <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Original entry</p>
          <div className="flex items-center gap-2 flex-wrap">
            {entry.notes ? (
              <span className="text-sm text-zinc-200 truncate max-w-xs">{entry.notes}</span>
            ) : (
              <span className="text-sm text-zinc-500 italic">No description</span>
            )}
            {currentProject && <Badge label={currentProject.name} color={currentProject.color} />}
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-mono">
            {formatTime(entry.startedAt)} – {entry.stoppedAt ? formatTime(entry.stoppedAt) : "running"}&nbsp;·&nbsp;{formatDurationShort(totalMs)}
          </p>
        </div>

        {/* Split time */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
            Split at time <span className="text-zinc-600">(same day as entry)</span>
          </label>
          <input
            type="time"
            step="1"
            value={splitTimeStr}
            onChange={(e) => { setSplitTimeStr(e.target.value); setError(""); }}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/50 w-full"
          />
          {/* Preview segments */}
          {segAMs !== null && segBMs !== null && (
            <div className="mt-2 flex gap-2">
              <div className="flex-1 bg-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-400">
                <span className="text-zinc-300 font-mono">{formatDurationShort(segAMs)}</span>
                <span className="ml-1 text-zinc-600">first segment</span>
              </div>
              <div className="flex-1 bg-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-400">
                <span className="text-zinc-300 font-mono">{formatDurationShort(segBMs)}</span>
                <span className="ml-1 text-zinc-600">second segment</span>
              </div>
            </div>
          )}
        </div>

        {/* Second entry project */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
            Second segment — project
            <span className="ml-1 text-zinc-600">(inherits first segment's project by default)</span>
          </label>
          <select
            value={secondProjectId}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="">No project</option>
            {projects.filter((p) => !p.archived).map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Second entry task */}
        {availableTasks.length > 0 && (
          <div>
            <label className="block text-xs text-zinc-400 mb-1.5 font-medium">
              Second segment — task
            </label>
            <select
              value={secondTaskId}
              onChange={(e) => setSecondTaskId(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">No task</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSplit}>Split</Button>
        </div>
      </div>
    </Modal>
  );
}
