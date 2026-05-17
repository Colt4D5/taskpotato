"use client";

import { useStorage } from "@/hooks/useStorage";
import { uuid } from "@/lib/uuid";
import type { FilterPreset } from "@/types";

const STORAGE_KEY = "taskpotato:filter-presets";

export function useFilterPresets() {
  const [presets, setPresets] = useStorage<FilterPreset[]>(STORAGE_KEY, []);

  function addPreset(
    name: string,
    filters: Omit<FilterPreset, "id" | "name" | "createdAt">
  ): FilterPreset {
    const preset: FilterPreset = {
      id: uuid(),
      name: name.trim(),
      createdAt: Date.now(),
      ...filters,
    };
    setPresets((prev) => [...prev, preset]);
    return preset;
  }

  function deletePreset(id: string) {
    setPresets((prev) => prev.filter((p) => p.id !== id));
  }

  function renamePreset(id: string, name: string) {
    setPresets((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim() } : p))
    );
  }

  return { presets, addPreset, deletePreset, renamePreset };
}
