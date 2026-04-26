"use client";

import { useState, useMemo } from "react";
import { TimeEntry } from "@/types";
import { Button } from "@/components/ui/Button";

interface TagManagerProps {
  entries: TimeEntry[];
  onUpdateAllTags: (oldTag: string, newTag: string | null) => void; // null = delete
}

interface TagRow {
  tag: string;
  count: number;
}

export function TagManager({ entries, onUpdateAllTags }: TagManagerProps) {
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [merging, setMerging] = useState<string | null>(null);
  const [mergeTarget, setMergeTarget] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const tagRows: TagRow[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of entries) {
      if (!e.tags) continue;
      for (const t of e.tags) {
        counts[t] = (counts[t] ?? 0) + 1;
      }
    }
    return Object.entries(counts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
  }, [entries]);

  const allTags = tagRows.map((r) => r.tag);

  const startRename = (tag: string) => {
    setRenaming(tag);
    setRenameValue(tag);
    setRenameError(null);
    setMerging(null);
  };

  const commitRename = () => {
    if (!renaming) return;
    const next = renameValue.trim().toLowerCase().replace(/\s+/g, "-");
    if (!next) { setRenameError("Tag name cannot be empty."); return; }
    if (next === renaming) { setRenaming(null); return; }
    if (allTags.includes(next)) {
      setRenameError(`Tag "${next}" already exists. Use merge instead.`);
      return;
    }
    onUpdateAllTags(renaming, next);
    setRenaming(null);
    setRenameError(null);
  };

  const startMerge = (tag: string) => {
    setMerging(tag);
    setMergeTarget("");
    setRenaming(null);
  };

  const commitMerge = () => {
    if (!merging || !mergeTarget) return;
    // Replace all occurrences of `merging` tag with `mergeTarget`
    onUpdateAllTags(merging, mergeTarget);
    setMerging(null);
    setMergeTarget("");
  };

  const handleDelete = (tag: string) => {
    if (confirmDelete === tag) {
      onUpdateAllTags(tag, null);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(tag);
    }
  };

  if (tagRows.length === 0) {
    return (
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Tags</h2>
        <p className="text-sm text-zinc-500">No tags yet. Add tags to time entries to manage them here.</p>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-zinc-100 mb-1">Tags</h2>
      <p className="text-xs text-zinc-500 mb-4">Rename, merge, or delete tags across all entries.</p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {tagRows.map(({ tag, count }) => (
          <div key={tag} className="px-4 py-3">
            {/* Main row */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium text-zinc-200 truncate">{tag}</span>
                <span className="text-xs text-zinc-500 shrink-0">{count} {count === 1 ? "entry" : "entries"}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => renaming === tag ? setRenaming(null) : startRename(tag)}
                  className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                >
                  {renaming === tag ? "Cancel" : "Rename"}
                </button>
                <button
                  onClick={() => merging === tag ? setMerging(null) : startMerge(tag)}
                  className="text-xs text-zinc-400 hover:text-zinc-100 transition-colors px-2 py-1 rounded hover:bg-zinc-800"
                >
                  {merging === tag ? "Cancel" : "Merge"}
                </button>
                <button
                  onClick={() => {
                    if (confirmDelete === tag) {
                      handleDelete(tag);
                    } else {
                      setConfirmDelete(tag);
                    }
                  }}
                  className={`text-xs transition-colors px-2 py-1 rounded ${
                    confirmDelete === tag
                      ? "text-red-400 hover:text-red-300 bg-red-950/40 hover:bg-red-950/60"
                      : "text-zinc-400 hover:text-red-400 hover:bg-zinc-800"
                  }`}
                >
                  {confirmDelete === tag ? "Confirm?" : "Delete"}
                </button>
              </div>
            </div>

            {/* Rename inline form */}
            {renaming === tag && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={renameValue}
                  onChange={(e) => { setRenameValue(e.target.value); setRenameError(null); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setRenaming(null);
                  }}
                  placeholder="New tag name"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <Button size="sm" variant="primary" onClick={commitRename}>
                  Save
                </Button>
              </div>
            )}
            {renaming === tag && renameError && (
              <p className="mt-1 text-xs text-red-400">{renameError}</p>
            )}

            {/* Merge inline form */}
            {merging === tag && (
              <div className="mt-3 flex items-center gap-2">
                <select
                  autoFocus
                  value={mergeTarget}
                  onChange={(e) => setMergeTarget(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                >
                  <option value="">Merge into…</option>
                  {allTags.filter((t) => t !== tag).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={commitMerge}
                  disabled={!mergeTarget}
                >
                  Merge
                </Button>
              </div>
            )}
            {merging === tag && (
              <p className="mt-1 text-xs text-zinc-500">
                All entries tagged <span className="text-zinc-300">{tag}</span> will be re-tagged with the selected target. The source tag disappears.
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
