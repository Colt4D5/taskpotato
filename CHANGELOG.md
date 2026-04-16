# Changelog

All notable changes to TaskPotato are documented here.

## [1.1.0] — 2026-04-16

### Added
- **Time rounding on stop** — automatically round stop time to the nearest 5, 10, or 15 minutes when the timer is stopped
  - `roundTimestamp(ts, minutes)` utility added to `lib/duration.ts` — rounds a Unix timestamp to the nearest interval; no-op when `minutes === 0`
  - `AppSettings.timeRounding: 0 | 5 | 10 | 15` — new preference field; default `0` (disabled); legacy settings without the field fall back to disabled
  - `useEntries.stopEntry()` — accepts an optional `stoppedAt` override so callers control the final timestamp
  - `useTimer.stop()` — reads `settings.timeRounding`, computes the rounded stop timestamp, and passes it to `stopEntry`
  - `TimerWidget` — subtle hint text below the Stop button when rounding is active ("⏱ Stop time rounds to nearest N min")
  - Settings page — new **Time rounding** preference row (Disabled / 5 minutes / 10 minutes / 15 minutes) in the Preferences section

## [1.0.0] — 2026-04-15

### Added
- **Streak tracking & activity heatmap** — all-time tracking habit visualization on the Reports page
  - `lib/streaks.ts` — `computeStreaks()` utility; derives `currentStreak`, `longestStreak`, total active days, and a `dailyMs` map (YYYY-MM-DD → ms) from all completed entries; handles streak starting from today or yesterday (so logging yesterday doesn't break a streak on days where nothing has been tracked yet today)
  - `components/reports/ActivityHeatmap.tsx` — GitHub-style 16-week contribution heatmap; 5-level orange intensity scale (none → <30 min → <2h → <4h → 4h+); day-of-week row labels; month column labels; hover tooltip shows date + formatted duration
  - Reports page — new **Activity** section at the top (only renders when at least one entry exists); shows current streak with 🔥 icon, longest streak, and total active days as stat cards above the heatmap



### Added
- **Billable / non-billable tracking** — mark time entries as billable or non-billable at every stage of the workflow
  - `TimeEntry.billable` — new `boolean` field (defaults `true` for all new entries; legacy entries without the field treated as billable at render time)
  - `useTimer` / `useEntries.startEntry()` — `billable` state in timer hook; passed into new entry on start; reset to `true` on stop
  - `TimerWidget` — toggle switch ("Billable") above the Start/Stop button; disabled while timer is running
  - `EntryRow` — "non-billable" pill badge shown inline next to tags when entry is non-billable
  - `EntryEditor` — billable toggle switch in the edit modal; saved on update
  - Reports page — new **Billable vs Non-Billable** section below the week total card; stacked horizontal bar + per-row breakdown with percentage and formatted duration; only renders when there is tracked time
  - CSV export — new `Billable` column (Yes/No) appended to each row

## [0.8.0] — 2026-04-13

### Added
- **Idle detection** — timer warns the user if it has been running past a configurable threshold
  - `useIdleDetection` hook (`hooks/useIdleDetection.ts`) — polls every 30 seconds; fires once per entry id; threshold of 0 disables detection entirely
  - `IdleAlert` modal (`components/timer/IdleAlert.tsx`) — three actions: dismiss (keep running), stop the timer, or adjust the start time inline with a datetime-local picker and validation
  - `TimerWidget` — mounts `useIdleDetection` and renders `IdleAlert` when triggered; passes `stop` and `updateEntry` through for the modal actions
  - Settings page — new "Idle alert" preference row (Disabled / 1h / 2h / 4h / 8h, default 2h); persisted to `AppSettings.idleAlertHours`
  - `AppSettings` type — `idleAlertHours: 0 | 1 | 2 | 4 | 8` field added; `DEFAULT_SETTINGS` defaults to 2

## [0.7.0] — 2026-04-11

### Added
- **Pomodoro mode** — 🍅 toggle on the timer page launches a configurable Pomodoro widget with a circular ring countdown, phase progression (Focus → Short Break → Long Break), session dot tracker, and settings panel (work/break durations, sessions-until-long-break). Runs independently alongside the main timer.
- **CSV export** — Settings > Data now offers "Export CSV" in addition to JSON export. Generates a spreadsheet with Date, Start, End, Duration, Duration (ms), Project, Task, Description, and Tags columns for all completed entries.

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

## [Night 8] — 2026-04-10

### Added
- **Theme toggle (light/dark/system)** — functional theme switching, no longer hardcoded dark
  - `ThemeProvider` component (`components/layout/ThemeProvider.tsx`) — reads `settings.theme` from localStorage, applies `dark`/`light` class to `<html>`, and subscribes to `prefers-color-scheme` media query change events when `system` is selected
  - `app/layout.tsx` — wraps app in `ThemeProvider`; removes hardcoded `className="dark"` from `<html>`
  - Settings page — new "Theme" preference row (System / Dark / Light selector) above "Week starts on"
- **Keyboard shortcuts** — navigate and control the timer without touching the mouse
  - `useKeyboardShortcuts` hook (`hooks/useKeyboardShortcuts.ts`) — `T` → Timer, `L` → Log, `R` → Reports, `Space` → toggle timer (when not in an input), `?` → show shortcuts help modal
  - `KeyboardShortcutsHelp` modal (`components/ui/KeyboardShortcutsHelp.tsx`) — floating shortcut reference card, triggered by `?` key or nav button, dismissed with Esc or click outside
  - `Shell` — mounts global nav shortcuts (T/L/R/?)
  - `TimerWidget` — mounts Space shortcut for timer toggle
  - `Nav` — `?` button at bottom of sidebar (desktop only) to trigger the shortcuts modal
