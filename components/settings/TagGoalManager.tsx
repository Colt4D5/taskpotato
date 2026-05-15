"use client";

import { useMemo } from "react";
import { TimeEntry, AppSettings } from "@/types";

interface Props {
  entries: TimeEntry[];
  settings: AppSettings;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
}

export function TagGoalManager({ entries, settings, onUpdateSettings }: Props) {
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries) {
      for (const t of e.tags ?? []) set.add(t);
    }
    return Array.from(set).sort();
  }, [entries]);

  const tagGoals = settings.tagGoals ?? {};

  const setGoal = (tag: string, hours: number) => {
    const next = { ...tagGoals };
    if (hours <= 0) {
      delete next[tag];
    } else {
      next[tag] = hours;
    }
    onUpdateSettings({ tagGoals: next });
  };

  if (allTags.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-zinc-100 mb-1">Tag Weekly Goals</h2>
      <p className="text-sm text-zinc-500 mb-4">
        Set a target hours/week for any tag. Progress tracks in Reports under weekly mode.
      </p>
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {allTags.map((tag) => {
          const goal = tagGoals[tag] ?? 0;
          return (
            <div key={tag} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-zinc-300 font-mono">#{tag}</span>
                {goal > 0 && (
                  <span className="text-xs text-orange-400 font-medium">
                    {goal}h/wk
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={168}
                  step={0.5}
                  value={goal === 0 ? "" : goal}
                  placeholder="—"
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") {
                      setGoal(tag, 0);
                      return;
                    }
                    const v = Math.max(0, Math.min(168, parseFloat(raw) || 0));
                    setGoal(tag, v);
                  }}
                  className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder:text-zinc-600"
                />
                <span className="text-sm text-zinc-500 w-10">h/wk</span>
                {goal > 0 && (
                  <button
                    onClick={() => setGoal(tag, 0)}
                    className="text-zinc-600 hover:text-zinc-300 text-sm leading-none px-1 transition-colors"
                    title="Clear goal"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
