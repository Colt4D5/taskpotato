# Changelog

All notable changes to TaskPotato are documented here.

## [0.4.0] — 2026-04-06

### Added
- **Week navigation on Reports** — ← / → buttons to browse any prior week; "Back to this week" shortcut; next-week button disabled on current week.
- **Task Totals table on Reports** — ranked table of tasks tracked during the selected week, showing task name, parent project badge, and duration. Only renders when tasks have logged time.
- **Full JSON export** — export now includes entries in addition to projects and tasks (versioned format).
- **JSON import** — new Import button on Settings page; restores projects, tasks, and entries from a previous export file; overwrites in place with success/error feedback.
- **No-project row in project breakdown** — unassigned time now shows as "No project" in the Reports project chart.

---

## [0.3.0] — 2026-04-05

### Added
- **Daily Summary on Timer Page** — compact panel below the timer showing today's total tracked time, a horizontal bar chart broken down by project, and a list of each completed entry with description, project badge, and duration. Only renders when there are completed entries today.
- **Inline Project Creation** — "+ New Project" button next to the project dropdown on the timer page. Opens `ProjectForm` modal; on save, auto-selects the new project in the dropdown without navigating away.
- **Resume Entry** — "▶ Resume" ghost button on each completed entry in the Log view. Starts a new timer pre-filled with the same project, task, and notes. Button is hidden when a timer is already running.

## [0.1.0] — 2026-04-03

### Added
- Initial project scaffolding: Next.js 16, TypeScript, Tailwind CSS, static export (`output: 'export'`)
- Full architecture plan in `docs/PLAN.md` — data model, component tree, feature roadmap
- `types/index.ts` — shared interfaces: `Project`, `Task`, `TimeEntry`, `AppSettings`
- `lib/storage.ts` — typed localStorage layer with namespacing (`taskpotato:*`)
- `lib/uuid.ts` — `crypto.randomUUID` wrapper with fallback
- `lib/duration.ts` — `formatDuration` (HH:MM:SS), `formatDurationShort`, `elapsedMs`
- `lib/dateUtils.ts` — day grouping, week boundaries, day label formatting
- `lib/cn.ts` — `clsx` + `tailwind-merge` utility
- `hooks/useStorage.ts` — generic typed localStorage hook with cross-tab sync
- `hooks/useProjects.ts` — project CRUD
- `hooks/useTasks.ts` — task CRUD
- `hooks/useEntries.ts` — time entry CRUD, running entry detection
- `hooks/useTimer.ts` — active timer state, 1-second tick, project/task selection
- `components/layout/Nav.tsx` — tab navigation bar (mobile bottom + desktop sidebar)
- `components/layout/Shell.tsx` — app shell wrapper
- `components/ui/DurationDisplay.tsx` — monospace `HH:MM:SS` display
- `components/ui/Button.tsx` — reusable button with variants (primary, ghost, danger)
- `components/timer/TimerWidget.tsx` — full timer UI: clock, description input, project/task selector, start/stop, Enter key shortcut
- App routes: `/timer`, `/log`, `/reports`, `/settings`
- Dark zinc color scheme throughout

## [0.2.0] — 2026-04-04

### Added
- **Log view** (`/log`) — time entries grouped by calendar day, reverse chronological; day totals shown per group
- `EntryRow` — entry display with project badge, duration, start/stop times; hover-revealed edit/delete actions
- `EntryEditor` modal — edit entry notes, start time, stop time, project, and task in a modal
- `EntryList` — drives the log view with grouped day rendering and empty state
- **Projects management** — full CRUD via `ProjectList` in Settings; expand/collapse to view tasks
- `ProjectForm` modal — create/edit projects with name + `ColorPicker` (16 swatches)
- **Tasks management** — `TaskList` nested under projects; add, edit, archive, restore, delete
- `TaskForm` modal — create/edit tasks with name + optional notes
- **Reports page** (`/reports`) — weekly total, bar chart (hours per day), project breakdown with duration + percentage bars
- **Settings page** (`/settings`) — preferences (week start, default view), inline project management, JSON export
- `Modal` component — keyboard-dismissible (Escape), overlay-click-dismissible
- `Input` component — styled text input with label and error support
- `Badge` component — color-coded label badge for projects
- `ColorPicker` component — 16-swatch color selector

### Changed
- Log page placeholder replaced with full implementation
- Settings page placeholder replaced with full implementation
- Reports page placeholder replaced with full implementation

## [Night 5] — 2026-04-07

### Fixed
- **Reactive state** — project creation and timer stop now update all consumers immediately without page reload
  - `lib/storage.ts`: dispatch `taskpotato:storage-update` custom event on every `storageSet()` call
  - `hooks/useStorage.ts`: listen for `taskpotato:storage-update` and re-read from localStorage so all hook instances in the same page re-render on writes from sibling components

### Added
- **Log page filters** — filter bar above the entry list with project dropdown ("All Projects" default) and task name text search (case-insensitive); filters hide entire day groups when no entries remain; "Clear" button when any filter is active
- **Resume timer with accumulated time** — resuming a stopped entry continues the timer from its prior duration instead of restarting at 00:00:00
  - `TimeEntry` type gains optional `resumedAt` and `offsetMs` fields
  - `useEntries.resumeEntry()` marks the entry running again, storing the prior elapsed ms in `offsetMs`
  - `useTimer` elapsed calculation accounts for `offsetMs` + time since `resumedAt`
  - Stopping a resumed entry writes a single updated `stoppedAt` — no duplicate entries created

## [Night 6] — 2026-04-08

### Changed
- **EntryEditor: full date+time editing** — replaced time-only inputs with separate date + time fields (HH:MM:SS) for both start and stop
  - `toDateInput()` / `toTimeInput()` helpers extract local date and time strings from epoch ms
  - `combineDateTime()` reconstructs a full epoch ms from a date string + time string, interpreted as local time
  - Validation: both start fields required; stop fields required when entry is completed; stop must be strictly after start — inline error message displayed on failure
  - Entries automatically appear under the correct day group after date change (existing reactivity via `taskpotato:storage-update`)

## [Night 7] — 2026-04-09

### Added
- **Tags on entries** — full tag support across the entire app
  - `useTimer` / `useEntries.startEntry()` — tag state in timer hook, passed into new entry on start
  - `TagInput` component (`components/ui/TagInput.tsx`) — chip-based tag input; press Enter, comma, or Tab to commit; Backspace removes last tag; tags normalized to lowercase kebab-case
  - `TimerWidget` — tag input field below description; disabled while timer is running
  - `EntryRow` — tag chips displayed inline with project badge and task name
  - `EntryEditor` — full tag editing via `TagInput` in the edit modal; tags saved on entry update
  - Log page — tag filter dropdown (only shown when entries have tags); "All Tags" default; works alongside existing project and task name filters; Clear button updated to reset tag filter too
  - Reports page — "Tag Totals" section at bottom; bar chart breakdown by tag with percentage and duration; sorted by time descending
