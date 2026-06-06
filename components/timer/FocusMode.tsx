"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { DurationDisplay } from "@/components/ui/DurationDisplay";
import { Badge } from "@/components/ui/Badge";
import { formatDurationShort, elapsedMs } from "@/lib/duration";
import { parseAnnotations } from "@/lib/sessionAnnotations";

interface FocusModeProps {
  /** Whether focus mode is currently active */
  open: boolean;
  onClose: () => void;
  /** Current running entry — null means timer is stopped (focus mode won't be useful but we handle it gracefully) */
  runningEntry: TimeEntry | null;
  project?: Project;
  task?: Task;
  elapsed: number; // ms
  /** Stop the timer */
  onStop: () => void;
  /** Today's completed entry count + total ms — shown as ambient context */
  todayEntryCount: number;
  todayTotalMs: number;
}

/**
 * FocusMode — full-screen overlay, everything stripped away.
 * Just the clock, the project/task/description, and a Stop button.
 * Session annotations (if any) float as a compact scroll at the bottom.
 */
export function FocusMode({
  open,
  onClose,
  runningEntry,
  project,
  task,
  elapsed,
  onStop,
  todayEntryCount,
  todayTotalMs,
}: FocusModeProps) {
  // Visible notes = base description (annotations stripped)
  const notes = runningEntry?.notes ?? "";
  const { baseNotes, annotations } = parseAnnotations(notes);
  const annotationsListRef = useRef<HTMLDivElement>(null);
  const [justStopped, setJustStopped] = useState(false);

  // Auto-scroll annotation list to bottom when new ones arrive
  useEffect(() => {
    if (annotationsListRef.current && annotations.length > 0) {
      annotationsListRef.current.scrollTop = annotationsListRef.current.scrollHeight;
    }
  }, [annotations.length]);

  // Keyboard: Escape or F closes focus mode
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (isInput) return;
      if (e.key === "Escape" || e.key === "f" || e.key === "F") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleStop = useCallback(() => {
    setJustStopped(true);
    onStop();
    // Brief delay so user sees the flash before the overlay closes
    setTimeout(() => {
      setJustStopped(false);
      onClose();
    }, 600);
  }, [onStop, onClose]);

  if (!open) return null;

  const formattedToday = formatDurationShort(todayTotalMs);
  const totalWithCurrent = formatDurationShort(todayTotalMs + elapsed);

  return (
    <div
      className="fixed inset-0 z-[200] bg-zinc-950 flex flex-col items-center justify-center select-none"
      // Do NOT close on backdrop click — accidental exits are annoying in focus mode
    >
      {/* ── Top-right exit affordance ─────────────────────────── */}
      <button
        onClick={onClose}
        className="absolute top-5 right-6 text-zinc-600 hover:text-zinc-400 transition-colors text-sm font-mono flex items-center gap-1.5"
        title="Exit focus mode (F or Esc)"
      >
        <span className="opacity-60">esc</span>
        <span className="text-zinc-700">·</span>
        <span>exit focus</span>
        <svg className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* ── FOCUS MODE pill ───────────────────────────────────── */}
      <div className="absolute top-5 left-6 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono tracking-widest uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Focus
        </span>
      </div>

      {/* ── Main clock ───────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-6 mb-10">
        {/* Giant elapsed time */}
        <div className={`transition-all duration-300 ${justStopped ? "opacity-30 scale-95" : "opacity-100 scale-100"}`}>
          <DurationDisplay
            ms={elapsed}
            className="text-[clamp(4rem,14vw,10rem)] font-mono font-thin text-zinc-100 tabular-nums leading-none tracking-tighter"
          />
        </div>

        {/* Project + task ─ compact row */}
        {(project || task) && (
          <div className="flex items-center gap-2 flex-wrap justify-center">
            {project && (
              <Badge color={project.color} label={project.name} />
            )}
            {task && (
              <span className="text-zinc-400 text-sm">/ {task.name}</span>
            )}
          </div>
        )}

        {/* Description */}
        {baseNotes.trim() && (
          <p className="text-zinc-300 text-xl text-center max-w-lg leading-snug px-4">
            {baseNotes.trim()}
          </p>
        )}
      </div>

      {/* ── Annotations (session notes) ──────────────────────── */}
      {annotations.length > 0 && (
        <div
          ref={annotationsListRef}
          className="w-full max-w-md max-h-32 overflow-y-auto flex flex-col gap-1 mb-8 px-4"
        >
          {annotations.map((a, i) => (
            <div key={i} className="flex items-start gap-2 text-xs font-mono">
              <span className="text-orange-500/70 shrink-0">{a.elapsed}</span>
              <span className="text-zinc-400">{a.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Stop button ──────────────────────────────────────── */}
      <button
        onClick={handleStop}
        disabled={justStopped}
        className={`
          mt-2 px-10 py-4 rounded-2xl font-semibold text-lg tracking-wide transition-all duration-200
          ${justStopped
            ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
            : "bg-orange-500 hover:bg-orange-400 active:scale-95 text-white shadow-lg shadow-orange-900/40"
          }
        `}
      >
        {justStopped ? "Stopped" : "Stop"}
      </button>

      {/* ── Ambient today stats (subtle) ──────────────────────── */}
      <div className="absolute bottom-6 flex items-center gap-4 text-zinc-700 text-xs font-mono">
        <span>today: {todayEntryCount} {todayEntryCount === 1 ? "entry" : "entries"}</span>
        <span>·</span>
        <span>tracked: {formattedToday}</span>
        {elapsed > 0 && (
          <>
            <span>·</span>
            <span className="text-zinc-600">with this: {totalWithCurrent}</span>
          </>
        )}
        <span>·</span>
        <span>space to stop</span>
      </div>
    </div>
  );
}
