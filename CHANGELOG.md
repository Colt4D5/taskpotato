## [4.5.0] — 2026-05-26

### Added
- **Daily Work Journal** — per-day markdown notes attached to each day in the Log, separate from per-entry descriptions; for standups, blockers, wins, and anything that belongs to the day rather than a single time entry
  - `useDayNotes` hook (`hooks/useDayNotes.ts`) — localStorage-backed store under `taskpotato:day-notes`; stored as a flat `Record<string, string>` keyed by `YYYY-MM-DD`; exposes `getNote(dateKey)`, `setNote(dateKey, content)`, and `deleteNote(dateKey)`; `setNote` with empty or whitespace content auto-deletes the key instead of storing a blank string; reactive via the existing `taskpotato:storage-update` event bus so all consumers stay in sync across tabs
  - `DayNote` component (`components/log/DayNote.tsx`) — self-contained note editor with an inline trigger button rendered in each day header of the Log:
    - **Trigger button** — amber `Note` pill when a note exists, muted `Add note` when empty; appears next to the collapse chevron in each day row header
    - **Modal editor** — full-screen overlay with a resizable `<textarea>` in write mode; full Markdown preview tab (same `renderMarkdown` + `prose prose-invert` path used by `EntryEditor`); write/preview tab toggle in the modal header
    - **Keyboard shortcuts** inside the editor: `Ctrl+Enter` / `Cmd+Enter` saves and closes; `Escape` cancels and reverts the draft to the last saved state
    - **Word count** footer chip while writing; **Delete note** button appears when content is unchanged from the saved version (i.e. you opened an existing note without editing it)
    - `forceOpen` prop + `onOpenChange` callback allows parent components to programmatically open the modal (used by the `J` keyboard shortcut on the Log page)
  - **Inline note preview** — when a day section is expanded and it has a note, the note renders as a compact Markdown block (amber tint, `prose-invert prose-sm`) between the day header and the entry list; click the amber `Note` button in the header to edit
  - **`J` keyboard shortcut** on the Log page — press `J` anywhere (when not in an input) to open the day note editor for today without scrolling; `KeyboardShortcutsHelp` updated with the new shortcut
  - `EntryList` — accepts new `getDayNote` and `onSaveDayNote` props; renders the `DayNote` trigger in each day header and the inline note preview block when a note exists for the day; both props are optional for backward compatibility
  - Log page (`app/log/page.tsx`) — mounts `useDayNotes`, threads `getDayNote`/`saveDayNote` into `EntryList`, and mounts a hidden top-level `DayNote` for today to handle the `J` shortcut (modal overlays render outside the collapsed day list)
  - JSON export/import — `dayNotes` object included in the export payload; restored on import when the field is present and is a non-array object; backward-compatible (import silently skips if absent)

## [4.4.0] — 2026-05-25

### Added
- **Invoice tracking** — create invoices from billable time entries, track draft/sent/paid status, and mark entries as invoiced so you never double-bill a client
  - `Invoice` type (`types/index.ts`) — new interface with `id`, `number` (user-defined, e.g. `INV-001`), `clientId`, `projectIds`, `entryIds`, `totalMs`, `totalEarnings`, `status` (`draft` | `sent` | `paid`), `issuedAt`, `sentAt?`, `paidAt?`, and `notes?` fields
  - `TimeEntry.invoiceId?: string` — new optional field set when an entry has been added to an invoice; present on `InvoiceId`-marked entries; absent means unbilled; fully backward-compatible
  - `useInvoices` hook (`hooks/useInvoices.ts`) — localStorage-backed CRUD stored under `taskpotato:invoices`; exposes `invoices`, `addInvoice`, `updateInvoice`, `deleteInvoice`, `markSent`, `markPaid`, and `nextInvoiceNumber` (auto-generates sequential `INV-NNN` numbers)
  - `markEntriesInvoiced(ids, invoiceId)` — new `useEntries` method; batch-patches `invoiceId` onto selected entries in a single `setEntries` pass
  - `unmarkEntriesInvoiced(ids)` — new `useEntries` method; removes `invoiceId` from entries when an invoice is deleted, returning them to unbilled state
  - `CreateInvoiceModal` component (`components/reports/CreateInvoiceModal.tsx`) — modal for building a new invoice:
    - Invoice number field pre-populated with the next sequential number (editable)
    - Optional client filter dropdown — scope entry selection to a specific client
    - Date range pickers (From / To) defaulting to the current month
    - Memo / notes textarea for payment terms or other details
    - Live entry preview: shows candidate unbilled billable entries (completed, not already invoiced, in range, matching client) grouped by project with entry count, total time, and earnings per project; updates reactively as filters change
    - Entry count, total tracked time, and total earnings summary in the preview header
    - Validation: rejects empty invoice number, inverted date ranges, and empty entry sets with inline error messages
    - Create button disabled when no eligible entries exist
  - `InvoiceList` component (`components/reports/InvoiceList.tsx`) — Invoices section on the Reports page showing all invoices:
    - Each row: invoice number (clickable for detail), status badge (`Draft` / `Sent` / `Paid` with color coding — zinc / amber / green), optional client pill, issue date, entry count, total time, project badges, and earnings
    - Per-row hover actions: **Mark sent** (draft only), **Mark paid** (sent only), **View** (detail modal), **Delete** (two-click confirmation)
    - Deleting an invoice calls `unmarkEntriesInvoiced` so those entries revert to unbilled and become available for future invoices
    - Empty state message with a helpful explanation when no invoices exist
    - `+ New Invoice` button in the section header
  - `InvoiceDetailModal` — full breakdown of a single invoice:
    - Header info grid: status, client, issued date, sent/paid timestamps (when available), total time, total earnings
    - Memo/notes block when set
    - Per-entry list grouped by project: each entry shows date, description, and duration; project rows show subtotal time and earnings
    - **Mark sent** / **Mark paid** action buttons in the modal footer (contextual on status)
  - Reports page — `InvoiceList` and `CreateInvoiceModal` mounted below the Project Budgets section; `CreateInvoiceModal` defaults `nextInvoiceNumber()` on every open so the number is always fresh after prior invoices are created
  - `EarningsBreakdown` — enhanced with invoice awareness:
    - **`+ Invoice unbilled` button** appears in the section header when unbilled billable entries with project rates exist; opens `CreateInvoiceModal` directly from the earnings view
    - **Per-project invoiced badge** — amber `$X invoiced` pill shown next to the project name when any portion of its earnings in the current range has been invoiced
    - **Dual-tone progress bar** — the existing green bar now renders a brighter green overlay proportional to the invoiced fraction so you can see at a glance what portion of each project's earnings has been invoiced vs. still outstanding
  - Log page — `EntryRow` shows a `invoiced` green pill badge on entries that have been added to an invoice; visually distinct from the `non-billable` badge; renders next to tags
  - Settings page — `invoices` array included in JSON export payload and restored on import (backward-compatible: import silently skips if field absent)
  - JSON export/import — `invoices` round-trips automatically; `InvoiceId` fields on entries also persist, so the invoiced state is preserved across backup/restore cycles

