"use client";

interface HighlightTextProps {
  text: string;
  query: string;
  className?: string;
}

/**
 * Renders `text` with substrings matching `query` highlighted in amber.
 * Case-insensitive. When query is empty, renders the text unchanged.
 */
export function HighlightText({ text, query, className }: HighlightTextProps) {
  if (!query.trim()) {
    return <span className={className}>{text}</span>;
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "gi");
  const parts = text.split(regex);

  return (
    <span className={className}>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-amber-400/30 text-amber-200 rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
}
