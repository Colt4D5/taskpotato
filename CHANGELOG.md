# Changelog

All notable changes to TaskPotato are documented here.

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