## [4.3.0] — 2026-05-19

### Added
- **Per-client monthly hour budgets** — set a monthly hour cap on any client and track retainer burn on the Reports page
  - `Client.monthlyBudgetHours?: number` — new optional field on the `Client` type; `undefined` or `0` means no budget; fully backward-compatible with all existing client records
  - `ClientForm` — new **Monthly Budget (hours)** numeric input in the create/edit modal; optional; accepts decimals (e.g. 40, 37.5); validation rejects non-positive values; help text explains Reports page usage; field persists correctly through edit round-trips
  - `ClientList` — monthly budget displayed inline as an amber `Nh/mo budget` label under the client name when a budget is set; passed through the `onAdd`/`onUpdate` props to storage
  - `useClients.addClient()` — updated signature accepts optional `monthlyBudgetHours` as 4th parameter; stored on the client record; zero and absent treated identically (no budget)
  - `ClientBudgetCard` component (`components/reports/ClientBudgetCard.tsx`) — Reports page section showing current-month burn per budgeted client:
    - Only clients with a `monthlyBudgetHours > 0` are rendered; card returns `null` when none exist — no noise for users who don't use this feature
    - Burn is scoped to the **current calendar month** (midnight-to-midnight boundaries, local time); caller-independent so the card always reflects the live month regardless of what date range is selected in Reports
    - Month label (e.g. `May 2026`) shown in the card header so the scope is always explicit
    - Each row shows the client color dot, name, burn progress bar, `tracked / budget` monospace label, and a `% used / remaining or over` detail line
    - Color coding: orange while under 80%, amber at 80–99% with a `near limit` badge, red at 100%+ with an `over budget` badge
    - Rows sorted by burn percentage descending — the most at-risk client surfaces first
    - Burn is aggregated from all completed entries on projects whose `clientId` matches; project↔client linkage via the same `Project.clientId` field used by `ClientBreakdown`
  - Reports page — `ClientBudgetCard` mounted above `ProjectBudgetCard` at the bottom of the page; receives pre-computed `monthEntries` (current-month filter of `completedEntries`) and `monthLabel` derived via `useMemo` so the filter doesn't recompute on every render
  - JSON export/import — `monthlyBudgetHours` is stored on the client object and round-trips automatically through the existing export/import path; no schema version bump required

## [4.2.0] — 2026-05-18

