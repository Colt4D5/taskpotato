"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  computeStandupSummary,
  formatStandupText,
  StandupPeriod,
  StandupFormat,
  StandupProjectGroup,
} from "@/lib/standupSummary";
import { TimeEntry, Project, Task } from "@/types";
import { formatDurationShort } from "@/lib/duration";

interface StandupSummaryModalProps {
  open: boolean;
  onClose: () => void;
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
}

const PERIOD_OPTIONS: { value: StandupPeriod; label: string }[] = [
  { value: "yesterday", label: "Yesterday" },
  { value: "today", label: "Today" },
  { value: "yesterday+today", label: "Yesterday + Today" },
];

const FORMAT_OPTIONS: { value: StandupFormat; label: string; hint: string }[] = [
  { value: "markdown", label: "Markdown", hint: "GitHub, Linear, Notion" },
  { value: "bullets", label: "Plain bullets", hint: "Email, plain text" },
  { value: "slack", label: "Slack / Discord", hint: "Bold + bullet syntax" },
];

function GroupPreview({ group }: { group: StandupProjectGroup }) {
  const color = group.projectColor ?? "#52525b";
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-2">
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-medium text-zinc-200">
          {group.projectName ?? "No project"}
        </span>
        <span className="text-xs text-zinc-500 font-mono ml-auto">
          {formatDurationShort(group.totalMs)}
        </span>
      </div>
      <div className="flex flex-col gap-0.5 ml-4">
        {group.entries.map((e) => {
          const clean = e.description
            .replace(/<!--\s*session-annotations[\s\S]*?-->/g, "")
            .trim();
          return (
            <div key={e.id} className="flex items-start gap-1.5">
              <span className="text-zinc-600 mt-0.5 leading-none">•</span>
              <span className="text-xs text-zinc-400 leading-relaxed">{clean || "(no description)"}</span>
              <span className="text-xs text-zinc-600 font-mono ml-auto whitespace-nowrap">
                {formatDurationShort(e.durationMs)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function StandupSummaryModal({
  open,
  onClose,
  entries,
  projects,
  tasks,
}: StandupSummaryModalProps) {
  const [period, setPeriod] = useState<StandupPeriod>("yesterday");
  const [format, setFormat] = useState<StandupFormat>("slack");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "text">("preview");

  const summaryData = useMemo(
    () => computeStandupSummary(entries, projects, tasks, period),
    [entries, projects, tasks, period]
  );

  const formattedText = useMemo(
    () => formatStandupText(summaryData, format),
    [summaryData, format]
  );

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(formattedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select textarea
    }
  }, [formattedText]);

  // Keyboard: Esc closes
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const isEmpty = summaryData.sections.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-xl mx-4 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-zinc-100">Stand-up Summary</span>
            {!isEmpty && (
              <span className="text-xs text-zinc-500 font-mono">
                {formatDurationShort(summaryData.totalMs)} · {summaryData.entryCount} {summaryData.entryCount === 1 ? "entry" : "entries"}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 px-5 py-4 border-b border-zinc-800 flex-shrink-0">
          {/* Period selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-14 flex-shrink-0">Period</span>
            <div className="flex gap-1.5 flex-wrap">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPeriod(opt.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    period === opt.value
                      ? "bg-orange-500 text-white"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 w-14 flex-shrink-0">Format</span>
            <div className="flex gap-1.5 flex-wrap">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFormat(opt.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                    format === opt.value
                      ? "bg-zinc-600 text-zinc-100"
                      : "bg-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700"
                  }`}
                  title={opt.hint}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex px-5 pt-3 gap-4 border-b border-zinc-800 flex-shrink-0">
          {(["preview", "text"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 text-xs font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-orange-400 border-orange-500"
                  : "text-zinc-500 border-transparent hover:text-zinc-300"
              }`}
            >
              {tab === "preview" ? "Preview" : "Raw text"}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-32 text-zinc-500 text-sm">
              <span className="text-2xl mb-2">🕳</span>
              No entries found for {period === "yesterday+today" ? "yesterday or today" : period}.
            </div>
          ) : activeTab === "preview" ? (
            <div className="flex flex-col gap-4">
              {summaryData.sections.map((section) => (
                <div key={section.dateKey} className="flex flex-col gap-3">
                  {summaryData.sections.length > 1 && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        {section.label}
                      </span>
                      <span className="text-xs text-zinc-600 font-mono">
                        {formatDurationShort(section.totalMs)}
                      </span>
                      <div className="flex-1 h-px bg-zinc-800" />
                    </div>
                  )}
                  {section.groups.map((group) => (
                    <GroupPreview key={group.projectId ?? "__none__"} group={group} />
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <textarea
              readOnly
              value={formattedText}
              className="w-full h-full min-h-[200px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-3 text-sm text-zinc-300 font-mono resize-none focus:outline-none focus:ring-2 focus:ring-orange-500/40"
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 pb-5 pt-3 border-t border-zinc-800 flex-shrink-0">
          <p className="text-xs text-zinc-600">Click the text area to select all · Esc to close</p>
          <button
            onClick={handleCopy}
            disabled={isEmpty}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              copied
                ? "bg-emerald-600 text-white"
                : "bg-orange-500 hover:bg-orange-400 text-white"
            }`}
          >
            {copied ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy to clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
