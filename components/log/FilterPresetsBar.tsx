"use client";

import { useState, useRef, useEffect } from "react";
import type { FilterPreset } from "@/types";
import type { DateRange } from "@/components/log/DateRangeFilter";

interface ActiveFilters {
  clientId: string;
  projectId: string;
  taskName: string;
  tag: string;
  notes: string;
  dateRange: DateRange;
}

interface FilterPresetsBarProps {
  presets: FilterPreset[];
  activePresetId: string | null;
  currentFilters: ActiveFilters;
  hasActiveFilter: boolean;
  onApply: (preset: FilterPreset) => void;
  onSave: (name: string) => void;
  onDelete: (id: string) => void;
  onClearActivePreset: () => void;
}

export function FilterPresetsBar({
  presets,
  activePresetId,
  currentFilters,
  hasActiveFilter,
  onApply,
  onSave,
  onDelete,
  onClearActivePreset,
}: FilterPresetsBarProps) {
  const [saving, setSaving] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (saving) {
      nameInputRef.current?.focus();
    }
  }, [saving]);

  // Auto-suggest a name from current filter state
  function suggestName(filters: ActiveFilters): string {
    const parts: string[] = [];
    if (filters.projectId) parts.push("project");
    if (filters.clientId) parts.push("client");
    if (filters.tag) parts.push(`#${filters.tag}`);
    if (filters.taskName) parts.push(filters.taskName);
    if (filters.notes) parts.push(`"${filters.notes.slice(0, 15)}"`);
    if (filters.dateRange.from || filters.dateRange.to) parts.push("range");
    return parts.length > 0 ? parts.join(" + ") : "My filter";
  }

  function openSave() {
    setSaveName(suggestName(currentFilters));
    setSaving(true);
  }

  function handleSaveSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = saveName.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setSaving(false);
    setSaveName("");
  }

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
      if (activePresetId === id) onClearActivePreset();
    } else {
      setDeleteConfirm(id);
      // Auto-cancel confirmation after 3s
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  }

  // Detect if current filter state differs from the active preset
  function presetsMatch(preset: FilterPreset, filters: ActiveFilters): boolean {
    return (
      preset.clientId === filters.clientId &&
      preset.projectId === filters.projectId &&
      preset.taskName === filters.taskName &&
      preset.tag === filters.tag &&
      preset.notes === filters.notes &&
      preset.dateRangeFrom === filters.dateRange.from &&
      preset.dateRangeTo === filters.dateRange.to
    );
  }

  const activePreset = presets.find((p) => p.id === activePresetId);
  const activePresetModified =
    activePreset && !presetsMatch(activePreset, currentFilters);

  if (presets.length === 0 && !hasActiveFilter) return null;

  return (
    <div className="flex items-center gap-2 mb-4 flex-wrap">
      {/* Label */}
      <span className="text-xs text-zinc-600 font-medium shrink-0">Presets:</span>

      {/* Existing preset pills */}
      {presets.map((preset) => {
        const isActive = preset.id === activePresetId;
        return (
          <div
            key={preset.id}
            className={`group flex items-center gap-1 rounded-full text-xs font-medium transition-colors cursor-pointer select-none ${
              isActive
                ? "bg-orange-500/25 border border-orange-500/60 text-orange-300"
                : "bg-zinc-800 border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
            }`}
          >
            <button
              onClick={() => {
                if (isActive) {
                  onClearActivePreset();
                } else {
                  onApply(preset);
                }
              }}
              className="pl-3 pr-2 py-1 rounded-full"
              title={isActive ? "Click to deactivate preset" : `Apply: ${preset.name}`}
            >
              {isActive && (
                <span className="mr-1 text-orange-400">●</span>
              )}
              {preset.name}
              {isActive && activePresetModified && (
                <span className="ml-1 text-orange-500/70" title="Filters have been modified since applying this preset">*</span>
              )}
            </button>
            <button
              onClick={(e) => handleDeleteClick(e, preset.id)}
              className={`pr-2 py-1 transition-colors ${
                deleteConfirm === preset.id
                  ? "text-red-400"
                  : "text-zinc-600 hover:text-zinc-400 opacity-0 group-hover:opacity-100"
              }`}
              title={deleteConfirm === preset.id ? "Confirm delete" : "Delete preset"}
            >
              {deleteConfirm === preset.id ? "×?" : "×"}
            </button>
          </div>
        );
      })}

      {/* Save current filter as preset */}
      {saving ? (
        <form onSubmit={handleSaveSubmit} className="flex items-center gap-1.5">
          <input
            ref={nameInputRef}
            type="text"
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") { setSaving(false); setSaveName(""); } }}
            placeholder="Preset name…"
            maxLength={40}
            className="w-36 bg-zinc-900 border border-orange-500/50 rounded-lg px-2 py-1 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-orange-500/50"
          />
          <button
            type="submit"
            disabled={!saveName.trim()}
            className="px-2 py-1 bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition-colors"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => { setSaving(false); setSaveName(""); }}
            className="px-2 py-1 text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
          >
            Cancel
          </button>
        </form>
      ) : hasActiveFilter ? (
        <button
          onClick={openSave}
          className="flex items-center gap-1 px-2.5 py-1 text-xs text-zinc-500 hover:text-orange-400 border border-dashed border-zinc-700 hover:border-orange-500/50 rounded-full transition-colors"
          title="Save current filters as a named preset"
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Save filter
        </button>
      ) : null}
    </div>
  );
}
