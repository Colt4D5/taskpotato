"use client";

import { useMemo, useState } from "react";
import { TimeEntry } from "@/types";
import { formatDurationShort } from "@/lib/duration";
import { computeTagDistribution } from "@/lib/tagDistribution";

interface Props {
  entries: TimeEntry[];
}

// Deterministic palette — cycles through these for tag coloring
const TAG_PALETTE = [
  "#f97316", // orange-500
  "#3b82f6", // blue-500
  "#10b981", // emerald-500
  "#a855f7", // purple-500
  "#eab308", // yellow-500
  "#ec4899", // pink-500
  "#14b8a6", // teal-500
  "#f43f5e", // rose-500
  "#6366f1", // indigo-500
  "#22c55e", // green-500
  "#0ea5e9", // sky-500
  "#d946ef", // fuchsia-500
];

function tagColor(index: number): string {
  return TAG_PALETTE[index % TAG_PALETTE.length];
}

type SortMode = "time" | "alpha" | "entries";

export function TagDistribution({ entries }: Props) {
  const [sortMode, setSortMode] = useState<SortMode>("time");
  const [showBillableSplit, setShowBillableSplit] = useState(false);
  const [hoveredTag, setHoveredTag] = useState<string | null>(null);

  const result = useMemo(() => computeTagDistribution(entries), [entries]);

  const sortedRows = useMemo(() => {
    const base = [...result.rows];
    if (sortMode === "alpha") return base.sort((a, b) => a.tag.localeCompare(b.tag));
    if (sortMode === "entries") return base.sort((a, b) => b.entryCount - a.entryCount);
    return base; // default: by time (already sorted in lib)
  }, [result.rows, sortMode]);

  // Don't render if no tags exist in the dataset
  if (result.rows.length === 0) return null;

  const topMs = sortedRows[0]?.totalMs ?? 1;

  // Build the stacked summary bar slices (sorted by time, not affected by sortMode)
  const stackedSlices = result.rows.map((row, i) => ({
    tag: row.tag,
    pct: result.totalRangeMs > 0 ? (row.totalMs / result.totalRangeMs) * 100 : 0,
    color: tagColor(i),
  }));
  const untaggedPct =
    result.totalRangeMs > 0 ? (result.untaggedMs / result.totalRangeMs) * 100 : 0;

  // Color lookup by tag name (stable — based on position in the time-sorted rows array)
  const colorByTag = new Map(result.rows.map((row, i) => [row.tag, tagColor(i)]));

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Tag Distribution
          </h2>
          <span className="text-xs text-zinc-600 font-mono">
            {result.rows.length} tag{result.rows.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Billable split toggle */}
          <button
            onClick={() => setShowBillableSplit((v) => !v)}
            className={`text-xs px-2 py-1 rounded-md border transition-colors ${
              showBillableSplit
                ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            Billable split
          </button>

          {/* Sort selector */}
          <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
            {(["time", "alpha", "entries"] as SortMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setSortMode(m)}
                className={`text-xs px-2.5 py-1 transition-colors ${
                  sortMode === m
                    ? "bg-zinc-700 text-zinc-100"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {m === "time" ? "Time" : m === "alpha" ? "A–Z" : "Entries"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stacked proportional summary bar */}
      <div className="mb-5">
        <div className="h-5 rounded-md overflow-hidden flex">
          {stackedSlices.map((slice) => (
            <div
              key={slice.tag}
              style={{
                width: `${slice.pct}%`,
                backgroundColor: slice.color,
                opacity: hoveredTag === null || hoveredTag === slice.tag ? 1 : 0.25,
                transition: "opacity 0.15s",
              }}
              onMouseEnter={() => setHoveredTag(slice.tag)}
              onMouseLeave={() => setHoveredTag(null)}
              title={`${slice.tag}: ${slice.pct.toFixed(1)}% of total`}
            />
          ))}
          {/* untagged remainder */}
          {untaggedPct > 0.5 && (
            <div
              style={{ width: `${untaggedPct}%`, flexShrink: 0 }}
              className="bg-zinc-700/60"
              title={`Untagged: ${untaggedPct.toFixed(1)}% of total`}
            />
          )}
        </div>
        {/* Stacked bar legend — show top 6 to avoid clutter */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
          {stackedSlices.slice(0, 6).map((slice) => (
            <div
              key={slice.tag}
              className="flex items-center gap-1.5 text-xs text-zinc-500"
              onMouseEnter={() => setHoveredTag(slice.tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              <span
                className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
                style={{ backgroundColor: slice.color }}
              />
              <span>{slice.tag}</span>
            </div>
          ))}
          {stackedSlices.length > 6 && (
            <span className="text-xs text-zinc-600">
              +{stackedSlices.length - 6} more
            </span>
          )}
          {untaggedPct > 0.5 && (
            <div className="flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="inline-block w-2 h-2 rounded-sm bg-zinc-700" />
              <span>untagged</span>
            </div>
          )}
        </div>
      </div>

      {/* Per-tag rows */}
      <div className="flex flex-col gap-2">
        {sortedRows.map((row) => {
          const color = colorByTag.get(row.tag) ?? "#f97316";
          // Bar width relative to the top tag (by time) for visual differentiation
          const timeBarPct = topMs > 0 ? (row.totalMs / topMs) * 100 : 0;
          const billablePct =
            row.totalMs > 0 ? Math.round((row.billableMs / row.totalMs) * 100) : 0;
          const isHovered = hoveredTag === row.tag;

          return (
            <div
              key={row.tag}
              className={`rounded-lg px-3 py-2.5 transition-colors cursor-default ${
                isHovered ? "bg-zinc-800" : "hover:bg-zinc-800/60"
              }`}
              onMouseEnter={() => setHoveredTag(row.tag)}
              onMouseLeave={() => setHoveredTag(null)}
            >
              {/* Tag name + stats */}
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="inline-block w-2 h-2 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-zinc-200 font-medium truncate">
                    {row.tag}
                  </span>
                  <span className="text-xs text-zinc-600 font-mono flex-shrink-0">
                    {row.entryCount} {row.entryCount === 1 ? "entry" : "entries"}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Percentage of tagged time */}
                  <span className="text-xs text-zinc-500 font-mono">
                    {row.pct.toFixed(1)}%
                  </span>
                  {/* Total duration */}
                  <span className="text-sm font-mono font-semibold text-zinc-200">
                    {formatDurationShort(row.totalMs)}
                  </span>
                </div>
              </div>

              {/* Horizontal bar */}
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${timeBarPct}%`,
                    backgroundColor: color,
                  }}
                />
              </div>

              {/* Billable split — shown when toggle is on */}
              {showBillableSplit && row.totalMs > 0 && (
                <div className="flex items-center gap-3 mt-1.5">
                  {/* Billable sub-bar */}
                  <div className="flex-1 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500/70"
                      style={{ width: `${billablePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-emerald-600 w-28 text-right flex-shrink-0">
                    {formatDurationShort(row.billableMs)} billable ({billablePct}%)
                  </span>
                  {row.nonBillableMs > 0 && (
                    <span className="text-xs font-mono text-zinc-600 flex-shrink-0">
                      {formatDurationShort(row.nonBillableMs)} non-billable
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Untagged row — shown when untagged time is significant */}
        {result.untaggedMs > 0 && (
          <div className="rounded-lg px-3 py-2.5 border border-dashed border-zinc-800 mt-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-sm bg-zinc-700 flex-shrink-0" />
                <span className="text-sm text-zinc-600 italic">untagged</span>
                <span className="text-xs text-zinc-700 font-mono">
                  {result.untaggedEntryCount}{" "}
                  {result.untaggedEntryCount === 1 ? "entry" : "entries"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-zinc-700 font-mono">
                  {untaggedPct.toFixed(1)}%
                </span>
                <span className="text-sm font-mono text-zinc-600">
                  {formatDurationShort(result.untaggedMs)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer note */}
      <p className="text-xs text-zinc-700 mt-4 leading-relaxed">
        Multi-tagged entries contribute their full duration to each tag — percentages reflect share
        of tagged time and may exceed 100% in aggregate.
      </p>
    </section>
  );
}
