import { TimeEntry, Project, Task } from "@/types";
import { elapsedMs, formatDurationShort } from "./duration";

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function tsToISO(ms: number): string {
  return new Date(ms).toISOString();
}

const HEADERS = [
  "Date",
  "Start",
  "End",
  "Duration",
  "Duration (ms)",
  "Project",
  "Client",
  "Task",
  "Description",
  "Tags",
  "Billable",
];

function buildRows(
  entries: TimeEntry[],
  projectMap: Map<string, Project>,
  taskMap: Map<string, Task>,
  clientMap?: Map<string, string>
): string[] {
  return entries
    .filter((e) => e.stoppedAt !== null)
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((e) => {
      const project = e.projectId ? projectMap.get(e.projectId) : undefined;
      const task = e.taskId ? taskMap.get(e.taskId) : undefined;
      const clientName = project?.clientId && clientMap ? (clientMap.get(project.clientId) ?? "") : "";
      const durationMs = elapsedMs(e.startedAt, e.stoppedAt);
      return [
        tsToISO(e.startedAt).slice(0, 10),
        tsToISO(e.startedAt),
        e.stoppedAt ? tsToISO(e.stoppedAt) : "",
        formatDurationShort(durationMs),
        String(durationMs),
        project?.name ?? "",
        clientName,
        task?.name ?? "",
        e.notes ?? "",
        (e.tags ?? []).join("; "),
        e.billable === false ? "No" : "Yes",
      ]
        .map(escapeCSV)
        .join(",");
    });
}

function triggerDownload(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Full export — all completed entries (used by Settings page). */
export function exportCSV(
  entries: TimeEntry[],
  projects: Project[],
  tasks: Task[]
): void {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const rows = buildRows(entries, projectMap, taskMap);
  const csv = [HEADERS.join(","), ...rows].join("\n");
  triggerDownload(csv, `taskpotato-export-${new Date().toISOString().slice(0, 10)}.csv`);
}

/**
 * Filtered export — used by the Log page to export exactly what is currently
 * filtered/displayed. Accepts Client data so the Client column is populated.
 */
export function exportFilteredCSV(options: {
  entries: TimeEntry[];
  projects: Project[];
  tasks: Task[];
  /** Client name lookup: clientId → client name */
  clientNames?: Map<string, string>;
  /** Optional range label used in the filename, e.g. "2026-05-01_2026-05-11" */
  rangeLabel?: string;
}): void {
  const { entries, projects, tasks, clientNames, rangeLabel } = options;
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));
  const rows = buildRows(entries, projectMap, taskMap, clientNames);
  const csv = [HEADERS.join(","), ...rows].join("\n");
  const suffix = rangeLabel ? `_${rangeLabel}` : `_${new Date().toISOString().slice(0, 10)}`;
  triggerDownload(csv, `taskpotato-filtered${suffix}.csv`);
}
