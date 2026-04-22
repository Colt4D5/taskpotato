"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { TimeEntry, Project, Task } from "@/types";
import { formatDayLabel } from "@/lib/dateUtils";
import { formatDurationShort } from "@/lib/duration";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type ResultKind = "entry" | "project" | "task" | "nav";

interface NavResult {
  kind: "nav";
  id: string;
  label: string;
  description: string;
  href: string;
  icon: string;
}

interface EntryResult {
  kind: "entry";
  id: string;
  label: string;         // notes / "(no description)"
  description: string;   // date + project + task
  date: string;          // YYYY-MM-DD for grouping
  duration: string;
  tags: string[];
  billable: boolean;
}

interface ProjectResult {
  kind: "project";
  id: string;
  label: string;
  description: string;
  color: string;
}

interface TaskResult {
  kind: "task";
  id: string;
  label: string;
  description: string;
}

type SearchResult = NavResult | EntryResult | ProjectResult | TaskResult;

// ──────────────────────────────────────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  onClose: () => void;
  onNavigateToEntry?: (entryId: string) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Nav items always present
// ──────────────────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavResult[] = [
  { kind: "nav", id: "nav-timer",   label: "Timer",   description: "Start or stop the timer",   href: "/timer",   icon: "⏱" },
  { kind: "nav", id: "nav-log",     label: "Log",     description: "Browse all time entries",   href: "/log",     icon: "📋" },
  { kind: "nav", id: "nav-reports", label: "Reports", description: "Weekly summaries and stats", href: "/reports", icon: "📊" },
  { kind: "nav", id: "nav-settings",label: "Settings",description: "Preferences and data",       href: "/settings",icon: "⚙️" },
];

// ──────────────────────────────────────────────────────────────────────────────
// Highlight helper
// ──────────────────────────────────────────────────────────────────────────────

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-400/30 text-amber-300 rounded-sm px-px">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────────────────────