### Added
- **Group by Project on the Log page** — pivot the entry list from day buckets to project buckets with a single click
  - `ProjectGroupedList` component (`components/log/ProjectGroupedList.tsx`) — renders completed entries grouped by project instead of by date:
    - Each project group has a collapsible header with the project color dot, project name (or "No project" for unassigned entries), entry count, and total tracked time for that project
    - Groups are sorted by total tracked time descending so your most-worked projects surface first
    - Entries within each group are sorted newest-first; each entry shows a date label (`May 18 ·`) prepended to the time range so temporal context isn't lost when chronological grouping is gone
    - Per-group select-all checkbox in bulk mode (mirrors the per-day checkbox in day-grouped mode)
    - All entry actions work identically: Edit, Resume, Duplicate, Split, Delete — all filters and undo-delete are respected
  - **"By Project" toggle button** added to the Log page header alongside Timeline and Select; active state highlighted in orange
  - **`G` keyboard shortcut** on the Log page toggles between day grouping and project grouping (when not in an input)
  - `EntryRow` — new `showDate?: boolean` prop; when `true`, renders the formatted date (`May 18 ·`) before the time range in the sub-label; used automatically by `ProjectGroupedList`; day-grouped and timeline views are unaffected
  - `KeyboardShortcutsHelp` — `G` shortcut added to the reference modal
  - Timeline mode continues to use day grouping; switching to project grouping while timeline mode is active falls back to the list view for that mode
  - No new localStorage keys; purely a view transformation over the existing filtered entry set


### Added
- **Saved filter presets on the Log page** — name and persist any combination of active Log filters so you never have to rebuild the same filter from scratch
  - `FilterPreset` type (`types/index.ts`) — new interface with `id`, `name`, `clientId`, `projectId`, `taskName`, `tag`, `notes`, `dateRangeFrom`, `dateRangeTo`, and `createdAt` fields; captures the full state of all six Log filter dimensions
  - `useFilterPresets` hook (`hooks/useFilterPresets.ts`) — localStorage-backed CRUD stored under `taskpotato:filter-presets`; exposes `presets`, `addPreset(name, filters)` (returns the created preset), `deletePreset(id)`, and `renamePreset(id, name)`
  - `FilterPresetsBar` component (`components/log/FilterPresetsBar.tsx`) — compact pill row rendered on the Log page above the field filters:
    - Only visible when at least one saved preset exists **or** a filter is currently active — no permanent UI overhead for users who don't use presets
    - Each saved preset renders as a pill button; clicking an inactive preset applies all its stored filter values at once and highlights the pill in orange; clicking an already-active preset deactivates it (filters remain in place)
    - **Active + modified indicator** — when filters have been changed since applying a preset, a subtle `*` is appended to the pill label so you know the view no longer exactly matches the saved preset
    - **Delete** — each pill has an `×` button that only becomes visible on hover; first click shows `×?` (confirmation state), second click deletes; confirmation auto-cancels after 3 seconds to prevent accidental deletions; if the deleted preset was active, the active tracking is cleared
    - **"Save filter" button** — a dashed `+` pill appears whenever any filter is active; clicking it opens an inline name input pre-populated with an auto-suggested name derived from the active filter dimensions (e.g. `#frontend + range`); submit saves the preset and immediately marks it active; press `Escape` to cancel without saving
    - Auto-name suggestion reads the active dimensions (project, client, tag, task, notes snippet, date range) and joins them with ` + ` so the suggested name is meaningfully descriptive by default
  - Log page — `clearFilters()` also clears the active preset id; `activePresetId` state tracks which preset is currently applied; `applyPreset()` sets all six filter state fields atomically from the preset record; `saveCurrentAsPreset()` calls `addPreset` and immediately activates the returned preset id
  - JSON export/import — filter presets are **not** included in the data export by design (they are UI preferences, not time-tracking data); stored under their own `taskpotato:filter-presets` key alongside the other non-entry keys
  - No changes to existing filter behavior — all existing filters work identically; presets are additive

## [4.0.0] — 2026-05-16

