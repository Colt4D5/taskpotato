# 🥔 TaskPotato

A local-first time tracking web application. No backend. No accounts. No data leaves your machine.

**Live:** https://colt4d5.github.io/taskpotato

---

## Status

🚧 **Active Development — Night 24 complete**

## Features

- ✅ Next.js 16 App Router + TypeScript
- ✅ Tailwind CSS dark UI
- ✅ Static export (GitHub Pages compatible)
- ✅ Full architecture plan (`docs/PLAN.md`)
- ✅ localStorage data layer (typed, namespaced)
- ✅ Data model: Projects, Tasks, TimeEntries, Settings
- ✅ Core hooks: `useStorage`, `useProjects`, `useTasks`, `useEntries`, `useTimer`
- ✅ App shell with tab navigation (Timer / Log / Reports / Settings)
- ✅ Timer widget — start/stop, live tick, project + task selector
- ✅ Running entry survives page refresh (stored in localStorage)
- ✅ Enter key shortcut to start/stop timer
- ✅ Log view — entries grouped by day, day totals
- ✅ Edit entries (full date+time editing with validation, notes, project, task)
- ✅ Delete entries
- ✅ Project CRUD — create, edit, archive, delete with color picker
- ✅ Task CRUD — nested under projects, archive/restore/delete
- ✅ Reports — weekly bar chart, project breakdown with duration bars, task totals table
- ✅ Week navigation in reports (browse any prior week)
- ✅ Custom date range on Reports — toggle between weekly navigation and an arbitrary date range picker with Today / This week / This month quick-selects; all report sections update reactively
- ✅ Settings — preferences (week start, default view), full JSON export (projects + tasks + entries), JSON import
- ✅ Daily summary panel on timer page (total time, project bar chart, entry list)
- ✅ Inline project creation from timer page (+ New Project button → auto-select)
- ✅ Resume a stopped entry from the log — continues from accumulated time (no duplicate entries)
- ✅ Duplicate any completed entry to today — copies project, task, notes, tags, and billable flag in one click
- ✅ Log page filters — by project and task name
- ✅ Reactive state — all UI updates instantly without page reload (custom storage event bus)
- ✅ Theme toggle (light/dark/system)
- ✅ Keyboard shortcuts — T/L/R to navigate, Space to toggle timer, ? for help modal, ⌘K for command palette
- ✅ Command palette — ⌘K (or Ctrl+K) to open a global search palette; search entries by notes, project, task, and tags; keyboard-navigable with ↑↓ and ↵; shows duration, tags, and billable status per result
- ✅ Tags on entries — tag input on timer, filter by tag on log page, tag breakdown on reports
- ✅ CSV export — download all completed entries as a spreadsheet (Settings > Data)
- ✅ Pomodoro mode — 🍅 toggle on timer page, configurable work/break durations, ring countdown, session tracking
- ✅ Idle detection — configurable alert (1/2/4/8h) if timer runs too long; dismiss, stop, or adjust start time
- ✅ Billable / non-billable flag on entries — toggle on timer, edit in entry editor, badge in log, breakdown in reports, column in CSV export
- ✅ Streak tracking — current streak, longest streak, active days, and a 16-week activity heatmap on the Reports page
- ✅ Time rounding on stop — round stop time to nearest 5/10/15 minutes (configurable in Settings)
- ✅ Weekly goal tracking — set a target hours/week in Settings; Reports page shows a progress bar, time remaining, and completion status
- ✅ Collapsible day sections in the log — click any day header to expand/collapse; today expands by default, older days collapse
- ✅ Date range filter on the log page — preset quick-selects (Today, This Week, Last Week, Last 7 Days, This Month, Last Month, Last 30 Days) plus custom from/to date pickers; integrates with existing project/task/tag filters
- ✅ Markdown notes — entry descriptions support full Markdown syntax; Write/Preview tab toggle in the entry editor; inline markdown rendering in the log view with an `md` badge indicator; powered by `marked` + `@tailwindcss/typography`
- ✅ Project time budgets — set an optional hour cap on any project; burn progress bars on the Reports page with over-budget / near-limit badges; warning banner in the timer when selected project is at ≥80% capacity
- ✅ Per-project hourly rates & earnings breakdown — set a USD/hr rate on any project; Reports page shows billable earnings per project for the selected week with green totals and progress bars; only billable entries count
- ✅ Entry templates — save named timer presets (project, task, notes, tags, billable flag); one-click apply from quick-start chips on the timer page; full CRUD in Settings; included in JSON export/import
- ✅ Manual time entry (Quick Log) — `+ Log time` button on the Log page (or press `N`) opens a form to log a completed past entry; two modes: Start→End time range or Start+Duration (flexible natural format: `1h 30m`, `1:30`, `90` min); midnight-spanning entries handled automatically; all timer fields supported (project, task, description, tags, billable)
- ✅ Tag manager — Settings > Tags lists all tags with entry counts; rename (normalizes to lowercase kebab-case, blocks name collision), merge two tags into one, or delete a tag; all changes apply instantly across every entry
- ✅ Client management — create named clients with color labels and optional notes; associate projects with clients; client breakdown section on Reports showing time distribution per client; client filter on the Log page; clients included in JSON export/import
- ✅ Bulk entry operations — ☑ Select mode on the Log page; select individual entries or all entries in a day; bulk delete (with confirmation), bulk project reassign, bulk tag add, bulk billable toggle; Escape to exit
- ✅ Live browser tab title — tab shows `▶ HH:MM:SS — description (project)` while timer is running; resets to "TaskPotato" when idle
- ✅ Entry splitting — ✂ Split button on any completed entry; configure split time with live duration preview for both segments; optionally assign the second segment to a different project and task
- ✅ Log stats bar — live summary row above the entry list showing total time, billable time with percentage, entry count, active days, and average time per day; updates instantly as filters change
- ✅ Day timeline view — toggle the Log page to Timeline mode (button or press `V`) to see each day's entries as proportional colored blocks on a 24-hour axis; overlap detection splits concurrent entries into side-by-side columns; current-time indicator on today; hover tooltips with full entry details
- ✅ 12-week rolling trend chart — Reports page section showing 12 weeks of bar chart history; toggle between Total and Billable split views (stacked bars: green billable / zinc non-billable); summary chips for 12-week total, average per active week, average billable, and current week; current week highlighted in orange; per-bar hover tooltips
- ⬜ Responsive mobile polish

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Storage | localStorage only |
| Deployment | GitHub Pages (static export) |

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
# Output in ./out/
```

## Data Model

All data lives in `localStorage` under `taskpotato:*` keys. No server, no cloud, no nonsense.

See [`docs/PLAN.md`](docs/PLAN.md) for the full architecture.

