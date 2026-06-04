/**
 * CSV Import for TaskPotato.
 *
 * Supports:
 *   - TaskPotato re-import (full ISO timestamps in Start/End columns)
 *   - Toggl-style: separate Date + Start time + End time columns
 *   - Clockify-style: "Start Date" / "Start Time" / "End Date" / "End Time"
 *   - Any format where Start is a parseable timestamp and End is too,
 *     OR Start + Date (time-only) + Duration (ms/h) as a fallback for End
 */

import { TimeEntry, Project, Task } from "@/types";
import { uuid } from "./uuid";

// ---------------------------------------------------------------------------
// Column alias map — maps lower-cased header names to canonical field keys
// ---------------------------------------------------------------------------
const COL_ALIASES: Record<string, string> = {
  // Start
  start: "start",
  "start time": "start",
  "start date": "start_date",   // Clockify pattern (separate date/time)
  started: "start",
  "started at": "start",
  started_at: "start",
  // End
  end: "end",
  "end time": "end",
  "end date": "end_date",
  stop: "end",
  stopped: "end",
  "stopped at": "end",
  stopped_at: "end",
  finish: "end",
  // Date context (Toggl: "Start date" for date + separate time column)
  date: "date",
  // Duration fallback
  "duration (ms)": "duration_ms",
  "duration_ms": "duration_ms",
  "duration ms": "duration_ms",
  duration: "duration_human",
  "duration (h)": "duration_h",  // Clockify
  // Project
  project: "project",
  "project name": "project",
  "project (name)": "project",
  // Client
  client: "client",
  "client name": "client",
  "client (name)": "client",
  // Task
  task: "task",
  "task name": "task",
  "task (name)": "task",
  // Description / notes
  description: "notes",
  notes: "notes",
  note: "notes",
  memo: "notes",
  activity: "notes",
  // Tags
  tags: "tags",
  tag: "tags",
  labels: "tags",
  // Billable
  billable: "billable",
  "is billable": "billable",
  "billable?": "billable",
  "billable (yes/no)": "billable",
};

// ---------------------------------------------------------------------------
// CSV parser — handles quoted fields and CRLF/LF line endings
// ---------------------------------------------------------------------------
export function parseCSVText(text: string): string[][] {
  const rows: string[][] = [];
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];
    if (inQuotes) {
      if (ch === '"') {
        // Peek ahead for escaped quote
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      field = "";
      if (row.some((c) => c.trim() !== "")) {
        rows.push(row);
      }
      row = [];
    } else {
      field += ch;
    }
  }
  // Last field
  row.push(field);
  if (row.some((c) => c.trim() !== "")) rows.push(row);

  return rows;
}

// ---------------------------------------------------------------------------
// Timestamp parsing
// ---------------------------------------------------------------------------

/** Parse an ISO timestamp or various date/time string formats to ms epoch.
 *  Returns null if unparseable.
 */
function parseTimestamp(raw: string, dateContext?: string): number | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();

  // Full ISO timestamp (with or without Z/offset): "2026-05-01T10:00:00.000Z"
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(s)) {
    const ts = Date.parse(s);
    return isNaN(ts) ? null : ts;
  }

  // Space-separated datetime: "2026-05-01 10:00:00" or "2026-05-01 10:00"
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(s)) {
    // Treat as local time by converting the space to T
    const ts = Date.parse(s.replace(" ", "T"));
    return isNaN(ts) ? null : ts;
  }

  // Date-only: "2026-05-01" → midnight local
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, mo, d] = s.split("-").map(Number);
    return new Date(y, mo - 1, d, 0, 0, 0, 0).getTime();
  }

  // Time-only: "10:00:00" or "10:00" — needs dateContext (YYYY-MM-DD)
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s) && dateContext) {
    const parts = s.split(":").map(Number);
    const h = parts[0];
    const m = parts[1];
    const sec = parts[2] ?? 0;
    const [y, mo, d] = dateContext.split("-").map(Number);
    return new Date(y, mo - 1, d, h, m, sec, 0).getTime();
  }

  return null;
}

/** Parse a Clockify/human-readable duration string like "0:30:00" or "1:02:30"
 *  to milliseconds. Returns null if unparseable.
 */