### Added
- **Tag autocomplete** — typing in any tag field now shows a live filtered suggestion dropdown of all previously-used tags, so you never have to remember exact tag names or manually type ones you've used before
  - `TagInput` component enhanced with an optional `allTags?: string[]` prop; when provided, a suggestion dropdown appears as soon as the input has text; fully backward-compatible — callers that don't pass `allTags` get identical behavior to before
  - Suggestions filter in real time to tags containing the current input text (case-insensitive); prefix matches sorted first, then alphabetical; up to 8 suggestions rendered per keystroke; already-applied tags are excluded from the list
  - Query text highlighted in amber within each suggestion item so you can see exactly why the match surfaced
  - Full keyboard navigation: `↑` / `↓` to move through items, `Enter` or `Tab` to apply the highlighted suggestion, `Escape` to dismiss without applying, `Tab` with no item highlighted accepts the top suggestion; click on any item works as expected
  - ARIA semantics: `role="combobox"` on the input, `role="listbox"` on the dropdown, `aria-autocomplete`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-selected` per option — screen-reader accessible
  - `allTags` derived value added to `useEntries` — computes all unique tags across every entry (including running), sorted by usage frequency descending so your most-used tags surface first in suggestions
  - Wired into all five tag entry points: TimerWidget (start new entry), EntryEditor (edit existing entry), QuickEntryForm (manual log entry), TemplateForm (create/edit template in Settings)
  - `EntryRow`, `EntryList`, `QuickEntryForm`, `TemplateList` interface types updated with the optional `allTags?` prop; threaded through from each page-level component down to the leaf inputs
  - No new localStorage keys; `allTags` is computed live from existing `taskpotato:entries` — zero migration, zero storage overhead

## [3.9.0] — 2026-05-15

### Added
- **Per-tag weekly goals** — set a target hours/week for individual tags in Settings; track progress per tag in the Reports page (weekly mode only)
  - `AppSettings.tagGoals?: Record<string, number>` — new optional field mapping tag names to weekly hour targets; `0` or absent means no goal; fully backward-compatible (existing settings without the field behave identically to before)
  - `TagGoalManager` component (`components/settings/TagGoalManager.tsx`) — Settings section rendered after the Tag Manager; lists every tag that appears on at least one entry (sorted alphabetically); per-tag numeric input (0–168, step 0.5h) with `×` clear button; existing goal displayed as an amber `Nh/wk` badge next to the tag name; returns `null` when no tags exist yet
  - `TagGoalProgress` component (`components/reports/TagGoalProgress.tsx`) — Reports section rendered in weekly mode immediately after the overall WeeklyGoalProgress card; only renders when at least one tag goal is configured:
    - Progress bar per tag filling proportionally to `trackedMs / goalMs` for the current week (respects `weekStartsOn` and `weekOffset`)
    - Color coding: muted orange below 75% progress, brighter orange at 75–99%, green at 100%+
    - Inline `✓ Done` badge when goal is reached; `+Xh over` hint when exceeded
    - `remaining` / `no time yet` sub-labels when under goal
    - Sorted by progress percentage descending so the most-advanced goals surface first; ties broken by goal size
  - Wired into `app/settings/page.tsx` (between TagManager and Templates sections) and `app/reports/page.tsx` (after WeeklyGoalProgress, weekly mode only)
  - No new localStorage keys — `tagGoals` stored inline on the existing `taskpotato:settings` object; zero migration required; fully round-trips through the JSON export/import

## [3.8.0] — 2026-05-14

### Added
- **Today's progress indicator in the sidebar nav** — a persistent, live "how much have I tracked today?" widget in the desktop sidebar that answers the most common time-tracking question without requiring any navigation
  - `hooks/useTodayTotal.ts` — `useTodayTotal(entries)` computes today's total tracked milliseconds from all entries; clamps each entry to today's midnight boundaries so sessions that span midnight are only credited for today's portion; for the running entry, accounts for `offsetMs` (prior accumulated time from resumes) plus live elapsed time from `resumedAt` or `startedAt`; installs a 1-second `setInterval` while any timer is running and tears it down the moment the timer stops — no wasted ticks when idle
  - `components/layout/TodayProgress.tsx` — compact circular-ring widget rendered in the desktop sidebar footer (above `⌘` and `?` buttons):
    - **Goal mode** (weekly goal set in Settings): ring fills proportionally to `todayMs / (weeklyGoalHours ÷ 5)`; orange while in progress, turns green when the daily implied goal is reached; `stroke-dashoffset` animated with a 1-second CSS linear transition for a smooth live fill
    - **No-goal mode**: full-opacity muted orange static ring — visually distinct from empty, never draws proportional fill
    - **Empty state**: dim zinc ring with `0m` label when nothing is tracked today
    - Time label centered inside the ring; splits into two lines (`4h` / `23m`) when there is an hours component to fit the 38×38 ring footprint; single line (`23m`) for sub-hour totals
    - Animated orange pulse dot in the corner when a timer is currently running
    - Hover tooltip renders to the right of the sidebar with exact time and, when a goal is set, `Today: 4h 12m / 8h daily goal`
    - Fully client-side; reads from the existing `taskpotato:entries` and `taskpotato:settings` localStorage keys — zero new storage, zero migration
  - Wired into `Nav.tsx` immediately above the `⌘` command-palette button; only visible on the `md:` breakpoint sidebar (no mobile bottom nav clutter)



### Added
- **Peak hours distribution** — Reports page section showing when (by hour of day) you do your actual work
  - `lib/peakHours.ts` — `computePeakHours(entries)` distributes completed entry time into 24 hourly buckets; uses a cursor-walk algorithm that slices each entry across hour boundaries so a 2.5-hour session spanning 10:30–13:00 is correctly attributed to hours 10, 11, 12, and 13 proportionally — not just the start hour
  - `peakHourStats(buckets)` — derives `peakHour`, `peakMs`, `activeHours`, and `topQuartileHours` (top 25% of active hours by time); used for chart coloring and summary chips
  - `formatHourLabel(hour)` — formats 0–23 as human-readable 12-hour labels ("12 AM", "1 PM", etc.)
  - `PeakHoursChart` component (`components/reports/PeakHoursChart.tsx`) — 24-bar chart rendered with three visual tiers:
    - **Peak bar** — brightest orange (`bg-orange-400`), the single highest-volume hour
    - **Top-quartile bars** — muted orange (`bg-orange-500/60`), top 25% of active hours
    - **Other bars** — zinc (`bg-zinc-700/80`), below the threshold
  - Summary chips above the chart: peak hour with duration, active hours count, and dominant work period label
  - Hover tooltip per bar: time range (e.g. `10 AM–11 AM`), formatted duration, and percentage of total tracked time
  - Period breakdown grid below the chart — four cells (Morning 5–11, Afternoon 12–16, Evening 17–20, Night 21–4) showing total time and percentage; dominant period highlighted in orange
  - The peak hour, dominant period, and period breakdown react to whatever date range is currently selected in Reports — Weekly or Custom Range
  - Component returns `null` when no tracked time exists in the range — no empty-state noise
  - Inserted on the Reports page after the "Hours per Day" bar chart section, before the Earnings breakdown


### Added
- **Description autocomplete on the Timer page** — as you type in the "What are you working on?" field, a dropdown suggests previously-used descriptions and auto-fills the project, task, tags, and billable flag alongside them
  - `DescriptionAutocomplete` component (`components/timer/DescriptionAutocomplete.tsx`) — drop-in replacement for the plain `<input>` in `TimerWidget`; fully keyboard-navigable dropdown with ARIA attributes (`role="listbox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-activedescendant`)
  - `buildSuggestions(entries)` — derives up to 50 unique suggestions from all completed entries; groups by normalized description text; each suggestion carries the most-recently-used project/task/tags/billable state; sorted by last-used timestamp so the most recent descriptions appear first
  - `filterSuggestions(suggestions, query)` — case-insensitive substring filter ranked so prefix matches appear before mid-string matches; returns up to 8 results per keystroke
  - Each dropdown item shows: project color dot, notes text with query match **highlighted in amber**, task name (when set), project badge, and a use-count hint (e.g. `×5`) when the description has been used more than once
  - Keyboard controls: `↑` / `↓` to navigate items; `Enter` to accept highlighted item (or start/stop timer when no item is selected); `Tab` to accept the top match without closing the keyboard focus; `Escape` to dismiss; click outside also dismisses
  - Applying a suggestion auto-fills all five fields at once — description, project, task, tags, and billable — so you can start a recurring entry with a single keypress from anywhere in the input
  - The dropdown is suppressed while a timer is already running (description is locked mid-session)
  - No new storage key — reads from the existing `taskpotato:entries` array; zero data migration required
  - `Enter` to start/stop timer behavior is fully preserved — pressing Enter with no autocomplete item selected still toggles the timer as before

