# Changelog

## 2026-04-08 — Architecture Rebuild

- Rebuilt app from scratch using Next.js (App Router) + TypeScript + Tailwind
- Full task CRUD with localStorage persistence (`taskpotato_tasks`, `taskpotato_active`)
- Start/stop timer with interrupted-session recovery on page load
- Day-grouped task sections with day totals (newest day first)
- Live tab title updating every second (⏱ Task — HH:MM:SS | TaskPotato)
- Sticky summary bar showing all-time and today's totals
- Pie chart via react-chartjs-2, collapsible, only tasks with logged time
- Drag-to-reorder within day sections (HTML5 drag API, persisted to localStorage)
- New task keyboard shortcut (N key)
- Edit modal with manual HH:MM:SS time override
- Delete with double-click confirmation
- Empty state with prompt
- Static export configured for GitHub Pages
