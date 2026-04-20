# 🥔 TaskPotato

A local-first time tracking web application. No backend. No accounts. No data leaves your machine.

**Live:** https://colt4d5.github.io/taskpotato

---

## Status

🚧 **Active Development — Night 14 complete**

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
- ✅ Settings — preferences (week start, default view), full JSON export (projects + tasks + entries), JSON import
- ✅ Daily summary panel on timer page (total time, project bar chart, entry list)
- ✅ Inline project creation from timer page (+ New Project button → auto-select)
- ✅ Resume a stopped entry from the log — continues from accumulated time (no duplicate entries)
- ✅ Duplicate any completed entry to today — copies project, task, notes, tags, and billable flag in one click
- ✅ Log page filters — by project and task name
- ✅ Reactive state — all UI updates instantly without page reload (custom storage event bus)
- ✅ Theme toggle (light/dark/system)
- ✅ Keyboard shortcuts — T/L/R to navigate, Space to toggle timer, ? for help modal
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

