"use client";

import { useState, KeyboardEvent, useRef, useId, useEffect } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  /** All existing tags across all entries — enables autocomplete dropdown */
  allTags?: string[];
}

export function TagInput({ tags, onChange, disabled, placeholder = "Add tag…", allTags }: TagInputProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Suggestions: filter allTags by current input, exclude already-applied tags, cap at 8
  const suggestions: string[] = allTags && input.trim().length > 0
    ? allTags
        .filter((t) => t !== input.trim().toLowerCase().replace(/\s+/g, "-"))
        .filter((t) => !tags.includes(t))
        .filter((t) => t.includes(input.trim().toLowerCase()))
        .sort((a, b) => {
          // Prefix matches first
          const ap = a.startsWith(input.trim().toLowerCase()) ? 0 : 1;
          const bp = b.startsWith(input.trim().toLowerCase()) ? 0 : 1;
          return ap - bp || a.localeCompare(b);
        })
        .slice(0, 8)
    : [];

  // Close suggestions when there's nothing to show
  useEffect(() => {
    if (suggestions.length === 0) {
      setOpen(false);
      setActiveIdx(-1);
    } else {
      setOpen(true);
    }
  }, [suggestions.length]);

  const commit = (value?: string) => {
    const raw = value ?? input;
    const val = raw.trim().toLowerCase().replace(/\s+/g, "-");
    if (!val || tags.includes(val)) {
      setInput("");
      setOpen(false);
      setActiveIdx(-1);
      return;
    }
    onChange([...tags, val]);
    setInput("");
    setOpen(false);
    setActiveIdx(-1);
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (open && suggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(i - 1, -1));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        setActiveIdx(-1);
        return;
      }
      if ((e.key === "Enter" || e.key === "Tab") && activeIdx >= 0) {
        e.preventDefault();
        commit(suggestions[activeIdx]);
        return;
      }
      if (e.key === "Tab" && activeIdx < 0 && suggestions.length > 0) {
        // Tab with no highlighted item → accept top suggestion
        e.preventDefault();
        commit(suggestions[0]);
        return;
      }
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  const activeDescendant =
    open && activeIdx >= 0 ? `${listId}-option-${activeIdx}` : undefined;

  return (
    <div className="relative">
      {/* Input chip container */}
      <div
        className="flex flex-wrap gap-1.5 items-center min-h-[38px] bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-orange-500/50"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded-full"
          >
            #{tag}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); remove(tag); }}
                className="text-zinc-500 hover:text-red-400 leading-none ml-0.5"
                tabIndex={-1}
                aria-label={`Remove tag ${tag}`}
              >
                ×
              </button>
            )}
          </span>
        ))}
        {!disabled && (
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            onBlur={() => {
              // Delay close so click on suggestion fires first
              setTimeout(() => {
                setOpen(false);
                setActiveIdx(-1);
              }, 150);
            }}
            placeholder={tags.length === 0 ? placeholder : ""}
            className="flex-1 min-w-[80px] bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
            role={allTags ? "combobox" : undefined}
            aria-autocomplete={allTags ? "list" : undefined}
            aria-expanded={allTags ? open : undefined}
            aria-controls={allTags ? listId : undefined}
            aria-activedescendant={activeDescendant}
          />
        )}
      </div>

      {/* Suggestions dropdown */}
      {allTags && open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Tag suggestions"
          className="absolute z-50 left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto"
        >
          {suggestions.map((tag, i) => {
            const query = input.trim().toLowerCase();
            const matchIdx = tag.indexOf(query);
            const before = matchIdx >= 0 ? tag.slice(0, matchIdx) : tag;
            const match = matchIdx >= 0 ? tag.slice(matchIdx, matchIdx + query.length) : "";
            const after = matchIdx >= 0 ? tag.slice(matchIdx + query.length) : "";

            return (
              <li
                key={tag}
                id={`${listId}-option-${i}`}
                role="option"
                aria-selected={i === activeIdx}
                onMouseDown={(e) => {
                  e.preventDefault(); // prevent blur before click
                  commit(tag);
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors ${
                  i === activeIdx
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-300 hover:bg-zinc-700/60"
                }`}
              >
                <span className="text-zinc-500 text-xs">#</span>
                <span>
                  {before}
                  {match && (
                    <span className="bg-amber-400/25 text-amber-300 rounded px-0.5">
                      {match}
                    </span>
                  )}
                  {after}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
