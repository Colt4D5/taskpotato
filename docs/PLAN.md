# TaskPotato — Architecture & Plan

STATUS: READY

## Overview

TaskPotato is a local-first time tracking web application. No backend. No accounts. No surveillance. Your data lives in `localStorage` and nowhere else. It runs on GitHub Pages as a static export.

---

## Data Model

All data is stored in `localStorage` under namespaced keys.

### Project

```ts
interface Project {
  id: string;           // uuid
  name: string;
  color: string;        // hex color for visual grouping
  archived: boolean;
  createdAt: number;    // unix ms
}
```

### Task

```ts
interface Task {
  id: string;           // uuid
  projectId: string;
  name: string;
  notes: string;
  archived: boolean;
  createdAt: number;
}
```

### TimeEntry

```ts
interface TimeEntry {
  id: string;           // uuid
  taskId: string;
  projectId: string;
  startedAt: number;    // unix ms
  stoppedAt: number | null;  // null = currently running
  notes: string;
  tags: string[];
}
```

### localStorage Keys

```
taskpotato:projects     → Project[]
taskpotato:tasks        → Task[]
taskpotato:entries      → TimeEntry[]
taskpotato:settings     → AppSettings
```

### AppSettings

```ts
interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  weekStartsOn: 0 | 1;   // 0=Sunday, 1=Monday
  defaultView: 'timer' | 'log' | 'reports';
}
```

---

## Application Structure

```
app/
  layout.tsx              # Root layout, theme provider, global CSS
  page.tsx                # Redirect to /timer
  timer/
    page.tsx              # Active timer view — the "home" tab
  log/
    page.tsx              # Log view — all time entries in reverse chron
  reports/
    page.tsx              # Reports view — summaries by project/task/week
  settings/
    page.tsx              # Settings page

components/
  layout/
    Shell.tsx             # App shell: sidebar nav + content area
    Nav.tsx               # Tab navigation (Timer / Log / Reports / Settings)
    ThemeProvider.tsx     # System/light/dark theme handler
  timer/
    TimerWidget.tsx       # The main timer display + start/stop controls
    ProjectTaskSelector.tsx  # Inline project + task picker
    RunningEntry.tsx      # Shows the current running entry if one exists
  log/
    EntryList.tsx         # List of entries grouped by day
    EntryRow.tsx          # Single entry row with edit/delete
    EntryEditor.tsx       # Inline or modal editor for an entry
  reports/
    WeekSummary.tsx       # Bar chart of hours per day for current week
    ProjectBreakdown.tsx  # Pie/donut breakdown by project
    TaskTable.tsx         # Tabular total hours per task
  projects/
    ProjectList.tsx       # Manage projects list
    ProjectForm.tsx       # Create/edit project
  tasks/
    TaskList.tsx          # Tasks under a project
    TaskForm.tsx          # Create/edit task
  ui/
    Button.tsx            # Reusable button
    Modal.tsx             # Generic modal wrapper
    Badge.tsx             # Color-coded badge (for projects/tags)
    Input.tsx             # Styled text input
    Select.tsx            # Styled select/dropdown
    ColorPicker.tsx       # Small swatch color picker
    DurationDisplay.tsx   # Formats ms → HH:MM:SS

hooks/
  useStorage.ts           # Generic typed localStorage hook
  useProjects.ts          # CRUD for projects
  useTasks.ts             # CRUD for tasks
  useEntries.ts           # CRUD for time entries
  useTimer.ts             # Active timer state + tick logic
  useReports.ts           # Computed aggregations for reports view

lib/
  storage.ts              # Low-level localStorage read/write with versioning
  uuid.ts                 # Tiny uuid generator (crypto.randomUUID wrapper)
  duration.ts             # Duration formatting utilities
  dateUtils.ts            # Week boundaries, day grouping, etc.
  exportImport.ts         # JSON export/import for data portability

types/
  index.ts                # All shared TypeScript interfaces (Project, Task, TimeEntry, etc.)
```

---

## Feature Roadmap

### Phase 1 — Core Timer (Night 1–2)
- [x] Project scaffolding, static export config
- [x] Data model + types
- [x] localStorage hooks (useStorage, useProjects, useTasks, useEntries)
- [x] App shell with tab navigation
- [x] Timer widget: start/stop, live tick, assign to project/task
- [x] Running entry persistence (survives page refresh)

### Phase 2 — Log View (Night 3)
- [x] Entry list grouped by day
- [x] Edit entry (time, notes, project/task)
- [x] Delete entry
- [x] Duration display (formatted)

### Phase 3 — Projects & Tasks (Night 3–4)
- [x] Project CRUD with color picker
- [x] Task CRUD nested under projects
- [x] Archive/unarchive

### Phase 4 — Reports (Night 4–5)
- [x] Weekly bar chart (hours per day)
- [x] Project breakdown (bar)
- [x] Task totals table
- [x] Date range picker (week navigation)

### Phase 5 — Polish & Portability (Night 5–6)
- [x] Theme toggle (light/dark/system)
- [x] JSON export / import
- [x] Settings page
- [ ] GitHub Pages CI/CD (GitHub Actions deploy workflow)
- [ ] Responsive mobile layout

### Phase 6 — Extras (if time)
- [ ] Tags on entries
- [ ] Pomodoro mode
- [x] Keyboard shortcuts
- [ ] CSV export

---

## Deployment

GitHub Pages via `output: 'static'`. Static build output goes to `out/`. GitHub Actions workflow triggers on push to `main`.

### GitHub Actions (`.github/workflows/deploy.yml`)

Triggers on push to `main`. Runs `npm run build`, uploads `out/` as a Pages artifact, deploys.

---

## Design Principles

1. **No backend. Ever.** If it needs a server, it doesn't belong here.
2. **Fast.** No loading spinners for local data.
3. **Keyboard-navigable.** Timer should be startable with a single keypress.
4. **Honest UI.** If something failed, say so. Don't fail silently.
5. **Portable data.** User can export everything as JSON and take it elsewhere.