## [3.5.0] — 2026-05-11

### Added
- **Export filtered entries from the Log page** — download exactly what is currently displayed as a CSV, not the entire dataset
  - **Export button** added to the Log page header (between the Timeline toggle and the Log time button); only visible when the filtered entry list is non-empty; displays a download arrow icon
  - Clicking Export calls `exportFilteredCSV()` with the current `filteredEntries` array — the button respects every active filter dimension: date range, client, project, tag, notes search, and task name
  - **Smart filename** — when a date range is active the filename encodes the range (e.g. `taskpotato-filtered_2026-05-01_2026-05-11.csv`); otherwise falls back to today's date (`taskpotato-filtered_2026-05-11.csv`)
  - **Client column** — the CSV now includes a `Client` column populated from the project → client relationship; if the entry's project has a client assigned and client names are available, the client name is written; blank otherwise; this column also appears in the full Settings export for consistency
  - `exportFilteredCSV()` added to `lib/csvExport.ts` — accepts entries, projects, tasks, an optional `clientNames` Map, and an optional `rangeLabel` string; internally delegates to the shared `buildRows()` helper so all CSV formatting logic lives in one place
  - Refactored `lib/csvExport.ts`: extracted `buildRows()` (shared by both export paths), `triggerDownload()` (shared download trigger), and the `HEADERS` constant; the existing `exportCSV()` used by Settings is unchanged in behavior
  - No keyboard shortcut (the operation is contextual on filtered state — not a global action)



### Added
- **Printable Timesheet / Invoice View** — generate a clean, print-ready timesheet for any Reports period directly in the browser
  - `PrintTimesheetModal` component (`components/reports/PrintTimesheetModal.tsx`) — full-screen white overlay rendering a professional timesheet document:
    - **Header** — TaskPotato branding, period label (e.g. "May 5 – May 11, 2026"), total duration, billable/non-billable split (when applicable), and total earnings (when projects have hourly rates configured)
    - **Entry table** — one row per entry, sorted chronologically; columns: Date (grouped — date shown only on first row of each day), Time (start → end), Project / Task (with color dot, non-billable badge, tags), Notes, Duration (H:MM), and Earnings (when applicable); totals row in the table footer
    - **Project Summary table** — below the entry table; aggregates total time, billable time, and earnings per project; collapses billable and earnings columns when those features are not in use for the current period
    - **Footer** — generation date and TaskPotato credit
    - Non-billable entries show a subtle "non-billable" pill badge; entries without a rate show "—" in the Earnings column; both columns hide entirely when not relevant to the current data set
    - Tags shown as `#tag` chips inline under each entry's project row
    - Earnings column and project summary earnings column only appear when at least one project in the period has an hourly rate and at least one entry is billable with that project
  - **Print CSS** — a `<style>` block injected while the modal is open hides everything except the modal root during `window.print()`; produces a clean single-file PDF with no browser chrome, no dark UI, no nav
  - **"Print / Save PDF" button** in the modal header triggers `window.print()`; works with browser's native Save as PDF option
  - **"Print" button** added to the range total card header on the Reports page (alongside the existing Copy Summary button); disabled when the current period has no entries; opens `PrintTimesheetModal` for the current mode's date range and period label
  - Works with both Weekly and Custom Range modes — whatever range is currently displayed in Reports is exactly what renders in the timesheet
  - `Escape` key dismisses the modal; clicking the backdrop also closes it

