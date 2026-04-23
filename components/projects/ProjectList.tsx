"use client";

import { useState } from "react";
import { Project, Task } from "@/types";
import { Button } from "@/components/ui/Button";
import { ProjectForm } from "./ProjectForm";
import { TaskList } from "@/components/tasks/TaskList";

interface ProjectListProps {
  projects: Project[];
  tasks: Task[];
  onAddProject: (name: string, color: string, budgetHours?: number) => void;
  onUpdateProject: (id: string, patch: Partial<Omit<Project, "id" | "createdAt">>) => void;
  onDeleteProject: (id: string) => void;
  onAddTask: (projectId: string, name: string, notes: string) => void;
  onUpdateTask: (id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  onDeleteTask: (id: string) => void;
}

export function ProjectList({
  projects,
  tasks,
  onAddProject,
  onUpdateProject,
  onDeleteProject,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: ProjectListProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const active = projects.filter((p) => !p.archived);
  const archived = projects.filter((p) => p.archived);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Projects</h2>
        <Button variant="primary" size="sm" onClick={() => setAddOpen(true)}>
          + New Project
        </Button>
      </div>

      {active.length === 0 && (
        <p className="text-sm text-zinc-600 italic py-4 text-center">
          No projects yet. Create one.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {active.map((project) => {
          const projectTasks = tasks.filter((t) => t.projectId === project.id);
          const expanded = expandedId === project.id;

          return (
            <div
              key={project.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0 cursor-pointer"
                  style={{ backgroundColor: project.color }}
                  onClick={() => setExpandedId(expanded ? null : project.id)}
                />
                <button
                  className="flex-1 text-left text-sm font-medium text-zinc-200 hover:text-white transition-colors truncate"
                  onClick={() => setExpandedId(expanded ? null : project.id)}
                >
                  {project.name}
                </button>
                <span className="text-xs text-zinc-600">
                  {projectTasks.filter((t) => !t.archived).length} tasks
                </span>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs px-2 py-1"
                    onClick={() => setEditingProject(project)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs px-2 py-1 text-zinc-500"
                    onClick={() => onUpdateProject(project.id, { archived: true })}
                  >
                    Archive
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    onClick={() => onDeleteProject(project.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {expanded && (
                <TaskList
                  project={project}
                  tasks={projectTasks}
                  onAddTask={onAddTask}
                  onUpdateTask={onUpdateTask}
                  onDeleteTask={onDeleteTask}
                />
              )}
            </div>
          );
        })}
      </div>

      {archived.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="text-sm text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            {showArchived ? "Hide" : "Show"} {archived.length} archived project
            {archived.length !== 1 ? "s" : ""}
          </button>

          {showArchived && (
            <div className="flex flex-col gap-2 mt-3">
              {archived.map((project) => (
                <div
                  key={project.id}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl px-4 py-3 flex items-center gap-3"
                >
                  <div
                    className="w-3 h-3 rounded-full opacity-40"
                    style={{ backgroundColor: project.color }}
                  />
                  <span className="flex-1 text-sm text-zinc-500 line-through">
                    {project.name}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs px-2 py-1"
                    onClick={() => onUpdateProject(project.id, { archived: false })}
                  >
                    Restore
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs px-2 py-1 text-red-400 hover:bg-red-500/10"
                    onClick={() => onDeleteProject(project.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ProjectForm
        open={addOpen}
        onSave={({ name, color, budgetHours }) => {
          onAddProject(name, color, budgetHours);
          setAddOpen(false);
        }}
        onClose={() => setAddOpen(false)}
      />

      {editingProject && (
        <ProjectForm
          open={!!editingProject}
          initial={editingProject}
          title="Edit Project"
          onSave={({ name, color, budgetHours }) => {
            onUpdateProject(editingProject.id, { name, color, budgetHours });
            setEditingProject(null);
          }}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
}
