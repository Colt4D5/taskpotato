"use client";

import { useState } from "react";
import { Project } from "@/types";

interface BulkActionBarProps {
  selectedCount: number;
  totalCount: number;
  projects: Project[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => void;
  onReassignProject: (projectId: string | null) => void;
  onAddTag: (tag: string) => void;
  onSetBillable: (billable: boolean) => void;
}

export function BulkActionBar({
  selectedCount,
  totalCount,
  projects,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onReassignProject,
  onAddTag,
  onSetBillable,
}: BulkActionBarProps) {
  const [showReassign, setShowReassign] = useState(false);
  const [showAddTag, setShowAddTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  const allSelected = selectedCount === totalCount && totalCount > 0;

  function handleAddTag() {
    const normalized = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!normalized) return;
    onAddTag(normalized);
    setTagInput("");
    setShowAddTag(false);
  }

  return (
    <div className="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur border border-zinc-700 rounded-xl px-4 py-3 mb-4 flex flex-wrap items-center gap-3">
      {/* Selection count + select-all toggle */}
      <div className="flex items-center gap-2 mr-auto">
        <input
          type="checkbox"
          checked={allSelected}
          onChange={allSelected ? onDeselectAll : onSelectAll}
          className="w-4 h-4 accent-orange-500 cursor-pointer"
        />
        <span className="text-sm text-zinc-300 font-medium">
          {selectedCount} of {totalCount} selected
        </span>
      </div>

      {/* Actions */}
      {selectedCount > 0 && (
        <>
          {/* Reassign project */}
          <div className="relative">
            <button
              onClick={() => { setShowReassign((v) => !v); setShowAddTag(false); setConfirmDelete(false); }}
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
            >
              Reassign project
            </button>
            {showReassign && (
              <div className="absolute top-full mt-1 left-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 min-w-[180px]">
                <button
                  onClick={() => { onReassignProject(null); setShowReassign(false); }}
                  className="w-full text-left text-sm px-3 py-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors rounded-t-lg"
                >
                  — No project
                </button>
                {projects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { onReassignProject(p.id); setShowReassign(false); }}
                    className="w-full text-left text-sm px-3 py-2 text-zinc-300 hover:bg-zinc-800 transition-colors flex items-center gap-2 last:rounded-b-lg"
                  >
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Add tag */}
          <div className="relative">
            <button
              onClick={() => { setShowAddTag((v) => !v); setShowReassign(false); setConfirmDelete(false); }}
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
            >
              Add tag
            </button>
            {showAddTag && (
              <div className="absolute top-full mt-1 left-0 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 p-2 flex gap-2 min-w-[200px]">
                <input
                  autoFocus
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(); if (e.key === "Escape") setShowAddTag(false); }}
                  placeholder="tag-name"
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                />
                <button
                  onClick={handleAddTag}
                  className="text-xs px-2 py-1 bg-orange-500 hover:bg-orange-400 text-white rounded transition-colors"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Set billable */}
          <button
            onClick={() => { onSetBillable(true); setShowReassign(false); setShowAddTag(false); }}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
          >
            Mark billable
          </button>
          <button
            onClick={() => { onSetBillable(false); setShowReassign(false); setShowAddTag(false); }}
            className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700 transition-colors"
          >
            Mark non-billable
          </button>

          {/* Delete */}
          {!confirmDelete ? (
            <button
              onClick={() => { setConfirmDelete(true); setShowReassign(false); setShowAddTag(false); }}
              className="text-xs px-3 py-1.5 bg-zinc-800 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg border border-zinc-700 transition-colors"
            >
              Delete {selectedCount}
            </button>
          ) : (
            <div className="flex items-center gap-1">
              <button
                onClick={() => { onDeleteSelected(); setConfirmDelete(false); }}
                className="text-xs px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/40 transition-colors"
              >
                Confirm delete
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1.5 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
