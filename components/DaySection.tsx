"use client";

import { useState } from "react";
import { Task, ActiveTimer } from "@/types";
import { msToHMS } from "@/lib/formatTime";
import { formatDayHeader } from "@/lib/groupByDay";
import TaskCard from "./TaskCard";

interface DaySectionProps {
  dayKey: string;
  tasks: Task[];
  activeTimer: ActiveTimer | null;
  getLiveMs: (id: string) => number;
  onStart: (id: string) => void;
  onStop: () => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onReorder: (dayKey: string, from: number, to: number) => void;
}

export default function DaySection({
  dayKey,
  tasks,
  activeTimer,
  getLiveMs,
  onStart,
  onStop,
  onEdit,
  onDelete,
  onReorder,
}: DaySectionProps) {
  const [dragFrom, setDragFrom] = useState<number | null>(null);

  const dayTotal = tasks.reduce((sum, t) => sum + getLiveMs(t.id), 0);

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (toIndex: number) => {
    if (dragFrom !== null && dragFrom !== toIndex) {
      onReorder(dayKey, dragFrom, toIndex);
    }
    setDragFrom(null);
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">
          {formatDayHeader(dayKey)}
        </h2>
        <span className="text-gray-500 font-mono text-sm">
          {msToHMS(dayTotal)}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((task, i) => (
          <TaskCard
            key={task.id}
            task={task}
            isActive={activeTimer?.taskId === task.id}
            activeTimer={activeTimer}
            liveMs={getLiveMs(task.id)}
            onStart={() => onStart(task.id)}
            onStop={onStop}
            onEdit={() => onEdit(task)}
            onDelete={() => onDelete(task.id)}
            index={i}
            onDragStart={(idx) => setDragFrom(idx)}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          />
        ))}
      </div>
    </div>
  );
}
