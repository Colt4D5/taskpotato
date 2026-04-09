import { Task } from "@/types";

export function groupByDay(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const task of tasks) {
    const key = task.createdAt.slice(0, 10); // YYYY-MM-DD
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(task);
  }
  // Sort tasks within each day by order
  for (const [, dayTasks] of map) {
    dayTasks.sort((a, b) => a.order - b.order);
  }
  return map;
}

export function formatDayHeader(dateKey: string): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
