"use client";

import { useState } from "react";
import { Project, Task } from "@/types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TaskForm } from "@/components/tasks/TaskForm";

interface TaskListProps {
  project: Project;
  tasks: Task[];
  onAddTask: (projectId: string, name: string, notes: string) => void;
  onUpdateTask: (id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskList({
  project,
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}: TaskListProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const activeTasks = tasks.filter((t) => !t.archived);
  const archivedTasks = tasks.filter((t) => t.archived);

  return (
    <div className="mt-3 ml-5 border-l border-zinc-800 pl-4">
      {activeTasks.length === 0 && (
        <p className="text-xs text-zinc-600 italic py-1">No tasks</p>
      )}
      {activeTasks.map((task) => (
        <div
          key={task.id}
          className="group flex items-center gap-2 py-1.5 text-sm text-zinc-400"
        >
          <span className="flex-1 truncate">{task.name}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setEditingTask(task)}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-1"
            >
              edit
            </button>
            <button
              onClick={() => onUpdateTask(task.id, { archived: true })}
              className="text-xs text-zinc-500 hover:text-zinc-300 px-1"
            >
              archive
            </button>
            <button
              onClick={() => onDeleteTask(task.id)}
              className="text-xs text-red-500 hover:text-red-400 px-1"
            >
              delete
            </button>
          </div>
        </div>
      ))}

      {archivedTasks.length > 0 && (
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
        >
          {showArchived ? "Hide" : "Show"} {archivedTasks.length} archived
        </button>
      )}

      {showArchived &&
        archivedTasks.map((task) => (
          <div
            key={task.id}
            className="group flex items-center gap-2 py-1.5 text-sm text-zinc-600"
          >
            <span className="flex-1 truncate line-through">{task.name}</span>
            <button
              onClick={() => onUpdateTask(task.id, { archived: false })}
              className="text-xs text-zinc-500 hover:text-zinc-300 opacity-0 group-hover:opacity-100 transition-opacity px-1"
            >
              restore
            </button>
          </div>
        ))}

      <button
        onClick={() => setAddOpen(true)}
        className="mt-2 text-xs text-zinc-600 hover:text-orange-400 transition-colors flex items-center gap-1"
      >
        + Add task
      </button>

      <TaskForm
        open={addOpen}
        onSave={({ name, notes }) => {
          onAddTask(project.id, name, notes);
          setAddOpen(false);
        }}
        onClose={() => setAddOpen(false)}
      />

      {editingTask && (
        <TaskForm
          open={!!editingTask}
          initial={editingTask}
          title="Edit Task"
          onSave={({ name, notes }) => {
            onUpdateTask(editingTask.id, { name, notes });
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
