import { TimeEntry, Project, Task } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";

export type StandupPeriod = "yesterday" | "today" | "yesterday+today";
export type StandupFormat = "markdown" | "bullets" | "slack";

export interface StandupEntry {
  id: string;
  description: string;
  projectName: string | null;
  projectColor: string | null;
  taskName: string | null;
  tags: string[];
  durationMs: number;
  billable: boolean;
}

export interface StandupProjectGroup {
  projectId: string | null;
  projectName: string | null;
  projectColor: string | null;
  entries: StandupEntry[];
  totalMs: number;
}

export interface StandupDaySection {
  /** "Today", "Yesterday", or a formatted date */
  label: string;
  dateKey: string;
  groups: StandupProjectGroup[];
  totalMs: number;
}

export interface StandupSummaryData {
  sections: StandupDaySection[];
  totalMs: number;
  entryCount: number;
  period: StandupPeriod;
}

/** YYYY-MM-DD in local timezone */
function toDateKey(ms: number): string {
  return new Date(ms).toLocaleDateString("en-CA");
}

function todayDateKey(): string {
  return toDateKey(Date.now());
}

function yesterdayDateKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toLocaleDateString("en-CA");
}

function humanLabel(dateKey: string): string {
  const today = todayDateKey();
  const yesterday = yesterdayDateKey();
  if (dateKey === today) return "Today";
  if (dateKey === yesterday) return "Yesterday";
  // Format as "Mon Jun 30"
  const [y, m, day] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function computeStandupSummary(
  entries: TimeEntry[],
  projects: Project[],
  tasks: Task[],
  period: StandupPeriod
): StandupSummaryData {
  const projectMap = new Map(projects.map((p) => [p.id, p]));
  const taskMap = new Map(tasks.map((t) => [t.id, t]));

  // Determine which date keys to include
  const targetKeys = new Set<string>();
  if (period === "yesterday" || period === "yesterday+today") {
    targetKeys.add(yesterdayDateKey());
  }
  if (period === "today" || period === "yesterday+today") {
    targetKeys.add(todayDateKey());
  }

  // Filter entries to target dates, completed only
  const relevant = entries.filter(
    (e) => e.stoppedAt !== null && targetKeys.has(toDateKey(e.startedAt))
  );

  // Group by date, then by project
  const byDate = new Map<string, typeof relevant>();
  for (const e of relevant) {
    const key = toDateKey(e.startedAt);
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(e);
  }

  const sections: StandupDaySection[] = [];
  // Emit sections in date order (oldest first for "yesterday+today" — natural standup order)
  const sortedKeys = Array.from(targetKeys).sort();
  let grandTotalMs = 0;
  let grandEntryCount = 0;

  for (const dateKey of sortedKeys) {
    const dayEntries = byDate.get(dateKey) ?? [];
    if (dayEntries.length === 0) continue;

    // Group by project within the day
    const byProject = new Map<string | null, typeof dayEntries>();
    for (const e of dayEntries) {
      const pid = e.projectId ?? null;
      if (!byProject.has(pid)) byProject.set(pid, []);
      byProject.get(pid)!.push(e);
    }

    const groups: StandupProjectGroup[] = [];
    for (const [pid, projectEntries] of byProject.entries()) {
      const proj = pid ? projectMap.get(pid) : null;
      const totalMs = projectEntries.reduce(
        (sum, e) => sum + elapsedMs(e.startedAt, e.stoppedAt),
        0
      );
      const standupEntries: StandupEntry[] = projectEntries
        .slice()
        .sort((a, b) => a.startedAt - b.startedAt)
        .map((e) => {
          const task = e.taskId ? taskMap.get(e.taskId) : null;
          return {
            id: e.id,
            description: e.notes.trim() || "(no description)",
            projectName: proj?.name ?? null,
            projectColor: proj?.color ?? null,
            taskName: task?.name ?? null,
            tags: e.tags ?? [],
            durationMs: elapsedMs(e.startedAt, e.stoppedAt),
            billable: e.billable ?? true,
          };
        });

      groups.push({
        projectId: pid,
        projectName: proj?.name ?? null,
        projectColor: proj?.color ?? null,
        entries: standupEntries,
        totalMs,
      });
    }

    // Sort groups: projects with most time first; no-project last
    groups.sort((a, b) => {
      if (a.projectId === null) return 1;
      if (b.projectId === null) return -1;
      return b.totalMs - a.totalMs;
    });

    const dayTotal = groups.reduce((s, g) => s + g.totalMs, 0);
    grandTotalMs += dayTotal;
    grandEntryCount += dayEntries.length;

    sections.push({
      label: humanLabel(dateKey),
      dateKey,
      groups,
      totalMs: dayTotal,
    });
  }

  return { sections, totalMs: grandTotalMs, entryCount: grandEntryCount, period };
}

// ─────────────────────────────────────────────────────────────────────────────
// Text formatters
// ─────────────────────────────────────────────────────────────────────────────

function deduplicateDescriptions(entries: StandupEntry[]): string[] {
  const seen = new Set<string>();
  const results: string[] = [];
  for (const e of entries) {
    // Strip annotation block from notes before showing
    const clean = e.description
      .replace(/<!--\s*session-annotations[\s\S]*?-->/g, "")
      .trim();
    const key = clean.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      results.push(clean || "(no description)");
    }
  }
  return results;
}

export function formatStandupText(data: StandupSummaryData, format: StandupFormat): string {
  if (data.sections.length === 0) {
    return "No time entries found for the selected period.";
  }

  const lines: string[] = [];

  for (const section of data.sections) {
    if (data.sections.length > 1) {
      // Multi-day: emit a section header
      if (format === "markdown") {
        lines.push(`## ${section.label} (${formatDurationShort(section.totalMs)})`);
      } else if (format === "slack") {
        lines.push(`*${section.label}* _(${formatDurationShort(section.totalMs)})_`);
      } else {
        lines.push(`${section.label} (${formatDurationShort(section.totalMs)})`);
      }
      lines.push("");
    }

    for (const group of section.groups) {
      const projectLabel = group.projectName ?? "No project";
      const projectTime = `(${formatDurationShort(group.totalMs)})`;

      if (format === "markdown") {
        lines.push(`**${projectLabel}** ${projectTime}`);
      } else if (format === "slack") {
        lines.push(`*${projectLabel}* ${projectTime}`);
      } else {
        lines.push(`${projectLabel} ${projectTime}`);
      }

      const descs = deduplicateDescriptions(group.entries);
      for (const desc of descs) {
        if (format === "markdown" || format === "bullets") {
          lines.push(`  - ${desc}`);
        } else if (format === "slack") {
          lines.push(`  • ${desc}`);
        }
      }

      lines.push("");
    }
  }

  // Trim trailing blank line
  while (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();

  // Append total if multi-section
  if (data.sections.length > 1) {
    lines.push("");
    if (format === "markdown") {
      lines.push(`---`);
      lines.push(`**Total: ${formatDurationShort(data.totalMs)}**`);
    } else if (format === "slack") {
      lines.push(`_Total: ${formatDurationShort(data.totalMs)}_`);
    } else {
      lines.push(`Total: ${formatDurationShort(data.totalMs)}`);
    }
  }

  return lines.join("\n");
}
