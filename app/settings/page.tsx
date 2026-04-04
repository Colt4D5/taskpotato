"use client";

import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { useStorage } from "@/hooks/useStorage";
import { AppSettings, DEFAULT_SETTINGS } from "@/types";
import { ProjectList } from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  const { projects, addProject, updateProject, deleteProject } = useProjects();
  const { tasks, addTask, updateTask, deleteTask } = useTasks();
  const [settings, setSettings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      projects,
      tasks,
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

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold text-zinc-100 mb-8">Settings</h1>

      {/* Preferences */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Preferences</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
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
              <p className="text-sm font-medium text-zinc-200">Export data</p>
              <p className="text-xs text-zinc-500">
                Download your projects and tasks as JSON
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={handleExport}>
              Export
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
