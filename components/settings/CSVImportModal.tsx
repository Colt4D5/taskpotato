"use client";

import { useRef, useState, useCallback } from "react";
import { Project, Task, TimeEntry } from "@/types";
import {
  analyzeCSV,
  buildImportOutput,
  CSVImportAnalysis,
  CSVImportRow,
} from "@/lib/csvImport";
import { formatDurationShort } from "@/lib/duration";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface CSVImportModalProps {
  open: boolean;
  onClose: () => void;
  existingProjects: Project[];
  existingTasks: Task[];
  onImport: (entries: TimeEntry[], newProjects: Project[], newTasks: Task[]) => void;
}

type Step = "upload" | "preview" | "success";

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeShort(ms: number): string {
  return new Date(ms).toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PreviewRow({ row }: { row: CSVImportRow }) {
  const duration =
    row.startMs !== null && row.endMs !== null
      ? formatDurationShort(row.endMs - row.startMs)
      : "—";

  return (
    <tr className="border-t border-zinc-800 hover:bg-zinc-800/40">
      <td className="px-3 py-2 text-xs text-zinc-400 whitespace-nowrap">
        {row.startMs !== null ? formatDate(row.startMs) : "—"}
      </td>
      <td className="px-3 py-2 text-xs text-zinc-400 whitespace-nowrap">
        {row.startMs !== null && row.endMs !== null
          ? `${formatTimeShort(row.startMs)} – ${formatTimeShort(row.endMs)}`
          : "—"}
      </td>
      <td className="px-3 py-2 text-xs font-mono text-orange-300">{duration}</td>
      <td className="px-3 py-2 text-xs text-zinc-300 max-w-[160px] truncate">
        {row.notes || <span className="italic text-zinc-600">no description</span>}
      </td>
      <td className="px-3 py-2 text-xs text-zinc-400 truncate max-w-[100px]">
        {row.projectName || <span className="italic text-zinc-600">—</span>}
      </td>
      <td className="px-3 py-2 text-xs">
        {row.billable ? (
          <span className="text-green-500">●</span>
        ) : (
          <span className="text-zinc-600">○</span>
        )}
      </td>
    </tr>
  );
}

export function CSVImportModal({
  open,
  onClose,
  existingProjects,
  existingTasks,
  onImport,
}: CSVImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState<string>("");
  const [analysis, setAnalysis] = useState<CSVImportAnalysis | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [showErrors, setShowErrors] = useState(false);

  const reset = useCallback(() => {
    setStep("upload");
    setFileName("");
    setAnalysis(null);
    setImportError(null);
    setShowErrors(false);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  const handleFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setImportError(null);
      setFileName(file.name);

      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const text = ev.target?.result as string;
          if (!text || !text.trim()) {
            setImportError("File is empty.");
            return;
          }
          const result = analyzeCSV(text, existingProjects, existingTasks);
          setAnalysis(result);
          setStep("preview");
        } catch {
          setImportError("Failed to parse CSV. Ensure the file is valid UTF-8 text.");
        }
      };
      reader.onerror = () => setImportError("Could not read the file.");
      reader.readAsText(file);

      // Allow re-selecting the same file
      e.target.value = "";
    },
    [existingProjects, existingTasks]
  );

  const handleImport = useCallback(() => {
    if (!analysis) return;
    try {
      const { entries, newProjects, newTasks } = buildImportOutput(
        analysis.validRows,
        existingProjects,
        existingTasks
      );
      onImport(entries, newProjects, newTasks);
      setImportedCount(entries.length);
      setStep("success");
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : "Import failed unexpectedly."
      );
    }
  }, [analysis, existingProjects, existingTasks, onImport]);

  return (
    <Modal open={open} onClose={handleClose} className="max-w-2xl">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-100">Import from CSV</h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Supports TaskPotato, Toggl, Clockify, and generic CSV exports.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-xl leading-none"
          >
            ×
          </button>
        </div>

        {/* ─── Upload step ─────────────────────────────────────────── */}
        {step === "upload" && (
          <div>
            <div
              className="border-2 border-dashed border-zinc-700 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-colors"
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && fileRef.current) {
                  const dt = new DataTransfer();
                  dt.items.add(file);
                  fileRef.current.files = dt.files;
                  fileRef.current.dispatchEvent(new Event("change", { bubbles: true }));
                }
              }}
            >
              <svg
                className="w-10 h-10 text-zinc-600 mb-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-sm text-zinc-300 font-medium mb-1">
                Click to select a CSV file
              </p>
              <p className="text-xs text-zinc-600">or drag and drop it here</p>
            </div>

            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile}
            />

            {importError && (
              <p className="mt-3 text-sm text-red-400">{importError}</p>
            )}

            {/* Supported formats hint */}
            <div className="mt-6 bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <p className="text-xs font-medium text-zinc-400 mb-2">
                Recognized column names
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-zinc-600">
                <span>
                  <span className="text-zinc-400">Start time:</span> Start, Start Time, Start Date
                </span>
                <span>
                  <span className="text-zinc-400">End time:</span> End, End Time, End Date, Stop
                </span>
                <span>
                  <span className="text-zinc-400">Duration:</span> Duration (ms), Duration (h)
                </span>
                <span>
                  <span className="text-zinc-400">Project:</span> Project, Project Name
                </span>
                <span>
                  <span className="text-zinc-400">Task:</span> Task, Task Name
                </span>
                <span>
                  <span className="text-zinc-400">Notes:</span> Description, Notes, Activity
                </span>
                <span>
                  <span className="text-zinc-400">Tags:</span> Tags (semicolon-separated)
                </span>
                <span>
                  <span className="text-zinc-400">Billable:</span> Billable, Is Billable
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ─── Preview step ─────────────────────────────────────────── */}
        {step === "preview" && analysis && (
          <div>
            {/* Column error */}
            {!analysis.columnsOk && (
              <div className="bg-red-900/30 border border-red-800 rounded-xl p-4 mb-4">
                <p className="text-sm font-medium text-red-400 mb-1">
                  Column detection failed
                </p>
                <p className="text-xs text-red-300">{analysis.columnError}</p>
              </div>
            )}

            {/* Stats strip */}
            {analysis.columnsOk && (
              <div className="flex items-center gap-4 mb-4 flex-wrap">
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-center min-w-[72px]">
                  <p className="text-lg font-semibold text-orange-400">
                    {analysis.validRows.length}
                  </p>
                  <p className="text-xs text-zinc-500">will import</p>
                </div>
                {analysis.errorCount > 0 && (
                  <div className="bg-zinc-900 border border-red-800/50 rounded-lg px-3 py-2 text-center min-w-[72px]">
                    <p className="text-lg font-semibold text-red-400">
                      {analysis.errorCount}
                    </p>
                    <p className="text-xs text-zinc-500">skipped</p>
                  </div>
                )}
                {analysis.newProjectNames.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-center min-w-[72px]">
                    <p className="text-lg font-semibold text-blue-400">
                      {analysis.newProjectNames.length}
                    </p>
                    <p className="text-xs text-zinc-500">new projects</p>
                  </div>
                )}
                {analysis.matchedProjectNames.length > 0 && (
                  <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-center min-w-[72px]">
                    <p className="text-lg font-semibold text-green-400">
                      {analysis.matchedProjectNames.length}
                    </p>
                    <p className="text-xs text-zinc-500">matched</p>
                  </div>
                )}
                <div className="ml-auto text-right">
                  <p className="text-xs text-zinc-500">{fileName}</p>
                  <button
                    onClick={reset}
                    className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-0.5"
                  >
                    Change file
                  </button>
                </div>
              </div>
            )}

            {/* New projects notice */}
            {analysis.newProjectNames.length > 0 && (
              <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl px-4 py-3 mb-4">
                <p className="text-xs font-medium text-blue-400 mb-1">
                  New projects will be created
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {analysis.newProjectNames.map((n) => (
                    <span
                      key={n}
                      className="text-xs bg-blue-900/40 text-blue-300 px-2 py-0.5 rounded-full"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Skipped rows */}
            {analysis.errorCount > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => setShowErrors((v) => !v)}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                >
                  <span>{showErrors ? "▾" : "▸"}</span>
                  {analysis.errorCount} row
                  {analysis.errorCount !== 1 ? "s" : ""} will be skipped (click to{" "}
                  {showErrors ? "hide" : "show"})
                </button>
                {showErrors && (
                  <div className="mt-2 bg-red-900/20 border border-red-800/40 rounded-xl p-3 space-y-1">
                    {analysis.rows
                      .filter((r) => r.error)
                      .map((r) => (
                        <p key={r.rowIndex} className="text-xs text-red-300">
                          Row {r.rowIndex}: {r.error}
                          {r.notes ? ` — "${r.notes.slice(0, 40)}"` : ""}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Preview table */}
            {analysis.columnsOk && analysis.validRows.length > 0 && (
              <div>
                <p className="text-xs text-zinc-500 mb-2">
                  Preview — first {Math.min(analysis.validRows.length, 10)} of{" "}
                  {analysis.validRows.length} valid entries
                </p>
                <div className="overflow-x-auto rounded-xl border border-zinc-800">
                  <table className="w-full text-left min-w-[520px]">
                    <thead>
                      <tr className="bg-zinc-900">
                        <th className="px-3 py-2 text-xs font-medium text-zinc-500">Date</th>
                        <th className="px-3 py-2 text-xs font-medium text-zinc-500">Time</th>
                        <th className="px-3 py-2 text-xs font-medium text-zinc-500">Dur.</th>
                        <th className="px-3 py-2 text-xs font-medium text-zinc-500">
                          Description
                        </th>
                        <th className="px-3 py-2 text-xs font-medium text-zinc-500">Project</th>
                        <th className="px-3 py-2 text-xs font-medium text-zinc-500">Bill.</th>
                      </tr>
                    </thead>
                    <tbody className="bg-zinc-900/50">
                      {analysis.previewRows.map((row) => (
                        <PreviewRow key={row.rowIndex} row={row} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {importError && (
              <p className="mt-3 text-sm text-red-400">{importError}</p>
            )}

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" size="sm" onClick={reset}>
                ← Back
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={handleClose}>
                  Cancel
                </Button>
                <button
                  onClick={handleImport}
                  disabled={!analysis.columnsOk || analysis.validRows.length === 0}
                  className="px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  Import {analysis.validRows.length} entr
                  {analysis.validRows.length === 1 ? "y" : "ies"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── Success step ─────────────────────────────────────────── */}
        {step === "success" && (
          <div className="text-center py-8">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-xl font-semibold text-zinc-100 mb-2">
              Import complete
            </h3>
            <p className="text-zinc-400 text-sm">
              {importedCount} entr{importedCount === 1 ? "y" : "ies"} added to your
              log.
            </p>
            <p className="text-zinc-600 text-xs mt-2">
              They are now visible in the Log and Reports pages.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="ghost" size="sm" onClick={reset}>
                Import another file
              </Button>
              <Button variant="primary" size="sm" onClick={handleClose}>
                Done
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
