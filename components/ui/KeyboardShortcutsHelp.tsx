"use client";

import { useEffect, useState } from "react";

const SHORTCUTS = [
  { key: "T", description: "Go to Timer" },
  { key: "L", description: "Go to Log" },
  { key: "R", description: "Go to Reports" },
  { key: "Space", description: "Start / Stop timer (when not typing)" },
  { key: "Enter", description: "Start / Stop timer (from description field)" },
  { key: "?", description: "Show this help" },
  { key: "Esc", description: "Close any modal" },
];

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("taskpotato:shortcuts-help", handler);
    return () => window.removeEventListener("taskpotato:shortcuts-help", handler);
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-80 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Keyboard Shortcuts</h2>
        <div className="flex flex-col gap-2">
          {SHORTCUTS.map(({ key, description }) => (
            <div key={key} className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">{description}</span>
              <kbd className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-300 font-mono">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <button
          onClick={() => setOpen(false)}
          className="mt-5 w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Press Esc or click outside to close
        </button>
      </div>
    </div>
  );
}
