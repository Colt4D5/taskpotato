"use client";

import { EntryTemplate, Project, Task } from "@/types";

interface TemplateQuickStartProps {
  templates: EntryTemplate[];
  projects: Project[];
  tasks: Task[];
  onApply: (template: EntryTemplate) => void;
  disabled?: boolean;
}

export function TemplateQuickStart({
  templates,
  projects,
  tasks,
  onApply,
  disabled,
}: TemplateQuickStartProps) {
  if (templates.length === 0) return null;

  const getProject = (id: string | null) => projects.find((p) => p.id === id);
  const getTask = (id: string | null) => tasks.find((t) => t.id === id);

  return (
    <div className="mb-4">
      <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
        Templates
      </p>
      <div className="flex flex-wrap gap-2">
        {templates.map((tpl) => {
          const project = getProject(tpl.projectId);
          const task = getTask(tpl.taskId);
          return (
            <button
              key={tpl.id}
              onClick={() => !disabled && onApply(tpl)}
              disabled={disabled}
              title={[
                project ? project.name : null,
                task ? task.name : null,
                tpl.notes || null,
                tpl.tags.length ? tpl.tags.map((t) => `#${t}`).join(" ") : null,
                !tpl.billable ? "non-billable" : null,
              ]
                .filter(Boolean)
                .join(" · ")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                bg-zinc-800 border-zinc-700 text-zinc-300
                hover:bg-zinc-700 hover:border-zinc-600 hover:text-zinc-100
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {project && (
                <span
                  className="inline-block w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: project.color }}
                />
              )}
              <span className="max-w-[120px] truncate">{tpl.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
