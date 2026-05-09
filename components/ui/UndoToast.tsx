"use client";

import { useEffect, useState } from "react";

interface UndoToastProps {
  label: string;
  durationMs?: number;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ label, durationMs = 5000, onUndo, onDismiss }: UndoToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(pct);
      if (pct === 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [durationMs]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col overflow-hidden rounded-xl shadow-2xl border border-zinc-700 bg-zinc-900 min-w-[260px] max-w-sm"
    >
      {/* Progress bar */}
      <div className="h-0.5 bg-zinc-800">
        <div
          className="h-full bg-orange-500 transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Icon */}
        <span className="text-zinc-400 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="opacity-70">
            <path
              d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13ZM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8Zm7.25-3.25a.75.75 0 0 1 1.5 0v4a.75.75 0 0 1-1.5 0v-4Zm.75 6a.875.875 0 1 1 0 1.75A.875.875 0 0 1 8 10.75Z"
              fill="currentColor"
            />
          </svg>
        </span>

        {/* Label */}
        <span className="flex-1 text-sm text-zinc-200">{label}</span>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUndo}
            className="text-sm font-semibold text-orange-400 hover:text-orange-300 transition-colors"
          >
            Undo
          </button>
          <button
            onClick={onDismiss}
            className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
