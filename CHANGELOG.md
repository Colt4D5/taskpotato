# Changelog

All notable changes to TaskPotato are documented here.

## [2.2.0] — 2026-04-27

### Added
- **Client management** — track billable relationships at the client level, above projects
  - `Client` type (`types/index.ts`) — new interface with `id`, `name`, `color`, `notes?`, and `createdAt` fields
  - `Project.clientId?: string | null` — new optional field linking a project to a client
  - `useClients` hook (`hooks/useClients.ts`) — localStorage-backed CRUD for clients stored under `taskpotato:clients`; `addClient`, `updateClient`, `deleteClient`
  - `ClientForm` component (`components/clients/ClientForm.tsx`) — modal for creating/editing clients; fields: name (required), color picker (8 swatches), optional notes textarea
  - `ClientList` component (`components/clients/ClientList.tsx`) — Settings section listing all clients with color dot, name, truncated notes; per-row Edit and two-step Delete (Delete → Confirm?) actions; empty state message
  - `ProjectForm` — new optional Client dropdown (hidden when no clients exist); selected client stored as `clientId` on the project
  - `ProjectList` — passes `clients` prop into `ProjectForm`; renders a color-keyed client pill badge next to each project name when a client is assigned
  - `useProjects.addProject()` — updated signature accepts optional `clientId`; stored on the project record
  - `ClientBreakdown` component (`components/reports/ClientBreakdown.tsx`) — Reports page section showing total tracked time per client (this week) as color-coded progress bars with percentage and formatted duration; only renders when clients exist and entries have client-associated projects
  - Reports page — `ClientBreakdown` inserted above the project breakdown section
  - Log page — Client filter dropdown added to the filter bar (hidden when no clients exist); filters entries whose project is associated with the selected client; integrates with existing project/task/tag/date-range filters; `clearFilters()` resets client filter
  - JSON export/import — `clients` array included in export payload and restored on import (backward-compatible: import silently skips if field absent)
  - Settings page — `ClientList` section added above Projects


### Added
- **Tag manager** — Settings page gains a dedicated Tags section for post-hoc tag housekeeping
  - `components/settings/TagManager.tsx` — lists all tags derived from completed and running entries, sorted by entry count descending; shows per-tag entry count
  - **Rename** — inline text field; input is normalized to lowercase kebab-case on save; blocks rename to an already-existing tag name with an inline error (suggests using Merge instead)
  - **Merge** — inline dropdown of all other existing tags; selecting a target and confirming re-tags every entry that carries the source tag with the target tag; source tag disappears from the list automatically
  - **Delete** — two-click confirmation (`Delete` → `Confirm?`) strips the tag from all entries entirely; no entries are removed
  - All operations call `useEntries.updateAllTags(oldTag, newTag | null)` — a single `setEntries` pass over the full entry array; reactive via existing `taskpotato:storage-update` event bus so the tag list refreshes instantly
  - `useEntries.updateAllTags()` — new hook method; `null` for `newTag` removes the tag; rename/merge both collapse to the same code path
  - Empty state message shown when no tags exist yet

## [2.0.0] — 2026-04-25

### Added
- **Manual time entry (Quick Log)** — log past time directly without touching the running timer
  - `useEntries.addEntry()` — new method that creates a fully completed entry from an `Omit<TimeEntry, "id">` payload and writes it to localStorage immediately
  - `QuickEntryForm` component (`components/log/QuickEntryForm.tsx`) — full modal for creating a past entry; two input modes selectable via tab toggle:
    - **Start → End** — pick date, start time, end time; auto-advances to next day when end ≤ start (handles midnight-spanning entries)
    - **Start + Duration** — pick date, start time, and type a duration in natural format (`1h 30m`, `1:30`, `90` for minutes, `2h`, `45m`)
  - All timer fields present: description, tags (`TagInput`), billable toggle, project selector, task selector (filtered to selected project)
  - Inline validation errors surface before saving; modal resets on open
  - Log page — `+ Log time` button in the page header opens `QuickEntryForm`; saved entry appears immediately in the correct day group via existing reactive storage
  - **`N` keyboard shortcut** — press `N` on the Log page (when not in an input) to open the form without reaching for the mouse
  - `KeyboardShortcutsHelp` — `N` shortcut added to the reference modal

