"use client";

import { useEffect } from "react";
import { Task, ActiveTimer } from "@/types";
import { msToHMS } from "@/lib/formatTime";

export function useTabTitle(
  tasks: Task[],
  activeTimer: ActiveTimer | null,
  getLiveMs: (id: string) => number
) {
  useEffect(() => {
    if (!activeTimer) {
      document.title = "TaskPotato";
      return;
    }
    const task = tasks.find((t) => t.id === activeTimer.taskId);
    if (!task) {
      document.title = "TaskPotato";
      return;
    }
    const update = () => {
      const liveMs = getLiveMs(task.id);
      document.title = `⏱ ${task.title} — ${msToHMS(liveMs)} | TaskPotato`;
    };
    update();
    const id = setInterval(update, 1000);
    return () => {
      clearInterval(id);
      document.title = "TaskPotato";
    };
  }, [tasks, activeTimer, getLiveMs]);
}
