"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { TimeEntry, Project, Task } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { formatDurationShort, elapsedMs } from "@/lib/duration";

export interface AutocompleteSuggestion {
  notes: string;
  projectId: string | null;
  taskId: string | null;
  tags: string[];
  billable: boolean;
  /** Most recent use timestamp */
  lastUsed: number;
  /** How many times this exact description was used */
  useCount: number;
}

/**
 * Derive unique suggestions from completed entries.
 * Groups by normalized notes text. Returns up to `limit` results sorted by recency.
 */
export function buildSuggestions(
  entries: TimeEntry[],
  limit = 50
): AutocompleteSuggestion[] {
  const map = new Map<string, AutocompleteSuggestion>();

  // Traverse chronologically newest-first (entries array is already sorted that way)
  for (const e of entries) {
    if (!e.notes || e.notes.trim() === "") continue;
    const key = e.notes.trim().toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        notes: e.notes.trim(),
        projectId: e.projectId,
        taskId: e.taskId,
        tags: e.tags ?? [],
        billable: e.billable ?? true,
        lastUsed: e.startedAt,
        useCount: 1,
      });
    } else {
      const existing = map.get(key)!;
      existing.useCount += 1;
      if (e.startedAt > existing.lastUsed) {
        // Update to most-recent project/task/tags when the key was seen again
        existing.lastUsed = e.startedAt;
        existing.projectId = e.projectId;
        existing.taskId = e.taskId;
        existing.tags = e.tags ?? [];
        existing.billable = e.billable ?? true;
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.lastUsed - a.lastUsed)
    .slice(0, limit);
}

/**
 * Filter suggestions to those whose notes contain `query` (case-insensitive).
 * Exact-start matches are ranked before mid-string matches.
 */
function filterSuggestions(
  suggestions: AutocompleteSuggestion[],
  query: string,
  limit = 8
): AutocompleteSuggestion[] {
  if (!query.trim()) return suggestions.slice(0, limit);
  const q = query.trim().toLowerCase();
  const starts: AutocompleteSuggestion[] = [];
  const contains: AutocompleteSuggestion[] = [];
  for (const s of suggestions) {
    const n = s.notes.toLowerCase();
    if (n.startsWith(q)) starts.push(s);
    else if (n.includes(q)) contains.push(s);
  }
  return [...starts, ...contains].slice(0, limit);
}

interface DescriptionAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onApplySuggestion: (suggestion: AutocompleteSuggestion) => void;
  disabled?: boolean;
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  onEnterKey?: () => void;
}

export function DescriptionAutocomplete({
  value,
  onChange,
  onApplySuggestion,
  disabled = false,
  entries,
  projects,
  tasks,
  onEnterKey,
}: DescriptionAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const allSuggestions = buildSuggestions(entries);
  const filtered = filterSuggestions(allSuggestions, value);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const applySuggestion = useCallback(
    (s: AutocompleteSuggestion) => {
      onApplySuggestion(s);
      setOpen(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    },
    [onApplySuggestion]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || filtered.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        onEnterKey?.();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, -1));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          applySuggestion(filtered[activeIndex]);
        } else {
          // No suggestion selected — run the timer toggle
          setOpen(false);
          onEnterKey?.();
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Tab":
        // Tab accepts the first suggestion if one exists
        if (activeIndex >= 0 && filtered[activeIndex]) {
          e.preventDefault();
          applySuggestion(filtered[activeIndex]);
        } else if (filtered.length > 0) {
          e.preventDefault();
          applySuggestion(filtered[0]);
        }
        break;
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const item = listRef.current.children[activeIndex] as HTMLElement;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const shouldShow = open && !disabled && filtered.length > 0;

  return (
    <div ref={containerRef} className="w-full relative">
      <input
        ref={inputRef}
        type="text"
        placeholder="What are you working on?"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        onFocus={() => {
          setOpen(true);
          setActiveIndex(-1);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={shouldShow}
        aria-haspopup="listbox"
        aria-activedescendant={activeIndex >= 0 ? `ac-item-${activeIndex}` : undefined}
        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed text-center text-lg"
      />

      {shouldShow && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="Description suggestions"
          className="absolute z-50 left-0 right-0 top-full mt-1 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-auto max-h-64"
        >
          {filtered.map((s, i) => {
            const proj = s.projectId ? projectMap.get(s.projectId) : undefined;
            const task = s.taskId ? taskMap.get(s.taskId) : undefined;
            const isActive = i === activeIndex;

            // Highlight query match in suggestion text
            const highlightedNotes = highlightMatch(s.notes, value);

            return (
              <li
                key={`${s.notes}-${i}`}
                id={`ac-item-${i}`}
                role="option"
                aria-selected={isActive}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  applySuggestion(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
                className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer text-sm transition-colors border-b border-zinc-800 last:border-b-0 ${
                  isActive
                    ? "bg-zinc-800 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-800/60"
                }`}
              >
                {/* Project color dot */}
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: proj?.color ?? "#52525b" }}
                />

                {/* Notes text with highlight */}
                <span
                  className="flex-1 truncate"
                  dangerouslySetInnerHTML={{ __html: highlightedNotes }}
                />

                {/* Task name */}
                {task && (
                  <span className="text-xs text-zinc-500 flex-shrink-0 truncate max-w-[80px]">
                    {task.name}
                  </span>
                )}

                {/* Project badge */}
                {proj ? (
                  <Badge label={proj.name} color={proj.color} />
                ) : (
                  <span className="text-xs text-zinc-600 flex-shrink-0">No project</span>
                )}

                {/* Use count hint */}
                {s.useCount > 1 && (
                  <span className="text-xs text-zinc-600 flex-shrink-0">×{s.useCount}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Wraps the matching query substring in a <mark> for inline highlight */
function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return escapeHtml(text);
  const q = query.trim();
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return escapeHtml(text);
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return `${escapeHtml(before)}<mark class="bg-amber-400/30 text-amber-200 rounded-sm">${escapeHtml(match)}</mark>${escapeHtml(after)}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
