"use client";

import { useMemo, useEffect } from "react";
import { TimeEntry, Project, Task, Client } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";

interface PrintTimesheetModalProps {
  open: boolean;
  onClose: () => void;
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  clients: Client[];
  rangeLabel: string; // e.g. "May 5 – May 11, 2026" or "Week of May 5"
}

interface EntryRow {
  date: string;
  day: string;
  start: string;
  end: string;
  duration: number; // ms
  project: string;
  projectColor: string;
  task: string;
  notes: string;
  tags: string[];
  billable: boolean;
  hourlyRate: number | null;
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDay(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { weekday: "short" });
}

function formatMoney(usd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(usd);
}

/** Format ms as "H:MM" decimal-ish: e.g. 5400000 → "1:30" */
function formatHoursMinutes(ms: number): string {
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function PrintTimesheetModal({
  open,
  onClose,
  entries,
  projects,
  tasks,
  clients,
  rangeLabel,
}: PrintTimesheetModalProps) {
  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const rows: EntryRow[] = useMemo(() => {
    return [...entries]
      .sort((a, b) => a.startedAt - b.startedAt)
      .map((e) => {
        const project = e.projectId ? projectMap.get(e.projectId) : null;
        const task = e.taskId ? taskMap.get(e.taskId) : null;
        return {
          date: formatDate(e.startedAt),
          day: formatDay(e.startedAt),
          start: formatTime(e.startedAt),
          end: e.stoppedAt ? formatTime(e.stoppedAt) : "—",
          duration: elapsedMs(e.startedAt, e.stoppedAt),
          project: project?.name ?? "No Project",
          projectColor: project?.color ?? "#6b7280",
          task: task?.name ?? "",
          notes: e.notes ?? "",
          tags: e.tags ?? [],
          billable: e.billable !== false,
          hourlyRate: project?.hourlyRate ?? null,
        };
      });
  }, [entries, projectMap, taskMap]);

  // Summary stats
  const { totalMs, billableMs, nonBillableMs, totalEarnings, entryCount } = useMemo(() => {
    let totalMs = 0;
    let billableMs = 0;
    let nonBillableMs = 0;
    let totalEarnings = 0;

    for (const r of rows) {
      totalMs += r.duration;
      if (r.billable) {
        billableMs += r.duration;
        if (r.hourlyRate !== null) {
          totalEarnings += (r.duration / 3600000) * r.hourlyRate;
        }
      } else {
        nonBillableMs += r.duration;
      }
    }

    return { totalMs, billableMs, nonBillableMs, totalEarnings, entryCount: rows.length };
  }, [rows]);

  // Project summary for footer table
  const projectSummary = useMemo(() => {
    const map = new Map<string, { name: string; color: string; ms: number; billableMs: number; rate: number | null }>();
    for (const r of rows) {
      const key = r.project;
      if (!map.has(key)) {
        map.set(key, { name: r.project, color: r.projectColor, ms: 0, billableMs: 0, rate: r.hourlyRate });
      }
      const entry = map.get(key)!;
      entry.ms += r.duration;
      if (r.billable) entry.billableMs += r.duration;
    }
    return Array.from(map.values()).sort((a, b) => b.ms - a.ms);
  }, [rows]);

  const hasEarnings = totalEarnings > 0;
  const hasBillableSplit = rows.some((r) => !r.billable);

  if (!open) return null;

  return (
    <>
      {/* Print CSS — injected only when modal is open */}
      <style>{`
        @media print {
          body > *:not(#print-timesheet-root) { display: none !important; }
          #print-timesheet-root {
            position: fixed !important;
            inset: 0 !important;
            z-index: 9999 !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          .print-page {
            font-family: "Inter", "Helvetica Neue", Arial, sans-serif;
            color: #111;
            background: white;
            padding: 24px 32px;
            font-size: 11px;
          }
        }
      `}</style>

      {/* Overlay */}
      <div
        id="print-timesheet-root"
        className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 overflow-y-auto py-8 px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="relative w-full max-w-4xl bg-white text-zinc-900 rounded-xl shadow-2xl print-page" style={{ fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif" }}>

          {/* Close / Print buttons — hidden on print */}
          <div className="no-print flex items-center justify-between px-8 pt-6 pb-2">
            <span className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Timesheet Preview</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 9V3h12v6M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 18v3h12v-3" />
                </svg>
                Print / Save PDF
              </button>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors rounded-lg hover:bg-zinc-100"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Timesheet content */}
          <div className="px-8 pb-8 pt-2">
            {/* Header */}
            <div className="flex items-start justify-between mb-6 border-b border-zinc-200 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-orange-500 font-bold text-lg tracking-tight">TaskPotato</span>
                  <span className="text-zinc-300 text-lg">·</span>
                  <span className="text-zinc-500 text-sm font-medium">Timesheet</span>
                </div>
                <h1 className="text-2xl font-bold text-zinc-900">{rangeLabel}</h1>
              </div>

              {/* Summary chips */}
              <div className="flex flex-col items-end gap-1 mt-1">
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-zinc-500">{entryCount} {entryCount === 1 ? "entry" : "entries"}</span>
                  <span className="font-semibold text-zinc-900">{formatDurationShort(totalMs)} total</span>
                </div>
                {hasBillableSplit && (
                  <div className="flex items-center gap-3 text-xs text-zinc-500">
                    <span className="text-green-600 font-medium">{formatDurationShort(billableMs)} billable</span>
                    <span>{formatDurationShort(nonBillableMs)} non-billable</span>
                  </div>
                )}
                {hasEarnings && (
                  <div className="text-sm font-bold text-green-600">{formatMoney(totalEarnings)}</div>
                )}
              </div>
            </div>

            {/* Entry table */}
            {rows.length === 0 ? (
              <div className="text-center text-zinc-400 py-16 text-sm">No entries in this range.</div>
            ) : (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="text-left py-2 pr-3 font-semibold text-zinc-500 uppercase tracking-wide text-[10px] whitespace-nowrap w-28">Date</th>
                    <th className="text-left py-2 pr-3 font-semibold text-zinc-500 uppercase tracking-wide text-[10px] whitespace-nowrap w-24">Time</th>
                    <th className="text-left py-2 pr-3 font-semibold text-zinc-500 uppercase tracking-wide text-[10px]">Project / Task</th>
                    <th className="text-left py-2 pr-3 font-semibold text-zinc-500 uppercase tracking-wide text-[10px]">Notes</th>
                    <th className="text-right py-2 pr-3 font-semibold text-zinc-500 uppercase tracking-wide text-[10px] whitespace-nowrap w-16">Duration</th>
                    {hasEarnings && (
                      <th className="text-right py-2 font-semibold text-zinc-500 uppercase tracking-wide text-[10px] whitespace-nowrap w-20">Amount</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => {
                    const earnings = row.billable && row.hourlyRate !== null
                      ? (row.duration / 3600000) * row.hourlyRate
                      : null;

                    // Group visually by date — show date only on first row of that date
                    const showDate = i === 0 || rows[i - 1].date !== row.date;

                    return (
                      <tr
                        key={i}
                        className={`border-b transition-colors ${
                          showDate && i > 0 ? "border-t-2 border-t-zinc-100" : "border-zinc-100"
                        }`}
                      >
                        {/* Date */}
                        <td className="py-2 pr-3 align-top whitespace-nowrap">
                          {showDate && (
                            <div>
                              <div className="font-semibold text-zinc-700">{row.day}</div>
                              <div className="text-zinc-400">{row.date}</div>
                            </div>
                          )}
                        </td>
                        {/* Time */}
                        <td className="py-2 pr-3 align-top whitespace-nowrap text-zinc-500">
                          <div>{row.start}</div>
                          <div className="text-zinc-400">→ {row.end}</div>
                        </td>
                        {/* Project / Task */}
                        <td className="py-2 pr-3 align-top">
                          <div className="flex items-center gap-1.5">
                            <span
                              className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: row.projectColor }}
                            />
                            <span className="font-medium text-zinc-800">{row.project}</span>
                            {!row.billable && (
                              <span className="ml-1 text-[9px] font-medium text-zinc-400 border border-zinc-200 px-1 py-0 rounded">non-billable</span>
                            )}
                          </div>
                          {row.task && (
                            <div className="text-zinc-400 mt-0.5 ml-3.5">{row.task}</div>
                          )}
                          {row.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 ml-3.5">
                              {row.tags.map((tag) => (
                                <span key={tag} className="text-[9px] text-zinc-400 bg-zinc-100 px-1.5 py-0 rounded">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        {/* Notes */}
                        <td className="py-2 pr-3 align-top text-zinc-600 max-w-xs">
                          <div className="line-clamp-3">{row.notes || <span className="text-zinc-300">—</span>}</div>
                        </td>
                        {/* Duration */}
                        <td className="py-2 pr-3 align-top text-right font-mono font-medium text-zinc-700 whitespace-nowrap">
                          {formatHoursMinutes(row.duration)}
                        </td>
                        {/* Earnings */}
                        {hasEarnings && (
                          <td className="py-2 align-top text-right font-mono text-zinc-700 whitespace-nowrap">
                            {earnings !== null ? (
                              <span className="text-green-600 font-medium">{formatMoney(earnings)}</span>
                            ) : (
                              <span className="text-zinc-300">—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                {/* Totals row */}
                <tfoot>
                  <tr className="border-t-2 border-zinc-300 bg-zinc-50">
                    <td colSpan={hasEarnings ? 4 : 3} className="py-2.5 pr-3 font-semibold text-zinc-700 text-xs">
                      Total
                    </td>
                    <td className="py-2.5 pr-3 text-right font-mono font-bold text-zinc-900 whitespace-nowrap">
                      {formatHoursMinutes(totalMs)}
                    </td>
                    {hasEarnings && (
                      <td className="py-2.5 text-right font-mono font-bold text-green-700 whitespace-nowrap">
                        {formatMoney(totalEarnings)}
                      </td>
                    )}
                  </tr>
                </tfoot>
              </table>
            )}

            {/* Project summary section */}
            {projectSummary.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Summary by Project</h2>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200">
                      <th className="text-left py-1.5 pr-4 font-semibold text-zinc-500 uppercase tracking-wide text-[10px]">Project</th>
                      <th className="text-right py-1.5 pr-4 font-semibold text-zinc-500 uppercase tracking-wide text-[10px]">Total</th>
                      {hasBillableSplit && (
                        <th className="text-right py-1.5 pr-4 font-semibold text-zinc-500 uppercase tracking-wide text-[10px]">Billable</th>
                      )}
                      {hasEarnings && (
                        <th className="text-right py-1.5 font-semibold text-zinc-500 uppercase tracking-wide text-[10px]">Earned</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {projectSummary.map((p) => {
                      const earned = p.rate !== null ? (p.billableMs / 3600000) * p.rate : null;
                      return (
                        <tr key={p.name} className="border-b border-zinc-100">
                          <td className="py-2 pr-4">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                              <span className="font-medium text-zinc-800">{p.name}</span>
                            </div>
                          </td>
                          <td className="py-2 pr-4 text-right font-mono text-zinc-700">{formatHoursMinutes(p.ms)}</td>
                          {hasBillableSplit && (
                            <td className="py-2 pr-4 text-right font-mono text-zinc-500">{formatHoursMinutes(p.billableMs)}</td>
                          )}
                          {hasEarnings && (
                            <td className="py-2 text-right font-mono">
                              {earned !== null ? (
                                <span className="text-green-600 font-medium">{formatMoney(earned)}</span>
                              ) : (
                                <span className="text-zinc-300">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-zinc-300">
                      <td className="py-2 pr-4 font-semibold text-zinc-700">Total</td>
                      <td className="py-2 pr-4 text-right font-mono font-bold text-zinc-900">{formatHoursMinutes(totalMs)}</td>
                      {hasBillableSplit && (
                        <td className="py-2 pr-4 text-right font-mono font-bold text-zinc-900">{formatHoursMinutes(billableMs)}</td>
                      )}
                      {hasEarnings && (
                        <td className="py-2 text-right font-mono font-bold text-green-700">{formatMoney(totalEarnings)}</td>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
              <span>Generated by TaskPotato · {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
              <span>taskpotato · local-first time tracking</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
