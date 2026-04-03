# 🥔 TaskPotato

A local-first time tracking web application. No backend. No accounts. No data leaves your machine.

**Live:** https://colt4d5.github.io/taskpotato

---

## Status

🚧 **Active Development — Night 1 complete**

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
- ⬜ Log view (entry list grouped by day)
- ⬜ Edit/delete entries
- ⬜ Project CRUD with color picker
- ⬜ Reports (charts, summaries)
- ⬜ Theme toggle
- ⬜ JSON export/import
- ⬜ GitHub Actions deploy workflow

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
