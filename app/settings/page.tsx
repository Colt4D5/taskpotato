"use client";

import { useRef, useState } from "react";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useEntries } from "@/hooks/useEntries";
import { useStorage } from "@/hooks/useStorage";
import { AppSettings, DEFAULT_SETTINGS, Project, Task, TimeEntry } from "@/types";
import { ProjectList } from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/Button";
import { exportCSV } from "@/lib/csvExport";

export default function SettingsPage() {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const { entries, updateEntry, deleteEntry } = useEntries();
  const [settings, setSettings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);
  const [, setStoredEntries] = useStorage<TimeEntry[]>("entries", []);
  const [, setStoredProjects] = useStorage<Project[]>("projects", []);
  const [, setStoredTasks] = useStorage<Task[]>("tasks", []);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // suppress unused warning — updateEntry/deleteEntry consumed by EntryList elsewhere
  void updateEntry; void deleteEntry;

  const handleExportJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      version: 1,
      projects,
      tasks,
      entries,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `taskpotato-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    exportCSV(entries, projects, tasks);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    setImportSuccess(false);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const raw = ev.target?.result as string;
        const data = JSON.parse(raw);
        if (!data.projects || !Array.isArray(data.projects)) throw new Error("Missing projects array");
        if (!data.tasks || !Array.isArray(data.tasks)) throw new Error("Missing tasks array");
        if (data.entries && !Array.isArray(data.entries)) throw new Error("Invalid entries field");
        setStoredProjects(data.projects as Project[]);
        setStoredTasks(data.tasks as Task[]);
        if (data.entries) setStoredEntries(data.entries as TimeEntry[]);
        setImportSuccess(true);
      } catch (err) {
        setImportError(err instanceof Error ? err.message : "Invalid JSON file");
      }
    };
    reader.readAsText(file);
    // reset so same file can be re-imported if needed
    e.target.value = "";
  };

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-8">Settings</h1>

      {/* Preferences */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Preferences</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Theme</p>
              <p className="text-xs text-zinc-500">Appearance preference</p>
            </div>
            <select
              value={settings.theme}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  theme: e.target.value as AppSettings["theme"],
                }))
              }
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="system">System</option>
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Weekly goal</p>
              <p className="text-xs text-zinc-500">Target hours per week (shown in Reports)</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={0}
                max={168}
                step={1}
                value={settings.weeklyGoalHours ?? 0}
                onChange={(e) => {
                  const val = Math.max(0, Math.min(168, Number(e.target.value)));
                  setSettings((s) => ({ ...s, weeklyGoalHours: val }));
                }}
                className="w-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm text-right focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <span className="text-sm text-zinc-500">h</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Time rounding</p>
              <p className="text-xs text-zinc-500">Round stop time to nearest interval on stop</p>
            </div>
            <select
              value={settings.timeRounding ?? 0}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  timeRounding: Number(e.target.value) as AppSettings["timeRounding"],
                }))
              }
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value={0}>Disabled</option>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Idle alert</p>
              <p className="text-xs text-zinc-500">Warn if timer runs longer than</p>
            </div>
            <select
              value={settings.idleAlertHours ?? 2}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  idleAlertHours: Number(e.target.value) as AppSettings["idleAlertHours"],
                }))
              }
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value={0}>Disabled</option>
              <option value={1}>1 hour</option>
              <option value={2}>2 hours</option>
              <option value={4}>4 hours</option>
              <option value={8}>8 hours</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Week starts on</p>
              <p className="text-xs text-zinc-500">Used in reports</p>
            </div>
            <select
              value={settings.weekStartsOn}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  weekStartsOn: Number(e.target.value) as 0 | 1,
                }))
              }
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value={1}>Monday</option>
              <option value={0}>Sunday</option>
            </select>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Default view</p>
              <p className="text-xs text-zinc-500">Page shown on launch</p>
            </div>
            <select
              value={settings.defaultView}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  defaultView: e.target.value as AppSettings["defaultView"],
                }))
              }
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="timer">Timer</option>
              <option value="log">Log</option>
              <option value="reports">Reports</option>
            </select>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section className="mb-10">
        <ProjectList
          projects={projects}
          tasks={tasks}
          onAddProject={addProject}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onAddTask={(projectId, name, notes) => addTask(projectId, name, notes)}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
        />
      </section>

      {/* Data */}
      <section>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Data</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Export as JSON</p>
              <p className="text-xs text-zinc-500">
                Download all projects, tasks, and entries as JSON
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleExportJSON}>
              Export JSON
            </Button>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Export as CSV</p>
              <p className="text-xs text-zinc-500">
                Download completed entries as a spreadsheet
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleExportCSV}>
              Export CSV
            </Button>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">Import data</p>
              <p className="text-xs text-zinc-500">
                Restore from a previous export — overwrites current data
              </p>
              {importError && (
                <p className="text-xs text-red-400 mt-1">{importError}</p>
              )}
              {importSuccess && (
                <p className="text-xs text-green-400 mt-1">Import successful.</p>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImportFile}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                Import
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
