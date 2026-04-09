"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types";
import { useTasks } from "@/hooks/useTasks";
import { useTabTitle } from "@/hooks/useTabTitle";
import { groupByDay } from "@/lib/groupByDay";
import SummaryBar from "./SummaryBar";
import DaySection from "./DaySection";
import NewTaskModal from "./NewTaskModal";
import EditTaskModal from "./EditTaskModal";
import PieChart from "./PieChart";

export default function TaskBoard() {
  const {
    tasks,
    activeTimer,
    createTask,
    updateTask,
    deleteTask,
    startTimer,
    stopTimer,
    reorderTasks,
    getLiveMs,
  } = useTasks();

  const [showNewModal, setShowNewModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  useTabTitle(tasks, activeTimer, getLiveMs);

  // Keyboard shortcut: N opens new task modal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (
        e.key === "n" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(tag) &&
        !e.metaKey &&
        !e.ctrlKey
      ) {
        e.preventDefault();
        setShowNewModal(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const dayMap = groupByDay(tasks);
  const sortedDays = Array.from(dayMap.keys()).sort((a, b) =>
    b.localeCompare(a)
  );

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      <SummaryBar tasks={tasks} getLiveMs={getLiveMs} />

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🥔</span>
            <h1 className="text-2xl font-bold text-white">TaskPotato</h1>
          </div>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#E8763A] hover:bg-[#d4682e] rounded-lg text-white text-sm font-semibold transition-colors"
          >
            <span>+</span> New Task
            <span className="text-xs opacity-60 ml-1">(N)</span>
          </button>
        </div>

        {/* Pie chart */}
        {tasks.length > 0 && (
          <PieChart tasks={tasks} getLiveMs={getLiveMs} />
        )}

        {/* Task list */}
        {tasks.length === 0 ? (
          <div className="text-center py-24 text-gray-600">
            <div className="text-5xl mb-4">🥔</div>
            <p className="text-lg mb-2">No tasks yet.</p>
            <p className="text-sm">
              Press{" "}
              <kbd className="bg-[#333] text-gray-300 px-2 py-0.5 rounded text-xs font-mono">
                N
              </kbd>{" "}
              or click{" "}
              <span className="text-[#E8763A]">New Task</span> to get started.
            </p>
          </div>
        ) : (
          sortedDays.map((dayKey) => (
            <DaySection
              key={dayKey}
              dayKey={dayKey}
              tasks={dayMap.get(dayKey)!}
              activeTimer={activeTimer}
              getLiveMs={getLiveMs}
              onStart={startTimer}
              onStop={stopTimer}
              onEdit={setEditingTask}
              onDelete={deleteTask}
              onReorder={reorderTasks}
            />
          ))
        )}
      </div>

      {showNewModal && (
        <NewTaskModal
          onClose={() => setShowNewModal(false)}
          onCreate={createTask}
        />
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          liveMs={getLiveMs(editingTask.id)}
          onClose={() => setEditingTask(null)}
          onSave={(patch) => {
            updateTask(editingTask.id, patch);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