## [3.3.0] — 2026-05-09

### Added
- **Undo for entry deletion** — a 5-second grace window before any deleted entry is actually removed from storage
  - `useUndoDelete` hook (`hooks/useUndoDelete.ts`) — manages a pending-delete queue; stores the in-flight entries and their ids; sets a 5-second timeout before calling `deleteEntries`; exposes `stage(entries)`, `undo()`, and `commit()` methods
  - Deleting a single entry from `EntryRow` now calls `stageDelete([entry])` instead of immediately removing it; the entry is hidden from the list via a `pendingIds` set passed as `hiddenIds` to `EntryList`
  - Bulk delete in `BulkActionBar` similarly calls `stageDelete(selectedEntries)` — the entire selection vanishes from view but is not yet purged from localStorage
  - If a second delete is staged while one is already pending, the first is committed immediately before the new pending delete begins
  - `UndoToast` component (`components/ui/UndoToast.tsx`) — fixed toast rendered at the bottom center of the screen:
    - Shrinking orange progress bar animating from 100% → 0% over the 5-second window
    - Label text: `"1 entry deleted"` or `"N entries deleted"`
    - **Undo** button cancels the timer and restores entries to the list instantly — no data is ever written to storage during the pending window, so undo is lossless
    - **×** dismiss button commits the delete immediately without waiting for the timer
    - `aria-live="assertive"` for screen reader announcements
  - `EntryList` — new optional `hiddenIds?: Set<string>` prop; entries in this set are filtered out of the rendered list before grouping by day, making soft-deleted entries invisible without mutating the actual storage
  - Keyboard shortcut `Escape` dismisses the toast and commits the delete when focus is not in an input (handled by existing Escape listener which exits bulk mode — undo must be clicked explicitly)

## [3.2.0] — 2026-05-08

### Added
- **Notes full-text search on the Log page** — find any entry by its description without scrolling through the entire log
  - New "Search notes…" text input in the Log filter bar; filters `filteredEntries` to only entries whose `notes` contain the query (case-insensitive substring match)
  - Press `/` anywhere on the Log page (when not in another input) to instantly focus the search field and select all text — no mouse required; press `Esc` inside the field to clear the query and blur
  - `HighlightText` component (`components/ui/HighlightText.tsx`) — renders a string with all occurrences of the search query highlighted in amber (`bg-amber-400/30 text-amber-200`) using a regex split; resets to plain rendering when query is empty
  - `EntryRow` — accepts new `searchQuery?: string` prop; passes it to `HighlightText` for the notes/description field so matches are visible inline without opening the editor
  - `EntryList` — accepts and threads `searchQuery` prop through to each `EntryRow`
  - `LogStatsBar` stat chips update live as notes search filters the entry set
  - Clears with "Clear all" alongside all other active filters
  - `KeyboardShortcutsHelp` — `/` shortcut added to the reference modal

## [3.1.0] — 2026-05-07

### Added
- **Copy Summary** — one-click clipboard export of a formatted Markdown summary from the Reports page
  - `lib/reportSummary.ts` — `buildReportSummaryData()` aggregates the current range into a clean data structure (totals, billable split, project rows, task rows, tag rows, entry count); `formatReportSummary()` renders it as a ready-to-paste Markdown string with bold headers and bullet lists
  - `CopySummaryButton` component (`components/reports/CopySummaryButton.tsx`) — stateful button rendered in the range-total card header; three visual states: idle (clipboard icon), copied (green checkmark + "Copied!"), failed (red X + "Failed"); auto-resets to idle after 2 seconds; disabled with `cursor-not-allowed` when no data exists for the period
  - Output format includes: period label, total duration, billable/non-billable breakdown with percentages, entry count, breakdown by project (with percentages), breakdown by task (with parent project name), breakdown by tag (with percentages), and a "Generated by TaskPotato" footer
  - Useful for weekly standups, client status updates, invoice descriptions, or Slack messages — paste-ready anywhere Markdown renders
  - Wired into both Weekly and Custom Range modes — summary always reflects whatever period is currently displayed

## [2.9.0] — 2026-05-05

