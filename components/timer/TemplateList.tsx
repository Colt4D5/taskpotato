"use client";

import { useState } from "react";
import { EntryTemplate, Project, Task } from "@/types";
import { Button } from "@/components/ui/Button";
import { TemplateForm } from "@/components/timer/TemplateForm";

interface TemplateListProps {
  templates: EntryTemplate[];
  projects: Project[];
  tasks: Task[];
  onAdd: (
    name: string,
    projectId: string | null,
    taskId: string | null,
    notes: string,
    tags: string[],
    billable: boolean
  ) => void;
  onUpdate: (id: string, updates: Partial<Omit<EntryTemplate, "id" | "createdAt">>) => void;
  onDelete: (id: string) => void;
}

export function TemplateList({
  templates,
  projects,
  tasks,
  onAdd,
  onUpdate,
  onDelete,
}: TemplateListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EntryTemplate | null>(null);

  const getProject = (id: string | null) => projects.find((p) => p.id === id);
  const getTask = (id: string | null) => tasks.find((t) => t.id === id);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Templates</h2>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          + New template
        </Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {templates.length === 0 && (
          <p className="px-4 py-6 text-sm text-zinc-500 text-center">
            No templates yet. Create one to quickly start common entries.
          </p>
        )}
        {templates.map((tpl) => {
          const project = getProject(tpl.projectId);
          const task = getTask(tpl.taskId);
          return (
            <div key={tpl.id} className="flex items-start justify-between px-4 py-3 gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-zinc-100 truncate">{tpl.name}</p>
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  {project && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                      style={{
                        backgroundColor: project.color + "33",
                        color: project.color,
                      }}
                    >
                      {project.name}
                    </span>
                  )}
                  {task && (
                    <span className="text-xs text-zinc-500">{task.name}</span>
                  )}
                  {!tpl.billable && (
                    <span className="text-xs bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded-full">
                      non-billable
                    </span>
                  )}
                  {tpl.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                  {tpl.notes && (
                    <span className="text-xs text-zinc-600 truncate max-w-[160px]">
                      &ldquo;{tpl.notes}&rdquo;
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditing(tpl)}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => onDelete(tpl.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <TemplateForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSave={onAdd}
        projects={projects}
        tasks={tasks}
      />

      {editing && (
        <TemplateForm
          open={true}
          onClose={() => setEditing(null)}
          onSave={(name, projectId, taskId, notes, tags, billable) =>
            onUpdate(editing.id, { name, projectId, taskId, notes, tags, billable })
          }
          initial={editing}
          projects={projects}
          tasks={tasks}
        />
      )}
    </div>
  );
}
