"use client";

import { useMemo } from "react";
import { startOfWeek } from "@/lib/dateUtils";

export type DateRange = {
  from: string; // YYYY-MM-DD or ""
  to: string;   // YYYY-MM-DD or ""
};

type Preset = {
  label: string;
  value: string;
  getRange: () => DateRange;
};

function toYMD(date: Date): string {
  return date.toLocaleDateString("en-CA");
}

function getPresets(): Preset[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thisWeekStart = startOfWeek(today, 1);
  const thisWeekEnd = new Date(thisWeekStart);
  thisWeekEnd.setDate(thisWeekStart.getDate() + 6);

  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(thisWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setDate(thisWeekStart.getDate() - 1);

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

  const last7Start = new Date(today);
  last7Start.setDate(today.getDate() - 6);

  const last30Start = new Date(today);
  last30Start.setDate(today.getDate() - 29);

  return [
    { label: "Today", value: "today", getRange: () => ({ from: toYMD(today), to: toYMD(today) }) },
    { label: "This week", value: "this-week", getRange: () => ({ from: toYMD(thisWeekStart), to: toYMD(thisWeekEnd) }) },
    { label: "Last week", value: "last-week", getRange: () => ({ from: toYMD(lastWeekStart), to: toYMD(lastWeekEnd) }) },
    { label: "Last 7 days", value: "last-7", getRange: () => ({ from: toYMD(last7Start), to: toYMD(today) }) },
    { label: "This month", value: "this-month", getRange: () => ({ from: toYMD(thisMonthStart), to: toYMD(thisMonthEnd) }) },
    { label: "Last month", value: "last-month", getRange: () => ({ from: toYMD(lastMonthStart), to: toYMD(lastMonthEnd) }) },
    { label: "Last 30 days", value: "last-30", getRange: () => ({ from: toYMD(last30Start), to: toYMD(today) }) },
  ];
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
  const presets = useMemo(() => getPresets(), []);

  const activePreset = useMemo(() => {
    if (!value.from && !value.to) return "";
    for (const p of presets) {
      const r = p.getRange();
      if (r.from === value.from && r.to === value.to) return p.value;
    }
    return "custom";
  }, [value, presets]);

  function handlePresetChange(presetValue: string) {
    if (!presetValue) {
      onChange({ from: "", to: "" });
      return;
    }
    const preset = presets.find((p) => p.value === presetValue);
    if (preset) onChange(preset.getRange());
  }

  const isActive = value.from || value.to;

  return (
    <div className="flex flex-wrap gap-2 items-center mb-2">
      {/* Preset selector */}
      <select
        value={activePreset}
        onChange={(e) => handlePresetChange(e.target.value)}
        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      >
        <option value="">All time</option>
        {presets.map((p) => (
          <option key={p.value} value={p.value}>{p.label}</option>
        ))}
        {activePreset === "custom" && <option value="custom">Custom range</option>}
      </select>

      {/* Custom date pickers — shown whenever a range is active */}
      {isActive && (
        <>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">From</span>
            <input
              type="date"
              value={value.from}
              max={value.to || undefined}
              onChange={(e) => onChange({ ...value, from: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-zinc-500">To</span>
            <input
              type="date"
              value={value.to}
              min={value.from || undefined}
              onChange={(e) => onChange({ ...value, to: e.target.value })}
              className="bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-2 text-zinc-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
        </>
      )}
    </div>
  );
}
