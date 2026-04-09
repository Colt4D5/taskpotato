"use client";

import { Task } from "@/types";
import { msToHMS } from "@/lib/formatTime";

interface SummaryBarProps {
  tasks: Task[];
  getLiveMs: (id: string) => number;
}

export default function SummaryBar({ tasks, getLiveMs }: SummaryBarProps) {
  const today = new Date().toISOString().slice(0, 10);

  const allTimeMs = tasks.reduce((sum, t) => sum + getLiveMs(t.id), 0);
  const todayMs = tasks
    .filter((t) => t.createdAt.slice(0, 10) === today)
    .reduce((sum, t) => sum + getLiveMs(t.id), 0);

  return (
    <div className="sticky top-0 z-10 bg-[#111] border-b border-[#333] px-6 py-3 flex items-center gap-8">
      <span className="text-sm text-gray-400">
        All-time:{" "}
        <span className="text-white font-mono font-semibold">
          {msToHMS(allTimeMs)}
        </span>
      </span>
      <span className="text-sm text-gray-400">
        Today:{" "}
        <span className="text-[#E8763A] font-mono font-semibold">
          {msToHMS(todayMs)}
        </span>
      </span>
    </div>
  );
}