## [1.9.0] — 2026-04-24

### Added
- **Entry templates** — save frequently-used timer configurations as named presets and start them with one click
  - `EntryTemplate` type (`types/index.ts`) — new interface with `id`, `name`, `projectId`, `taskId`, `notes`, `tags`, `billable`, and `createdAt` fields
  - `useTemplates` hook (`hooks/useTemplates.ts`) — localStorage-backed CRUD for templates: `addTemplate`, `updateTemplate`, `deleteTemplate`; templates stored under `taskpotato:templates`
  - `TemplateForm` component (`components/timer/TemplateForm.tsx`) — modal for creating and editing templates; fields: name (required), project selector, task selector (filtered to selected project's active tasks), description textarea, `TagInput`, billable toggle; validation rejects empty names
  - `TemplateQuickStart` component (`components/timer/TemplateQuickStart.tsx`) — horizontal strip of pill-shaped template buttons rendered at the top of the TimerWidget; clicking a pill instantly loads its project/task/notes/tags/billable values into the timer fields; disabled while a timer is running; color-dot indicator matches the template's project color; hover tooltip shows the full template configuration; hidden when no templates exist
  - `TemplateList` component (`components/timer/TemplateList.tsx`) — Settings section listing all templates with project badge, task name, non-billable indicator, tags, and truncated description preview; Edit and Delete actions per row; "+ New template" button opens `TemplateForm`
  - `TimerWidget` — imports `useTemplates` and `TemplateQuickStart`; `applyTemplate()` populates all five timer fields from the selected template without starting the timer
  - Settings page — `TemplateList` section added between Projects and Data
  - JSON export/import — `templates` array included in export payload and restored on import (backward-compatible: import silently skips if field absent)




### Added
- **Project time budgets** — set an optional hour cap per project and track burn across the app
  - `Project.budgetHours?: number` — new optional field on the `Project` type; `undefined` or `0` means no budget
  - `ProjectForm` — new "Budget (hours)" numeric input in the create/edit modal; optional; accepts decimals (e.g. 40, 12.5); validation rejects non-positive values; help text explains all-time scope
  - `useProjects.addProject()` — updated signature accepts optional `budgetHours`; stored on the project record
  - `ProjectList` / `TimerWidget` inline project creation — both thread `budgetHours` through from form to hook
  - `ProjectBudgetCard` component (`components/reports/ProjectBudgetCard.tsx`) — renders a "Project Budgets" section on the Reports page for all active projects with a budget set; each row shows a color-keyed progress bar with amber fill at 80%+, red fill when over budget, "over budget" / "near limit" badges, formatted duration vs. budget, percentage used, and remaining or over-budget time
  - Reports page — `ProjectBudgetCard` mounted at the bottom of the Reports page; hidden when no projects have budgets configured
  - `TimerWidget` — inline warning banner below the project selector when the selected project is at ≥80% of its budget; amber for near-limit, red for exceeded; shows percentage, tracked time, and budget cap; hidden when no budget is set or utilization is under 80%
  - Budget burn is calculated from all-time tracked entries (not scoped to a week) so it reflects total project spend



## [1.7.0] — 2026-04-22

### Added
- **Command palette** — `⌘K` (or `Ctrl+K` on Windows/Linux) opens a global search overlay accessible from any page
  - `components/ui/CommandPalette.tsx` — full-featured palette: fuzzy-substring search across all completed entries (notes, project, task, tags), all projects, all tasks, and built-in nav items; arrow-key navigation; `Enter` to select; `Esc` to dismiss; click backdrop to dismiss
  - `hooks/useCommandPalette.ts` — manages open/close state and registers the `⌘K`/`Ctrl+K` keyboard listener
  - `Shell` — mounts the palette globally so it's available on every page; passes `entries`, `projects`, and `tasks` down for live search
  - `Nav` — new `⌘` icon button in the desktop sidebar that opens the palette via `onOpenCommandPalette` prop
  - Results display entry duration (formatted short), tag chips, and non-billable badge inline
  - Query highlighting — matched substring is highlighted in amber within each result label
  - No-query state shows nav items only as quick-jump shortcuts
  - Results capped at 50; entry results filtered to completed entries only
  - `KeyboardShortcutsHelp` — `⌘K` added as the first shortcut in the reference modal



### Added
- **Markdown notes with preview** — entry descriptions now support full Markdown syntax with live preview
  - `lib/markdown.ts` — `renderMarkdown(md)` converts Markdown to HTML via `marked`; custom renderer applies `target="_blank"` + `rel="noopener noreferrer"` to all links; `hasMarkdown(text)` detects whether a string contains Markdown syntax worth rendering
  - `@tailwindcss/typography` — installed and registered as a v4 `@plugin` in `globals.css`; `prose prose-invert prose-sm` classes used for all rendered output to ensure readable typographic defaults against the dark theme
  - `EntryEditor` — description field replaced with a **Write / Preview** tab toggle; Preview tab renders the markdown HTML using the `prose` classes; write mode uses a resizable `<textarea>`; preview resets to Write mode when the modal reopens
  - `EntryRow` — notes that contain Markdown syntax display a small `md` badge; clicking the description text toggles an inline expanded view that renders the full Markdown HTML beneath the entry row metadata
  - Markdown support is fully additive — plain text entries behave identically to before; no forced formatting

## [1.5.0] — 2026-04-20

### Added
- **Date range filter on the Log page** — quickly scope the log to any time period
  - `DateRangeFilter` component (`components/log/DateRangeFilter.tsx`) — preset quick-select dropdown (Today, This Week, Last Week, Last 7 Days, This Month, Last Month, Last 30 Days) that fills from/to date fields automatically; custom date pickers appear when any range is active and allow manual override; preset label is highlighted automatically when date pickers match a known preset
  - Log page — mounts `DateRangeFilter` above the existing project/task/tag filter row; `filteredEntries` now also filters by `startedAt` against the selected range's start-of-day / end-of-day boundaries; active entry count hint shown when a date range is selected; "Clear all" button resets all five filter dimensions at once
  - `startOfDay` / `endOfDay` utilities already present in `lib/dateUtils.ts` reused for precise day boundary calculations (local time)

## [1.4.0] — 2026-04-19

### Added
- **Collapsible day sections in the Log** — click any day header to expand or collapse that day's entries
  - Day headers are now full-width interactive buttons with a chevron indicator
  - Today's section starts expanded; all prior days start collapsed by default
  - Collapsed headers show an entry count hint (e.g. "3 entries") alongside the day total so context is preserved without taking up space
  - Collapse state is ephemeral per-session — no storage pollution
  - Smooth chevron rotation animation on toggle; subtle hover state on the header row
  - Fully accessible: `aria-expanded` attribute on each header button

## [1.3.0] — 2026-04-18

### Added
- **Entry duplication** — copy any completed entry to today with one click
  - `useEntries.duplicateEntry(id)` — clones a completed entry: preserves project, task, notes, tags, and billable flag; calculates original duration and stamps new `startedAt`/`stoppedAt` relative to now so it lands in today's log
  - `EntryRow` — new **⊙ Copy** ghost button in the hover action bar; appears alongside Resume/Edit/Delete
  - `EntryList` — threads `onDuplicate` prop down to `EntryRow`
  - Log page — wires `handleDuplicate` → `duplicateEntry`; duplicated entry appears immediately under today's date group

## [1.2.0] — 2026-04-17

### Added
- **Weekly goal tracking** — set a target hours/week and track progress on the Reports page
  - `AppSettings.weeklyGoalHours: number` — new preference field; default `0` (disabled); any positive value enables the feature
  - `WeeklyGoalProgress` component (`components/reports/WeeklyGoalProgress.tsx`) — progress bar that fills as the week's logged time approaches the goal; turns green on completion; shows time remaining (current week) or "goal not reached" (past weeks); displays overage when exceeded; renders percentage complete below the bar
  - Reports page — `WeeklyGoalProgress` card inserted between the week total and the billable breakdown; only rendered when a goal is set
  - Settings page — new **Weekly goal** preference row in the Preferences section; numeric input (0–168h); `0` disables the feature



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