### Added
- **12-week rolling trend chart** — Reports page section visualizing weekly totals over the past 12 weeks
  - `WeeklyTrend` component (`components/reports/WeeklyTrend.tsx`) — bar chart spanning the 12 most recent calendar weeks (configurable week start respected)
  - Two display modes toggled by buttons in the section header:
    - **Total** — solid orange bars scaled to max week; current week rendered at full saturation, past weeks at 60% opacity
    - **Billable split** — stacked bars showing billable (green) on top and non-billable (zinc) below; proportions derived from per-entry billable flags; current week at full saturation
  - Summary chip row: 12-week total, average per active week, average billable per active week, current week total (shown only if current week has data)
  - Per-bar hover tooltip: week label, total duration, and (in billable split mode) billable + non-billable breakdown
  - Current week x-axis label highlighted in orange with bold text; empty weeks rendered as a thin baseline to show gaps
  - Legend strip shown in billable split mode
  - Hides entirely when no completed entries exist (no empty-state noise)
  - Inserted in Reports page between the Activity heatmap section and the Weekly/Custom mode toggle



### Added
- **Custom date range on Reports** — toggle between Weekly navigation and an arbitrary date range picker
  - Mode toggle buttons (`Weekly` / `Custom Range`) at the top of the Reports page; selected mode highlighted in orange
  - Custom range picker: two `<input type="date">` fields (From / To) with inline validation (start ≤ end); error message shown when range is inverted
  - Quick-select shortcut buttons: **Today**, **This week**, **This month** — fill both date pickers instantly without manual typing
  - All report sections (total, billable breakdown, hours-per-day chart, earnings, client breakdown, project breakdown, task totals, tag totals) recompute reactively for the selected range
  - Hours-per-day bar chart adapts: ranges ≤ 31 days show labeled bars; ranges > 31 days up to 60 days show a compact sparkline (bars with hover tooltips, no x-axis labels) to avoid overflow
  - Weekly goal progress card is suppressed in custom range mode (goal is defined per-week; cross-week ranges would produce misleading numbers)
  - Project Budget card continues to show all-time burn regardless of selected range (unchanged behavior)
  - Weekly mode retains the existing ← Prev / Next → navigation and "Back to this week" shortcut

## [2.6.0] — 2026-05-01

### Added
- **Log stats bar** — live summary strip above the entry list showing aggregate metrics for whatever is currently filtered
  - `LogStatsBar` component (`components/log/LogStatsBar.tsx`) — renders a row of compact stat chips: **Total** time (orange), **Billable** time with percentage (green), **Entries** count, **Days** count, and **Avg / day** (shown only when more than one day is present in the filtered set)
  - Stats recompute instantly as any filter changes — date range, project, task, tag, client — via `useMemo` over the `filteredEntries` array already wired to all filters
  - Replaces the previous plain-text "N entries in selected range" hint that only appeared when a date range was active
  - Billable calculation respects the `billable !== false` convention used throughout the app (entries without the field are treated as billable)
  - Only rendered when at least one filtered entry exists — no empty-state noise
  - Hidden in bulk-select mode to avoid layout clutter while selecting entries

## [2.5.0] — 2026-04-30

### Added
- **Entry splitting** — divide any completed entry into two entries at an arbitrary split point
  - `useEntries.splitEntry(id, splitAtMs, secondPatch?)` — replaces the original entry in-place with two entries: Entry A inherits all original fields with `stoppedAt = splitAt`; Entry B starts at `splitAt` and can optionally have a different `projectId` and `taskId` via `secondPatch`; both entries preserve notes, tags, and billable flag; operation is a single `setEntries` pass using `flatMap`
  - `EntrySplitModal` component (`components/log/EntrySplitModal.tsx`) — modal for configuring the split:
    - Shows original entry summary (description, project badge, time range, total duration)
    - Time-of-day picker (`<input type="time" step="1">`) pre-seeded to the midpoint of the entry
    - Live preview of the two resulting segment durations, updating as the split time changes
    - Project selector for the second segment (defaults to same as original)
    - Task selector for the second segment, filtered to the chosen project (hidden when project has no tasks)
    - Inline validation: rejects split time outside entry bounds, or either segment under 1 second
  - `EntryRow` — new **✂ Split** action button in the hover action bar; only shown for completed entries; hidden in bulk-select mode
  - `EntryList` — threads `onSplit` prop down to `EntryRow`
  - Log page — wires `handleSplit` → `splitEntry`; both resulting entries appear immediately in the log via existing reactive storage

## [2.4.0] — 2026-04-29

