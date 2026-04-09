"use client";

import { useState, useRef } from "react";
import { Task, ActiveTimer } from "@/types";
import { msToHMS } from "@/lib/formatTime";

interface TaskCardProps {
  task: Task;
  isActive: boolean;
  activeTimer: ActiveTimer | null;
  liveMs: number;
  onStart: () => void;
  onStop: () => void;
  onEdit: () => void;
  onDelete: () => void;
  index: number;
  onDragStart: (index: number) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDrop: (index: number) => void;
}

export default function TaskCard({
  task,
  isActive,
  liveMs,
  onStart,
  onStop,
  onEdit,
  onDelete,
  index,
  onDragStart,
  onDragOver,
  onDrop,
}: TaskCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dragRef = useRef(false);

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      draggable
      onDragStart={() => {
        dragRef.current = true;
        onDragStart(index);
      }}
      onDragEnd={() => {
        dragRef.current = false;
      }}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={() => onDrop(index)}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 cursor-grab active:cursor-grabbing transition-all
        ${isActive
          ? "bg-[#2a1f17] border-[#E8763A]"
          : "bg-[#242424] border-transparent hover:border-[#444]"
        }
      `}
    >
      {/* Active pulse dot */}
      <div className="w-3 h-3 flex-shrink-0">
        {isActive && (
          <div className="w-3 h-3 rounded-full bg-[#E8763A] animate-pulse" />
        )}
      </div>

      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <div className="text-white font-medium truncate">{task.title}</div>
        {task.description && (
          <div className="text-gray-500 text-xs truncate mt-0.5">
            {task.description}
          </div>
        )}
      </div>

      {/* Timer display */}
      <div
        className={`font-mono text-sm tabular-nums ${
          isActive ? "text-[#E8763A]" : "text-gray-400"
        }`}
      >
        {msToHMS(liveMs)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {isActive ? (
          <button
            onClick={onStop}
            className="w-8 h-8 flex items-center justify-center rounded bg-[#E8763A] hover:bg-[#d4682e] text-white text-sm font-bold transition-colors"
            title="Stop"
          >
            ■
          </button>
        ) : (
          <button
            onClick={onStart}
            className="w-8 h-8 flex items-center justify-center rounded bg-[#333] hover:bg-[#E8763A] text-white text-sm transition-colors"
            title="Start"
          >
            ▶
          </button>
        )}

        <button
          onClick={onEdit}
          className="w-8 h-8 flex items-center justify-center rounded bg-[#333] hover:bg-[#444] text-gray-300 text-xs transition-colors"
          title="Edit"
        >
          ✏
        </button>

        <button
          onClick={handleDelete}
          className={`w-8 h-8 flex items-center justify-center rounded text-xs transition-colors ${
            confirmDelete
              ? "bg-red-600 hover:bg-red-700 text-white"
              : "bg-[#333] hover:bg-red-600 text-gray-300 hover:text-white"
          }`}
          title={confirmDelete ? "Click again to confirm" : "Delete"}
        >
          {confirmDelete ? "?" : "🗑"}
        </button>
      </div>
    </div>
  );
}