export function CommandPalette({ entries, projects, tasks, onClose, onNavigateToEntry }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Build lookup maps
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // ── Search index ─────────────────────────────────────────────────────────────
  const results: SearchResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) {
      // No query → show nav items only
      return NAV_ITEMS;
    }

    const out: SearchResult[] = [];

    // Nav items
    for (const nav of NAV_ITEMS) {
      if (nav.label.toLowerCase().includes(q) || nav.description.toLowerCase().includes(q)) {
        out.push(nav);
      }
    }

    // Projects
    for (const p of projects) {
      if (p.name.toLowerCase().includes(q)) {
        out.push({
          kind: "project",
          id: p.id,
          label: p.name,
          description: p.archived ? "Project (archived)" : "Project",
          color: p.color,
        });
      }
    }

    // Tasks
    for (const t of tasks) {
      const proj = projectMap.get(t.projectId);
      if (t.name.toLowerCase().includes(q) || (t.notes && t.notes.toLowerCase().includes(q))) {
        out.push({
          kind: "task",
          id: t.id,
          label: t.name,
          description: proj ? `Task · ${proj.name}` : "Task",
        });
      }
    }

    // Entries (completed only)
    const completedEntries = entries.filter((e) => e.stoppedAt !== null);
    for (const e of completedEntries) {
      const proj = e.projectId ? projectMap.get(e.projectId) : null;
      const task = e.taskId ? taskMap.get(e.taskId) : null;

      const searchable = [
        e.notes,
        proj?.name ?? "",
        task?.name ?? "",
        ...(e.tags ?? []),
      ].join(" ").toLowerCase();

      if (!searchable.includes(q)) continue;

      const dateStr = new Date(e.startedAt).toLocaleDateString("en-CA");
      const dayLabel = formatDayLabel(dateStr);
      const parts = [dayLabel, proj?.name, task?.name].filter(Boolean);

      out.push({
        kind: "entry",
        id: e.id,
        label: e.notes.trim() || "(no description)",
        description: parts.join(" · "),
        date: dateStr,
        duration: e.stoppedAt ? formatDurationShort(e.stoppedAt - e.startedAt + (e.offsetMs ?? 0)) : "",
        tags: e.tags ?? [],
        billable: e.billable,
      });
    }

    return out.slice(0, 50); // cap at 50
  }, [query, entries, projects, tasks, projectMap, taskMap]);

  // Keep active index in bounds
  useEffect(() => {
    setActive(0);
  }, [query]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${active}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const handleSelect = useCallback((result: SearchResult) => {
    switch (result.kind) {
      case "nav":
        router.push(result.href);
        onClose();
        break;
      case "project":
        router.push("/log");
        onClose();
        break;
      case "task":
        router.push("/log");
        onClose();
        break;
      case "entry":
        if (onNavigateToEntry) {
          onNavigateToEntry(result.id);
        } else {
          router.push("/log");
        }
        onClose();
        break;
    }
  }, [router, onClose, onNavigateToEntry]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActive((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[active]) handleSelect(results[active]);
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, active, handleSelect, onClose]);

  // ── Render helpers ────────────────────────────────────────────────────────────

  function renderIcon(result: SearchResult) {
    switch (result.kind) {
      case "nav":     return <span className="text-zinc-400 text-sm w-5 text-center flex-shrink-0">{result.icon}</span>;
      case "project": return <span className="w-3 h-3 rounded-full flex-shrink-0 mt-0.5" style={{ backgroundColor: result.color }} />;
      case "task":    return <span className="text-zinc-500 text-xs w-5 text-center flex-shrink-0">◈</span>;
      case "entry":   return <span className="text-zinc-500 text-xs w-5 text-center flex-shrink-0">◷</span>;
    }
  }

  const q = query.trim();

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Command palette"
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "60vh" }}
      >
        {/* Input row */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <span className="text-zinc-400 text-sm">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search entries, projects, tasks…"
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-500 outline-none text-sm"
            aria-label="Command palette search"
            autoComplete="off"
            spellCheck={false}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-500 hover:text-zinc-300 text-xs"
              aria-label="Clear"
            >
              ✕
            </button>
          )}
          <kbd className="text-zinc-600 text-xs border border-zinc-700 rounded px-1 py-px">esc</kbd>
        </div>

        {/* Results */}
        {results.length === 0 ? (
          <div className="px-4 py-8 text-center text-zinc-500 text-sm">No results for &ldquo;{query}&rdquo;</div>
        ) : (
          <ul ref={listRef} className="overflow-y-auto py-1" role="listbox">
            {results.map((result, idx) => {
              const isActive = idx === active;
              return (
                <li
                  key={result.id}
                  data-idx={idx}
                  role="option"
                  aria-selected={isActive}
                  className={`flex items-start gap-3 px-4 py-2.5 cursor-pointer transition-colors ${isActive ? "bg-zinc-700/60" : "hover:bg-zinc-800/50"}`}
                  onMouseEnter={() => setActive(idx)}
                  onClick={() => handleSelect(result)}
                >
                  {renderIcon(result)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-zinc-100 truncate">
                      {q ? highlight(result.label, q) : result.label}
                    </div>
                    {result.description && (
                      <div className="text-xs text-zinc-500 truncate mt-0.5">{result.description}</div>
                    )}
                    {result.kind === "entry" && result.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.tags.map((tag) => (
                          <span key={tag} className="text-xs bg-zinc-700 text-zinc-300 rounded px-1 py-px">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {result.kind === "entry" && result.duration && (
                    <span className="text-xs text-zinc-400 flex-shrink-0 font-mono">{result.duration}</span>
                  )}
                  {result.kind === "entry" && !result.billable && (
                    <span className="text-xs text-zinc-500 flex-shrink-0">non-billable</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {/* Footer */}
        <div className="border-t border-zinc-800 px-4 py-2 flex gap-4 text-xs text-zinc-600">
          <span><kbd className="border border-zinc-700 rounded px-1">↑↓</kbd> navigate</span>
          <span><kbd className="border border-zinc-700 rounded px-1">↵</kbd> open</span>
          <span><kbd className="border border-zinc-700 rounded px-1">esc</kbd> close</span>
          <span className="ml-auto"><kbd className="border border-zinc-700 rounded px-1">⌘K</kbd> toggle</span>
        </div>
      </div>
    </div>
  );
}
