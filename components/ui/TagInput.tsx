"use client";

import { useState, KeyboardEvent } from "react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function TagInput({ tags, onChange, disabled, placeholder = "Add tag…" }: TagInputProps) {
  const [input, setInput] = useState("");

  const commit = () => {
    const val = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (!val || tags.includes(val)) {
      setInput("");
      return;
    }
    onChange([...tags, val]);
    setInput("");
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "Tab") {
      e.preventDefault();
      commit();
    } else if (e.key === "Backspace" && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  };

  const remove = (tag: string) => onChange(tags.filter((t) => t !== tag));

  return (
    <div className="flex flex-wrap gap-1.5 items-center min-h-[38px] bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-orange-500/50">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-zinc-700 text-zinc-300 text-xs px-2 py-0.5 rounded-full"
        >
          #{tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => remove(tag)}
              className="text-zinc-500 hover:text-red-400 leading-none ml-0.5"
            >
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={commit}
          placeholder={tags.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none"
        />
      )}
    </div>
  );
}
