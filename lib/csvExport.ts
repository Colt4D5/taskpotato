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

export function exportCSV(
  entries: TimeEntry[],
  projects: Project[],
  tasks: Task[]
): void {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  const headers = [
    "Date",
    "Start",
    "End",
    "Duration",
    "Duration (ms)",
    "Project",
    "Task",
    "Description",
    "Tags",
    "Billable",
  ];

  const rows = entries
    .filter((e) => e.stoppedAt !== null)
    .sort((a, b) => a.startedAt - b.startedAt)
    .map((e) => {
      const project = e.projectId ? projectMap.get(e.projectId) : undefined;
      const task = e.taskId ? taskMap.get(e.taskId) : undefined;
      const durationMs = elapsedMs(e.startedAt, e.stoppedAt);
      return [
        tsToISO(e.startedAt).slice(0, 10),
        tsToISO(e.startedAt),
        e.stoppedAt ? tsToISO(e.stoppedAt) : "",
        formatDurationShort(durationMs),
        String(durationMs),
        project?.name ?? "",
        task?.name ?? "",
        e.notes ?? "",
        (e.tags ?? []).join("; "),
        e.billable === false ? "No" : "Yes",
      ].map(escapeCSV).join(",");
    });

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `taskpotato-export-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
