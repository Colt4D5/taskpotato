"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { formatTime } from "@/lib/dateUtils";

interface SessionAnnotation {
  timestampMs: number;
  text: string;
}

interface SessionNotesPanelProps {
  /** Current notes on the running entry */
  currentNotes: string;
  /** Called with the full updated notes string (debounced) */
  onNotesChange: (notes: string) => void;
  /** Whether a timer is currently running */
  isRunning: boolean;
  /** Entry start time (ms) — used to compute annotation elapsed label */
  startedAt: number | null;
}

/**
 * Parse the structured session annotations block out of entry notes.
 * Annotations live at the end of the notes in a fenced block:
 *
 *   <!-- session-annotations
 *   [HH:MM:SS] some text
 *   [HH:MM:SS] more text
 *   -->
 *
 * Returns { baseNotes, annotations }.
 */
function parseAnnotationBlock(raw: string): {
  baseNotes: string;
  annotations: SessionAnnotation[];
} {
  const OPEN = "<!-- session-annotations";
  const CLOSE = "-->";
  const startIdx = raw.indexOf(OPEN);
  if (startIdx === -1) return { baseNotes: raw, annotations: [] };

  const closeIdx = raw.indexOf(CLOSE, startIdx + OPEN.length);
  if (closeIdx === -1) return { baseNotes: raw, annotations: [] };

  const baseNotes = raw.slice(0, startIdx).trimEnd();
  const block = raw.slice(startIdx + OPEN.length, closeIdx);
  const annotations: SessionAnnotation[] = [];

  for (const line of block.split("\n")) {
    const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\|(\d+)\]\s?(.*)$/);
    if (match) {
      annotations.push({
        timestampMs: parseInt(match[2], 10),
        text: match[3],
      });
    }
  }

  return { baseNotes, annotations };
}

function buildNotesWithAnnotations(
  baseNotes: string,
  annotations: SessionAnnotation[]
): string {
  if (annotations.length === 0) return baseNotes;

  const lines = annotations
    .map((a) => {
      const elapsed = formatElapsed(a.timestampMs);
      return `[${elapsed}|${a.timestampMs}] ${a.text}`;
    })
    .join("\n");

  const base = baseNotes.trimEnd();
  return `${base}${base ? "\n\n" : ""}<!-- session-annotations\n${lines}\n-->`;
}

/** Format a duration (ms since session start) as HH:MM:SS */
function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function SessionNotesPanel({
  currentNotes,
  onNotesChange,
  isRunning,
  startedAt,
}: SessionNotesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newAnnotation, setNewAnnotation] = useState("");
  const [baseNotesDraft, setBaseNotesDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushRef = useRef<(() => void) | null>(null);

  const { baseNotes, annotations } = parseAnnotationBlock(currentNotes);

  // Sync base notes draft when notes change externally (e.g. on open)
  useEffect(() => {
    if (isOpen) {
      setBaseNotesDraft(baseNotes);
    }
  }, [isOpen, baseNotes]);

  // Flush pending debounce when panel closes or component unmounts
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (flushRef.current) flushRef.current();
    };
  }, []);

  const scheduleUpdate = useCallback(
    (nextBase: string, nextAnnotations: SessionAnnotation[]) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const doUpdate = () => {
        onNotesChange(buildNotesWithAnnotations(nextBase, nextAnnotations));
        flushRef.current = null;
      };
      flushRef.current = doUpdate;
      debounceRef.current = setTimeout(doUpdate, 600);
    },
    [onNotesChange]
  );

  const handleBaseNotesChange = (value: string) => {
    setBaseNotesDraft(value);
    scheduleUpdate(value, annotations);
  };

  const handleAddAnnotation = () => {
    const trimmed = newAnnotation.trim();
    if (!trimmed || !startedAt) return;

    const nowMs = Date.now();
    const elapsedFromStart = nowMs - startedAt;
    const annotation: SessionAnnotation = {
      timestampMs: elapsedFromStart,
      text: trimmed,
    };
    const next = [...annotations, annotation];
    onNotesChange(buildNotesWithAnnotations(baseNotes, next));
    setNewAnnotation("");
    inputRef.current?.focus();
  };

  const handleDeleteAnnotation = (idx: number) => {
    const next = annotations.filter((_, i) => i !== idx);
    // Immediate save — deletion doesn't need debounce
    onNotesChange(buildNotesWithAnnotations(baseNotes, next));
  };

  const handleAnnotationKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddAnnotation();
    }
  };

  // Only render if timer is running
  if (!isRunning) return null;

  return (
    <div className="w-full">
      {/* Toggle button */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-colors ${
          isOpen
            ? "border-orange-500/40 bg-orange-950/20 text-orange-300"
            : annotations.length > 0
            ? "border-amber-700/40 bg-amber-950/10 text-amber-400 hover:border-amber-600/50"
            : "border-zinc-800 bg-zinc-900/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
        }`}
        aria-expanded={isOpen}
        title="Open session notepad"
      >
        <span className="flex items-center gap-2">
          <span>📝</span>
          <span>Session Notes</span>
          {annotations.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-amber-900/40 text-amber-300 font-mono">
              {annotations.length}
            </span>
          )}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded panel */}
      {isOpen && (
        <div className="mt-1 border border-zinc-800 rounded-lg bg-zinc-900/80 overflow-hidden">
          {/* Base notes editor */}
          <div className="px-3 pt-3 pb-2">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
              Description
            </label>
            <textarea
              ref={textareaRef}
              value={baseNotesDraft}
              onChange={(e) => handleBaseNotesChange(e.target.value)}
              placeholder="What are you working on? (editable while running)"
              rows={2}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40 resize-none"
            />
          </div>

          {/* Existing annotations */}
          {annotations.length > 0 && (
            <div className="px-3 pb-2">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
                Timestamped Notes
              </label>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {annotations.map((a, idx) => (
                  <div
                    key={idx}
                    className="group flex items-start gap-2 px-2 py-1 rounded bg-zinc-800/50 text-xs"
                  >
                    <span className="font-mono text-orange-400/80 flex-shrink-0 pt-0.5 text-[10px]">
                      {formatElapsed(a.timestampMs)}
                    </span>
                    <span className="text-zinc-300 flex-1 leading-relaxed">{a.text}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnotation(idx)}
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all flex-shrink-0 mt-0.5"
                      title="Remove this note"
                      aria-label="Delete annotation"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New annotation input */}
          <div className="px-3 pb-3">
            <label className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">
              Add Note at {startedAt ? formatTime(Date.now()) : "—"}
            </label>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={newAnnotation}
                onChange={(e) => setNewAnnotation(e.target.value)}
                onKeyDown={handleAnnotationKeyDown}
                placeholder="Type a note and press Enter…"
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
              />
              <button
                type="button"
                onClick={handleAddAnnotation}
                disabled={!newAnnotation.trim()}
                className="px-3 py-1.5 rounded bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors"
              >
                + Add
              </button>
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">
              Each note is stamped with elapsed session time. Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-500">Enter</kbd> to add quickly.
            </p>
          </div>

          {/* Info footer */}
          <div className="border-t border-zinc-800 px-3 py-1.5">
            <p className="text-[10px] text-zinc-600">
              Notes auto-save to the entry. Annotations are visible when editing the completed entry.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
