"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { renderMarkdown } from "@/lib/markdown";

interface DayNoteProps {
  dateKey: string;      // YYYY-MM-DD
  note: string;         // current persisted content
  onSave: (dateKey: string, content: string) => void;
  forceOpen?: boolean;  // parent can push open state
  onOpenChange?: (open: boolean) => void; // notify parent when closed
}

export function DayNote({ dateKey, note, onSave, forceOpen, onOpenChange }: DayNoteProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"write" | "preview">("write");
  const [draft, setDraft] = useState(note);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasNote = note.trim().length > 0;

  // Respond to forceOpen from parent
  useEffect(() => {
    if (forceOpen && !open) {
      setDraft(note);
      setMode("write");
      setOpen(true);
    }
  }, [forceOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external changes (e.g. cross-tab) into draft when closed
  useEffect(() => {
    if (!open) setDraft(note);
  }, [note, open]);

  const handleOpen = useCallback(() => {
    setDraft(note);
    setMode("write");
    setOpen(true);
  }, [note]);

  const handleClose = useCallback(() => {
    setOpen(false);
    setMode("write");
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleSave = useCallback(() => {
    onSave(dateKey, draft);
    setOpen(false);
    setMode("write");
  }, [dateKey, draft, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      // Ctrl+Enter or Cmd+Enter saves
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSave();
      }
      // Escape cancels
      if (e.key === "Escape") {
        setDraft(note);
        setOpen(false);
        setMode("write");
      }
    },
    [handleSave, note]
  );

  useEffect(() => {
    if (open && mode === "write") {
      // Small tick to let the textarea mount
      const t = setTimeout(() => textareaRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open, mode]);

  // Dismiss modal on Escape from outside the textarea
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && (document.activeElement !== textareaRef.current)) {
        setDraft(note);
        handleClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, note, handleClose]);

  return (
    <>
      {/* Inline trigger button shown in the day header row */}
      <button
        onClick={(e) => { e.stopPropagation(); handleOpen(); }}
        title={hasNote ? "Edit day note" : "Add day note"}
        className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors ${
          hasNote
            ? "text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20"
            : "text-zinc-600 hover:text-zinc-400 border border-transparent hover:border-zinc-700"
        }`}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {hasNote ? "Note" : "Add note"}
      </button>

      {/* Modal overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) { setDraft(note); handleClose(); } }}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col"
            style={{ maxHeight: "80vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="text-zinc-100 font-semibold text-sm">Day Note</span>
                <span className="text-zinc-500 text-xs font-mono">{dateKey}</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Write / Preview tabs */}
                <div className="flex rounded-lg overflow-hidden border border-zinc-700 text-xs">
                  <button
                    onClick={() => setMode("write")}
                    className={`px-3 py-1 transition-colors ${
                      mode === "write"
                        ? "bg-zinc-700 text-zinc-100"
                        : "bg-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Write
                  </button>
                  <button
                    onClick={() => setMode("preview")}
                    className={`px-3 py-1 transition-colors ${
                      mode === "preview"
                        ? "bg-zinc-700 text-zinc-100"
                        : "bg-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    Preview
                  </button>
                </div>
                <button
                  onClick={() => { setDraft(note); handleClose(); }}
                  className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                  title="Cancel (Esc)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-auto min-h-0">
              {mode === "write" ? (
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Notes for ${dateKey}…\n\nMarkdown supported. Use this for standups, blockers, wins, or anything worth remembering about this day.`}
                  className="w-full h-full min-h-[240px] bg-transparent text-zinc-200 text-sm placeholder-zinc-600 resize-none px-5 py-4 focus:outline-none leading-relaxed font-mono"
                />
              ) : (
                <div className="px-5 py-4 min-h-[240px]">
                  {draft.trim() ? (
                    <div
                      className="prose prose-invert prose-sm max-w-none text-zinc-200"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(draft) }}
                    />
                  ) : (
                    <p className="text-zinc-600 text-sm italic">Nothing to preview.</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
              <span className="text-xs text-zinc-600">
                {draft.trim().length > 0
                  ? `${draft.trim().split(/\s+/).length} words`
                  : "Empty — saving will clear the note"}
              </span>
              <div className="flex items-center gap-2">
                {hasNote && draft === note && (
                  <button
                    onClick={() => { onSave(dateKey, ""); setOpen(false); }}
                    className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-400/20 hover:border-red-400/40 rounded-lg transition-colors"
                  >
                    Delete note
                  </button>
                )}
                <button
                  onClick={() => { setDraft(note); handleClose(); }}
                  className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 hover:border-zinc-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-1.5 text-xs bg-orange-500 hover:bg-orange-400 text-white rounded-lg transition-colors font-medium"
                  title="Save (Ctrl+Enter)"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