### Added
- **Per-project hourly rates & earnings breakdown** — set a billing rate on any project and track earned revenue on the Reports page
  - `Project.hourlyRate?: number` — new optional field on the `Project` type; `undefined` or absent means no rate
  - `ProjectForm` — new "Hourly Rate (USD)" numeric input in the create/edit modal; optional; dollar-sign prefix hint; accepts decimals (e.g. 150, 87.50); validation rejects negative values; help text explains Reports page usage
  - `useProjects.addProject()` — updated signature accepts optional `hourlyRate`; stored on the project record
  - `ProjectList` — threads `hourlyRate` through from form to hook on both create and edit
  - `TimerWidget` inline project creation — threads `hourlyRate` from inline `ProjectForm` to hook
  - `EarningsBreakdown` component (`components/reports/EarningsBreakdown.tsx`) — Reports page section showing billable earnings for the selected week per project:
    - Only projects with a rate configured appear
    - Only entries flagged as **billable** count toward earnings (non-billable time is excluded)
    - Each row shows the project badge, rate per hour, billable duration, and earned amount as a green monospace value
    - Horizontal progress bars scaled relative to the top-earning project
    - Weekly total in green displayed in the section header
    - Hides entirely when no projects have a rate set
  - Reports page — `EarningsBreakdown` inserted above the Client Breakdown section
  - JSON export/import — `hourlyRate` is part of the project object and round-trips automatically; no schema changes needed

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

## [2.3.0] — 2026-04-28

### Added
- **Bulk entry operations** — select multiple entries in the Log for mass actions
  - `☑ Select` button in the Log page header enters bulk-select mode; `Cancel` or `Escape` exits
  - `BulkActionBar` component (`components/log/BulkActionBar.tsx`) — sticky action bar that appears at the top of the log when in bulk mode; shows selection count with a global select-all/deselect-all checkbox; action buttons activate once ≥1 entry is selected:
    - **Reassign project** — dropdown of all projects (including "No project"); updates `projectId` and clears `taskId` on all selected entries in one write
    - **Add tag** — inline text input; tag is normalized to lowercase kebab-case before applying; only appended if the entry doesn't already have it
    - **Mark billable / Mark non-billable** — bulk toggle billable flag across all selected entries
    - **Delete** — two-click confirmation (`Delete N` → `Confirm delete`) before removal; no accidental mass wipes
  - Per-day checkbox in the day section header — select or deselect all entries within a single day; independent of other days
  - In bulk mode all day sections auto-expand so every entry is visible and selectable
  - `EntryRow` — new `selectable`, `selected`, and `onToggleSelect` props; renders a checkbox in place of the color dot; action buttons (Edit/Resume/Duplicate/Delete) are hidden while in bulk mode; selected rows get a subtle background highlight
  - `EntryList` — new `bulkMode`, `selectedIds`, `onToggleSelect`, `onSelectDay`, `onDeselectDay` props; per-day select-all via day header checkbox; suppresses collapse toggle while in bulk mode
  - `useEntries` — two new batch mutations:
    - `deleteEntries(ids[])` — single `setEntries` pass filtering out all matching ids
    - `updateEntries(ids[], patch)` — single `setEntries` pass applying the same patch to all matching entries
  - Filters are hidden while in bulk mode to keep the UI uncluttered

## [2.7.0] — 2026-05-03

### Added
- **Day timeline view** — visualize each day's time entries as proportional blocks on a 24-hour axis
  - `DayTimeline` component (`components/log/DayTimeline.tsx`) — renders a 1152px tall (48px/hour) scrollable 24-hour grid for a single day
    - Hour grid lines at every hour; heavier lines every 3 hours, strongest every 6; hour labels at 12 AM, 3 AM, 6 AM, 9 AM, 12 PM, 3 PM, 6 PM, 9 PM
    - Each entry is rendered as a colored block proportional to its actual duration; block color derives from the project color (filled at 20% opacity with a solid 3px left border)
    - Overlap detection: entries that run concurrently are split into side-by-side columns using a greedy interval algorithm — no entries are hidden or obscured
    - Entry blocks show a description label and task/duration sub-label when tall enough (≥28px); very short blocks show nothing but remain hoverable
    - Hover tooltip shows full description, exact time range, and formatted duration
    - "Now" indicator — an orange dot + horizontal line shows the current time of day when viewing today
  - Log page — new **Timeline** toggle button in the header (between the existing controls); active state highlighted in orange; timeline mode is mutually exclusive with bulk-select mode
  - `V` keyboard shortcut on the Log page toggles timeline mode (when not in an input)
  - `KeyboardShortcutsHelp` — `V` shortcut added to reference modal
  - `EntryList` — `timelineMode` prop; when true, replaces the flat entry list per day section with `DayTimeline`; collapse/expand of day sections still works normally in timeline mode

## [3.0.0] — 2026-05-06

### Added
- **Live browser tab title** — the browser tab shows the running timer at a glance, no need to keep the tab focused
  - `DynamicTitle` component (`components/layout/DynamicTitle.tsx`) — mounted in `Shell`; drives `document.title` via a `setInterval` that ticks every second
  - While a timer is running: `▶ HH:MM:SS — <description> (<project>)` — if notes are set, they appear first; if a project is selected, it appears in parentheses after the description; if only a project is set (no notes), the project name alone is shown; if neither, falls back to "Timer running"
  - When idle or after the timer is stopped: title resets to `"TaskPotato"`
  - Elapsed time calculation is consistent with `useTimer` — respects `offsetMs` and `resumedAt` for resumed entries
  - Pure side-effect component (renders `null`); zero layout impact
  - Interval is torn down and title reset on unmount or when `runningEntry` becomes `null`
