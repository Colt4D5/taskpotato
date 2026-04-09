"use client";

import { useState, useEffect, useCallback } from "react";
import { Task, ActiveTimer } from "@/types";
import { getStorage, setStorage, TASKS_KEY, ACTIVE_KEY } from "@/lib/storage";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [tick, setTick] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const storedTasks = getStorage<Task[]>(TASKS_KEY) ?? [];
    const storedActive = getStorage<ActiveTimer | null>(ACTIVE_KEY);
    setTasks(storedTasks);
    setActiveTimer(storedActive);
  }, []);

  // Live tick every second when timer is active
  useEffect(() => {
    if (!activeTimer) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [activeTimer]);

  const saveTasks = useCallback((next: Task[]) => {
    setTasks(next);
    setStorage(TASKS_KEY, next);
  }, []);

  const createTask = useCallback(
    (title: string, description: string) => {
      const today = new Date().toISOString().slice(0, 10);
      const dayTasks = tasks.filter((t) => t.createdAt.slice(0, 10) === today);
      const maxOrder = dayTasks.reduce((m, t) => Math.max(m, t.order), -1);
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        description,
        totalMs: 0,
        createdAt: new Date().toISOString(),
        order: maxOrder + 1,
      };
      saveTasks([...tasks, task]);
    },
    [tasks, saveTasks]
  );

  const updateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      saveTasks(tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    },
    [tasks, saveTasks]
  );

  const deleteTask = useCallback(
    (id: string) => {
      if (activeTimer?.taskId === id) {
        setActiveTimer(null);
        setStorage(ACTIVE_KEY, null);
      }
      saveTasks(tasks.filter((t) => t.id !== id));
    },
    [tasks, activeTimer, saveTasks]
  );

  const startTimer = useCallback(
    (id: string) => {
      // Stop existing timer if any
      if (activeTimer) {
        const elapsed = Date.now() - activeTimer.startedAt;
        saveTasks(
          tasks.map((t) =>
            t.id === activeTimer.taskId
              ? { ...t, totalMs: t.totalMs + elapsed }
              : t
          )
        );
      }
      const timer: ActiveTimer = { taskId: id, startedAt: Date.now() };
      setActiveTimer(timer);
      setStorage(ACTIVE_KEY, timer);
    },
    [tasks, activeTimer, saveTasks]
  );

  const stopTimer = useCallback(() => {
    if (!activeTimer) return;
    const elapsed = Date.now() - activeTimer.startedAt;
    saveTasks(
      tasks.map((t) =>
        t.id === activeTimer.taskId
          ? { ...t, totalMs: t.totalMs + elapsed }
          : t
      )
    );
    setActiveTimer(null);
    setStorage(ACTIVE_KEY, null);
  }, [tasks, activeTimer, saveTasks]);

  const reorderTasks = useCallback(
    (dayKey: string, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      const dayTasks = tasks
        .filter((t) => t.createdAt.slice(0, 10) === dayKey)
        .sort((a, b) => a.order - b.order);
      const [moved] = dayTasks.splice(fromIndex, 1);
      dayTasks.splice(toIndex, 0, moved);
      const reordered = dayTasks.map((t, i) => ({ ...t, order: i }));
      const otherTasks = tasks.filter(
        (t) => t.createdAt.slice(0, 10) !== dayKey
      );
      saveTasks([...otherTasks, ...reordered]);
    },
    [tasks, saveTasks]
  );

  const getLiveMs = useCallback(
    (taskId: string): number => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return 0;
      if (activeTimer?.taskId === taskId) {
        return task.totalMs + (Date.now() - activeTimer.startedAt);
      }
      return task.totalMs;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tasks, activeTimer, tick]
  );

  return {
    tasks,
    activeTimer,
    createTask,
    updateTask,
    deleteTask,
    startTimer,
    stopTimer,
    reorderTasks,
    getLiveMs,
  };
}
