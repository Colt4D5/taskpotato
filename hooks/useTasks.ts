"use client";

import { useCallback } from "react";
import { useStorage } from "./useStorage";
import { Task } from "@/types";
import { uuid } from "@/lib/uuid";

export function useTasks() {
  const [tasks, setTasks] = useStorage<Task[]>("tasks", []);

  const addTask = useCallback(
    (projectId: string, name: string, notes = "") => {
      const task: Task = {
        id: uuid(),
        projectId,
        name: name.trim(),
        notes,
        archived: false,
        createdAt: Date.now(),
      };
      setTasks((prev) => [...prev, task]);
      return task;
    },
    [setTasks]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Omit<Task, "id" | "createdAt">>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      );
    },
    [setTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [setTasks]
  );

  const getTasksForProject = useCallback(
    (projectId: string) =>
      tasks.filter((t) => t.projectId === projectId && !t.archived),
    [tasks]
  );

  return { tasks, addTask, updateTask, deleteTask, getTasksForProject };
}