function parseDurationH(raw: string): number | null {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  const parts = s.split(":").map(Number);
  if (parts.some(isNaN)) return null;
  if (parts.length === 3) {
    const [h, m, sec] = parts;
    return (h * 3600 + m * 60 + sec) * 1000;
  }
  if (parts.length === 2) {
    const [h, m] = parts;
    return (h * 60 + m) * 60 * 1000;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Types for import pipeline
// ---------------------------------------------------------------------------

export interface CSVImportRow {
  rowIndex: number;
  startMs: number | null;
  endMs: number | null;
  notes: string;
  projectName: string;
  clientName: string;
  taskName: string;
  tags: string[];
  billable: boolean;
  /** Error message if this row cannot be imported */
  error?: string;
}

export interface CSVImportAnalysis {
  /** All parsed rows (including errored ones) */
  rows: CSVImportRow[];
  /** Rows that are valid and ready to import */
  validRows: CSVImportRow[];
  /** How many rows had parse/validation errors */
  errorCount: number;
  /** New project names that would be created on import */
  newProjectNames: string[];
  /** Existing project names that were matched */
  matchedProjectNames: string[];
  /** First 10 valid rows for preview display */
  previewRows: CSVImportRow[];
  /** Total data rows found (excluding header) */
  totalRows: number;
  /** Whether we could identify the required columns */
  columnsOk: boolean;
  /** Human-readable description of what went wrong at the column level */
  columnError?: string;
}

export interface CSVImportOutput {
  entries: TimeEntry[];
  newProjects: Project[];
  newTasks: Task[];
}

// ---------------------------------------------------------------------------
// Analysis — parse and validate without writing anything
// ---------------------------------------------------------------------------

export function analyzeCSV(
  text: string,
  existingProjects: Project[],
  existingTasks: Task[]
): CSVImportAnalysis {
  const raw = parseCSVText(text);
  if (raw.length < 2) {
    return {
      rows: [],
      validRows: [],
      errorCount: 0,
      newProjectNames: [],
      matchedProjectNames: [],
      previewRows: [],
      totalRows: 0,
      columnsOk: false,
      columnError: "File appears empty or has no data rows.",
    };
  }

  // Map headers to canonical keys
  const headerRow = raw[0].map((h) => h.trim());
  const colMap: Record<string, number> = {};
  for (let i = 0; i < headerRow.length; i++) {
    const alias = COL_ALIASES[headerRow[i].toLowerCase()];
    if (alias && !(alias in colMap)) {
      colMap[alias] = i;
    }
  }

  // Validate required columns
  const hasStart = "start" in colMap;
  const hasEnd = "end" in colMap;
  const hasDate = "date" in colMap;
  const hasStartDate = "start_date" in colMap;
  const hasEndDate = "end_date" in colMap;
  const hasDurationMs = "duration_ms" in colMap;
  const hasDurationH = "duration_h" in colMap;

  // We need at least a start time and either end time or duration
  const canParseTime = hasStart || hasStartDate;
  if (!canParseTime) {
    return {
      rows: [],
      validRows: [],
      errorCount: 0,
      newProjectNames: [],
      matchedProjectNames: [],
      previewRows: [],
      totalRows: raw.length - 1,
      columnsOk: false,
      columnError:
        "Could not find a Start time column. Expected a header named: Start, Start Time, or Start Date.",
    };
  }

  // Existing project lookup (case-insensitive by name)
  const existingProjectByName = new Map(
    existingProjects.map((p) => [p.name.toLowerCase(), p])
  );
  const existingTaskByProjectAndName = new Map(
    existingTasks.map((t) => [`${t.projectId}::${t.name.toLowerCase()}`, t])
  );

  const rows: CSVImportRow[] = [];

  for (let ri = 1; ri < raw.length; ri++) {
    const cells = raw[ri];
    const get = (key: string): string => {
      const idx = colMap[key];
      return idx !== undefined && idx < cells.length ? (cells[idx] ?? "").trim() : "";
    };

    // --- Parse start timestamp ---
    let startMs: number | null = null;
    if (hasStart) {
      const startVal = get("start");
      const dateCtx = hasDate ? get("date") : undefined;
      startMs = parseTimestamp(startVal, dateCtx);
    } else if (hasStartDate) {
      // Clockify: separate "Start Date" and "Start" columns for time
      const dateVal = get("start_date");
      const timeVal = get("start");
      startMs = timeVal
        ? parseTimestamp(timeVal, dateVal || undefined)
        : parseTimestamp(dateVal);
    }

    // --- Parse end timestamp ---
    let endMs: number | null = null;
    if (hasEnd) {
      const endVal = get("end");
      // For Clockify end date context
      const endDateCtx = hasEndDate
        ? get("end_date")
        : hasDate
        ? get("date")
        : undefined;
      // If end looks time-only, use the date context
      endMs = parseTimestamp(endVal, endDateCtx || undefined);
    } else if (hasDurationMs) {
      const dms = Number(get("duration_ms"));
      if (!isNaN(dms) && dms > 0 && startMs !== null) {
        endMs = startMs + dms;
      }
    } else if (hasDurationH) {
      const dur = parseDurationH(get("duration_h"));
      if (dur !== null && dur > 0 && startMs !== null) {
        endMs = startMs + dur;
      }
    }

    // --- Parse metadata ---
    const notes = get("notes");
    const projectName = get("project");
    const clientName = get("client");
    const taskName = get("task");
    const tagRaw = get("tags");
    const tags = tagRaw
      ? tagRaw
          .split(/[;,|]/)
          .map((t) => t.trim().toLowerCase())
          .filter(Boolean)
      : [];
    const billableRaw = get("billable").toLowerCase();
    const billable = billableRaw !== "no" && billableRaw !== "false" && billableRaw !== "0";

    // --- Validate ---
    let error: string | undefined;
    if (startMs === null) {
      error = "Could not parse start time";
    } else if (endMs === null) {
      error = "Could not parse end time (and no duration fallback)";
    } else if (endMs <= startMs) {
      error = `End time is before or equal to start time`;
    }

    rows.push({
      rowIndex: ri,
      startMs,
      endMs,
      notes,
      projectName,
      clientName,
      taskName,
      tags,
      billable,
      error,
    });
  }

  const validRows = rows.filter((r) => !r.error);
  const errorCount = rows.length - validRows.length;

  // Determine new vs matched projects
  const seenProjectNames = new Set<string>();
  const newProjectNames: string[] = [];
  const matchedProjectNames: string[] = [];

  for (const row of validRows) {
    const pname = row.projectName;
    if (!pname || seenProjectNames.has(pname.toLowerCase())) continue;
    seenProjectNames.add(pname.toLowerCase());
    if (existingProjectByName.has(pname.toLowerCase())) {
      matchedProjectNames.push(pname);
    } else {
      newProjectNames.push(pname);
    }
  }

  // Suppress unused var warning
  void existingTaskByProjectAndName;

  return {
    rows,
    validRows,
    errorCount,
    newProjectNames,
    matchedProjectNames,
    previewRows: validRows.slice(0, 10),
    totalRows: rows.length,
    columnsOk: true,
  };
}

// ---------------------------------------------------------------------------
// Build import output — create entries + any new projects/tasks
// ---------------------------------------------------------------------------

const PROJECT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
  "#f43f5e", "#06b6d4", "#a3e635", "#fb923c",
];

let colorCursor = 0;
function nextColor(): string {
  return PROJECT_COLORS[colorCursor++ % PROJECT_COLORS.length];
}

export function buildImportOutput(
  validRows: CSVImportRow[],
  existingProjects: Project[],
  existingTasks: Task[]
): CSVImportOutput {
  // Reset color cursor per call for determinism
  colorCursor = 0;

  // Build lookup maps
  const projectByName = new Map<string, Project>(
    existingProjects.map((p) => [p.name.toLowerCase(), p])
  );
  const taskByProjectAndName = new Map<string, Task>(
    existingTasks.map((t) => [`${t.projectId}::${t.name.toLowerCase()}`, t])
  );

  const newProjects: Project[] = [];
  const newTasks: Task[] = [];
  const entries: TimeEntry[] = [];

  for (const row of validRows) {
    if (row.startMs === null || row.endMs === null) continue;

    // Resolve or create project
    let project: Project | undefined;
    if (row.projectName) {
      const key = row.projectName.toLowerCase();
      project = projectByName.get(key);
      if (!project) {
        project = {
          id: uuid(),
          name: row.projectName,
          color: nextColor(),
          archived: false,
          createdAt: Date.now(),
        };
        projectByName.set(key, project);
        newProjects.push(project);
      }
    }

    // Resolve or create task
    let task: Task | undefined;
    if (row.taskName && project) {
      const taskKey = `${project.id}::${row.taskName.toLowerCase()}`;
      task = taskByProjectAndName.get(taskKey);
      if (!task) {
        task = {
          id: uuid(),
          projectId: project.id,
          name: row.taskName,
          notes: "",
          archived: false,
          createdAt: Date.now(),
        };
        taskByProjectAndName.set(taskKey, task);
        newTasks.push(task);
      }
    }

    const entry: TimeEntry = {
      id: uuid(),
      projectId: project?.id ?? null,
      taskId: task?.id ?? null,
      startedAt: row.startMs,
      stoppedAt: row.endMs,
      notes: row.notes,
      tags: row.tags,
      billable: row.billable,
    };
    entries.push(entry);
  }

  return { entries, newProjects, newTasks };
}
