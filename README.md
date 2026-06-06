# 🥔 TaskPotato

A local-first time tracking web application. No backend. No accounts. No data leaves your machine.

**Live:** https://colt4d5.github.io/taskpotato

---

## Status

🚧 **Active Development - Night 35 complete**

## Features

- ✅ Next.js 16 App Router + TypeScript
- ✅ Tailwind CSS dark UI
- ✅ Static export (GitHub Pages compatible)
- ✅ Full architecture plan (`docs/PLAN.md`)
- ✅ localStorage data layer (typed, namespaced)
- ✅ Data model: Projects, Tasks, TimeEntries, Settings
- ✅ Core hooks: `useStorage`, `useProjects`, `useTasks`, `useEntries`, `useTimer`
- ✅ App shell with tab navigation (Timer / Log / Reports / Settings)
- ✅ Timer widget - start/stop, live tick, project + task selector
- ✅ Running entry survives page refresh (stored in localStorage)
- ✅ Enter key shortcut to start/stop timer
- ✅ Log view - entries grouped by day, day totals
- ✅ Edit entries (full date+time editing with validation, notes, project, task)
- ✅ Delete entries
- ✅ Project CRUD - create, edit, archive, delete with color picker
- ✅ Task CRUD - nested under projects, archive/restore/delete
- ✅ Reports - weekly bar chart, project breakdown with duration bars, task totals table
- ✅ Week navigation in reports (browse any prior week)
- ✅ Custom date range on Reports - toggle between weekly navigation and an arbitrary date range picker with Today / This week / This month quick-selects; all report sections update reactively
- ✅ Settings - preferences (week start, default view), full JSON export (projects + tasks + entries), JSON import
- ✅ Daily summary panel on timer page (total time, project bar chart, entry list)
- ✅ Session notepad - collapsible 📝 panel on the Timer page, only visible while a timer is running; edit the running entry's description live (previously locked mid-session); add timestamped annotations (stamped with elapsed session time, e.g. `00:23:41`) for decisions, blockers, and context without stopping the timer; completed entries with annotations show a clean Session Notes panel in the entry editor with per-note delete; stored as an HTML comment block in the entry's notes field — no new localStorage key, no schema change
- ✅ Description autocomplete - typing in the timer's description field shows a ranked dropdown of previously-used descriptions; selecting one auto-fills project, task, tags, and billable flag; query match highlighted in amber; keyboard-navigable (↑/↓/Enter/Tab/Escape)
- ✅ Tag autocomplete - typing in any tag field (timer, entry editor, Quick Log, template form) shows a live dropdown of previously-used tags filtered by the current input; prefix matches surface first; query highlighted in amber; keyboard-navigable (↑/↓/Enter/Tab/Escape); suggestions ranked by usage frequency so your most-used tags come first
- ✅ Inline project creation from timer page (+ New Project button → auto-select)
- ✅ Resume a stopped entry from the log - continues from accumulated time (no duplicate entries)
- ✅ Duplicate any completed entry to today - copies project, task, notes, tags, and billable flag in one click
- ✅ Log page filters - by project and task name
- ✅ Reactive state - all UI updates instantly without page reload (custom storage event bus)
- ✅ Theme toggle (light/dark/system)
- ✅ Keyboard shortcuts — T/L/R to navigate, **C to resume most recent entry (Timer page)**, **F to enter/exit focus mode (Timer page, when running)**, Space to toggle timer, N to log time, J to open today's day note, G to toggle project grouping, V to toggle timeline, / to focus search, ? for help modal, ⌘K for command palette
- ✅ Focus Mode — press `F` while a timer is running to enter a full-screen, distraction-free overlay: giant elapsed clock, project/task context, description, scrolling session annotations (if any), and a single Stop button; ambient today stats in a discreet footer; `F` or Esc to exit; no accidental close on backdrop click
- ✅ Command palette - ⌘K (or Ctrl+K) to open a global search palette; search entries by notes, project, task, and tags; keyboard-navigable with ↑↓ and ↵; shows duration, tags, and billable status per result
- ✅ Tags on entries - tag input on timer, filter by tag on log page, tag breakdown on reports
- ✅ CSV export - download all completed entries as a spreadsheet (Settings > Data)
- ✅ CSV import - import entries from TaskPotato, Toggl, Clockify, or any compatible CSV; drag-and-drop wizard with column detection, preview table, error reporting, and automatic project matching/creation (Settings > Data)
- ✅ Pomodoro mode - 🍅 toggle on timer page, configurable work/break durations, ring countdown, session tracking
- ✅ Idle detection - configurable alert (1/2/4/8h) if timer runs too long; dismiss, stop, or adjust start time
- ✅ Billable / non-billable flag on entries - toggle on timer, edit in entry editor, badge in log, breakdown in reports, column in CSV export
- ✅ Streak tracking - current streak, longest streak, active days, and a 16-week activity heatmap on the Reports page
- ✅ Time rounding on stop - round stop time to nearest 5/10/15 minutes (configurable in Settings)
- ✅ Weekly goal tracking - set a target hours/week in Settings; Reports page shows a progress bar, time remaining, and completion status
- ✅ Daily goal tracking - set a target tracked hours/day in Settings; Reports page shows a per-day bar chart with hit/miss color coding, dashed goal markers, streak counter, and success rate for any date range
- ✅ Collapsible day sections in the log - click any day header to expand/collapse; today expands by default, older days collapse
- ✅ Date range filter on the log page - preset quick-selects (Today, This Week, Last Week, Last 7 Days, This Month, Last Month, Last 30 Days) plus custom from/to date pickers; integrates with existing project/task/tag filters
- ✅ Markdown notes - entry descriptions support full Markdown syntax; Write/Preview tab toggle in the entry editor; inline markdown rendering in the log view with an `md` badge indicator; powered by `marked` + `@tailwindcss/typography`
- ✅ Project time budgets - set an optional hour cap on any project; burn progress bars on the Reports page with over-budget / near-limit badges; warning banner in the timer when selected project is at ≥80% capacity
- ✅ Per-project hourly rates & earnings breakdown - set a USD/hr rate on any project; Reports page shows billable earnings per project for the selected week with green totals and progress bars; only billable entries count
- ✅ Entry templates - save named timer presets (project, task, notes, tags, billable flag); one-click apply from quick-start chips on the timer page; full CRUD in Settings; included in JSON export/import
- ✅ Manual time entry (Quick Log) - `+ Log time` button on the Log page (or press `N`) opens a form to log a completed past entry; two modes: Start→End time range or Start+Duration (flexible natural format: `1h 30m`, `1:30`, `90` min); midnight-spanning entries handled automatically; all timer fields supported (project, task, description, tags, billable)
- ✅ Tag manager - Settings > Tags lists all tags with entry counts; rename (normalizes to lowercase kebab-case, blocks name collision), merge two tags into one, or delete a tag; all changes apply instantly across every entry
- ✅ Client management - create named clients with color labels and optional notes; associate projects with clients; client breakdown section on Reports showing time distribution per client; client filter on the Log page; clients included in JSON export/import
- ✅ Bulk entry operations - ☑ Select mode on the Log page; select individual entries or all entries in a day; bulk delete (with confirmation), bulk project reassign, bulk tag add, bulk billable toggle; Escape to exit
- ✅ Undo entry deletion - deleting a single or bulk set of entries shows a toast with a 5-second undo window; entries are hidden immediately but only purged from storage when the timer expires or you dismiss; undo is lossless (no writes occur during the grace period)
- ✅ Live browser tab title - tab shows `▶ HH:MM:SS - description (project)` while timer is running; resets to "TaskPotato" when idle
- ✅ Entry splitting - ✂ Split button on any completed entry; configure split time with live duration preview for both segments; optionally assign the second segment to a different project and task
- ✅ Log stats bar - live summary row above the entry list showing total time, billable time with percentage, entry count, active days, and average time per day; updates instantly as filters change
- ✅ Day timeline view - toggle the Log page to Timeline mode (button or press `V`) to see each day's entries as proportional colored blocks on a 24-hour axis; overlap detection splits concurrent entries into side-by-side columns; current-time indicator on today; hover tooltips with full entry details
- ✅ Group by Project - toggle the Log page to Project grouping mode (button or press `G`) to pivot entries from day buckets into project buckets; groups sorted by total tracked time descending; entry count and total per group; date labels on each entry preserve temporal context; seamlessly works with all filters, bulk select, undo, and entry actions
- ✅ Copy Summary - one-click clipboard export of a formatted Markdown summary from the Reports page; includes totals, billable/non-billable split, project/task/tag breakdowns with percentages; works in both Weekly and Custom Range modes; paste-ready for standups, invoices, or Slack
- ✅ Notes full-text search - search bar on the Log page filters entries by description text; press `/` to focus from anywhere; matched substrings highlighted in amber inline; clears with Escape or "Clear all"
- ✅ 12-week rolling trend chart - Reports page section showing 12 weeks of bar chart history; toggle between Total and Billable split views (stacked bars: green billable / zinc non-billable); summary chips for 12-week total, average per active week, average billable, and current week; current week highlighted in orange; per-bar hover tooltips
- ✅ Printable Timesheet / Invoice View - "Print" button on the Reports range card opens a print-ready white overlay; entry table with date, time range, project/task, notes, duration, and earnings columns; project summary table below; billable/earnings columns hide when not applicable; browser "Save as PDF" integration via `window.print()`; works with both Weekly and Custom Range modes
- ✅ Export filtered entries - "Export" button in the Log page header downloads exactly what is currently filtered as a CSV; filename reflects the active date range; Client column populated for client-linked projects; integrates seamlessly with all filter dimensions (date range, project, client, tag, notes search)
- ✅ Peak hours distribution - Reports page section showing a 24-bar chart of when (by hour of day) you work most; entry time is accurately sliced across hour boundaries so multi-hour sessions count correctly; peak hour highlighted in orange; top-quartile hours shown in muted orange; summary chips for peak hour, active hours, and dominant work period (Morning/Afternoon/Evening/Night); period breakdown grid below the chart with the dominant period highlighted; hover tooltip per bar shows time range, duration, and percentage of total
- ✅ Today's progress indicator - persistent live widget in the desktop sidebar showing today's total tracked time with a circular progress ring; ring fills proportional to the implied daily goal (weeklyGoal ÷ 5) when a weekly goal is configured, turns green at 100%; animated pulse dot indicates a timer is currently running; hover tooltip shows exact time and goal progress; ticks live every second while the timer is active; no goal configured = static muted ring
- ✅ Per-tag weekly goals - set a target hours/week for any tag in Settings > Tag Weekly Goals; weekly progress bars in Reports track each tag independently; bars turn green when the goal is reached, amber at 75%+; remaining or over-goal time shown below each bar; only tags that appear on at least one entry are listed; ordered by progress descending so the most-advanced goals surface first
- ✅ Saved filter presets - name and save any combination of Log filters (client, project, task, tag, notes search, date range) as a named preset; one-click apply from pills in the Log page; active preset highlighted in orange with a modified-state indicator (`*`) when filters have been changed after applying; delete with two-click confirmation; preset pills only appear when presets exist or a filter is active; "Save filter" button appears whenever any filter is active; preset names auto-suggest from the active filter dimensions; stored in `taskpotato:filter-presets`
- ✅ Group by Project on the Log page - pivot the entry list from day buckets to project buckets; each group shows total tracked time, entry count, and a per-group select-all checkbox; entries within each group sorted newest-first with a date label; toggle with the "By Project" button or press `G`
- ✅ Per-client monthly hour budgets - set a monthly hour cap on any client (Settings > Clients); Reports page shows a "Client Retainer Budgets" card with per-client burn progress bars, over-budget / near-limit badges, hours-used / budget, and remaining time; scoped to the current calendar month; burn calculated from all entries on projects associated with each client; sorted by % burn descending so most-at-risk clients surface first
- ✅ Invoice tracking - create invoices from billable time entries, track draft/sent/paid status, and mark entries as invoiced to prevent double-billing; `CreateInvoiceModal` lets you filter by client and date range to select unbilled entries; live preview shows total time and earnings per project; sequential invoice numbering (INV-001...); `InvoiceList` on the Reports page shows all invoices with status badges, entry counts, earnings, and project badges; per-invoice detail modal with full entry breakdown grouped by project; Earnings section gains an `+ Invoice unbilled` shortcut button and a per-project invoiced progress indicator showing what fraction of each project's earnings has been invoiced; Log page shows an `invoiced` green badge on entries that are part of an invoice; deleting an invoice reverts entries to unbilled; JSON export/import includes invoices
- ✅ Daily Work Journal - per-day Markdown notes attached to each day in the Log (separate from per-entry descriptions); amber `Note` pill in each day header opens an inline editor with Write/Preview tabs; notes render as a Markdown block above the entry list when a day is expanded; press `J` anywhere on the Log page to open today's note; `Ctrl+Enter` / `Cmd+Enter` saves; word count footer; delete note button; JSON export/import includes day notes
- ✅ Per-project weekly targets - set a target hours/week on any project (Settings > Projects or the inline project form on the Timer page); Reports page shows a "Project Weekly Targets" card in weekly mode with per-project progress bars; bars color-code green when done, amber at 75%+, and muted below; over-goal and near-target badges; remaining or over-goal time shown below each bar; projects sorted by progress percentage descending so the most-advanced targets surface first; `Nh/wk` badge shown next to project name in Settings; stored as `weeklyTargetHours` on the project record and fully backward-compatible
- ✅ Weekday distribution chart - Reports page section showing time tracked broken down by day of week (Mon-Sun); 7-bar chart with the peak day highlighted in orange; summary chips for peak day, active days, and empty days; hover tooltip per bar shows total time, percentage of range total, and average per occurrence; toggle between Total and Avg/week views when the selected range spans more than one week; no new storage keys - pure derivation from existing entries
- ✅ Pinned projects - star any project in Settings to float it to the top of every project dropdown across the app (timer, log filter, entry editor, quick log, split modal, template form, bulk reassign); pinned projects surface in a ⭐ Pinned optgroup above all others; flat list is preserved when nothing is pinned; stored directly on the project record, zero new storage keys, round-trips through JSON export/import
- ✅ Time entry overlap detection - entries flagged with an ⚠ overlap badge in the Log when their time range conflicts with another entry; amber warning banner at the top of the Log page when any overlaps exist in the full dataset; live overlap advisory in the entry editor that updates reactively as start/stop times are changed, listing each conflicting entry with its time range, project, and description; non-blocking - save is not prevented, conflicts are surfaced for manual resolution; uses the full unfiltered dataset so conflicts outside the current filter are still detected
- ✅ Week-over-week comparison - Reports page section (weekly mode only) showing current vs. previous week side-by-side; overall totals with proportional fill bars and a net delta badge (green ↑ / red ↓); per-project dual-bar breakdown with individual delta badges showing absolute duration change and percentage; bars scaled relative to the combined weekly totals so widths are directly comparable across projects; navigating back through historical weeks always compares against the correct predecessor; pure derivation from existing entries, zero new storage
- ✅ Quick resume on Timer page - a **Continue** strip shows the 3 most recently used distinct entry configurations as one-click resume buttons; clicking any entry pre-fills all timer fields (description, project, task, tags, billable flag) and immediately starts the timer; entries are deduplicated by (notes, projectId, taskId) so you see 3 distinct types of work, not 3 copies of the same entry; press `C` anywhere on the Timer page to resume the most recent entry without touching the mouse; strip is hidden while a timer is running; powered by the existing `completedEntries` array - zero new storage keys
- ✅ Untracked gap detection - toggle the **Gaps** button in the Log page header to surface dead time between consecutive entries for any day; each gap renders as a dashed-border row below the day's entry list with the exact time range, duration, and a **+ Fill gap** button; clicking Fill gap opens a pre-seeded modal with the gap's start and end times ready for description, project, task, tags, and billable flag; start/end times are editable in case you want to fill only part of the gap; filled entries land in the correct day group immediately; gaps smaller than 1 minute are ignored; purely derived from existing entries with no new storage keys

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

