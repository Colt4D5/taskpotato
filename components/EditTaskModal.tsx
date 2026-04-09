"use client";

import { useState, useEffect } from "react";
import { Task } from "@/types";
import { msToHMS, hmsToMs } from "@/lib/formatTime";

interface EditTaskModalProps {
  task: Task;
  liveMs: number;
  onClose: () => void;
  onSave: (patch: Partial<Task>) => void;
}

export default function EditTaskModal({
  task,
  liveMs,
  onClose,
  onSave,
}: EditTaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [timeStr, setTimeStr] = useState(msToHMS(liveMs));
  const [timeError, setTimeError] = useState(false);

  useEffect(() => {
    const valid = /^\d+:\d{2}:\d{2}$/.test(timeStr);
    setTimeError(!valid);
  }, [timeStr]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || timeError) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      totalMs: hmsToMs(timeStr),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#242424] rounded-xl border border-[#333] p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-4">Edit Task</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">Title</label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8763A] transition-colors"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#E8763A] transition-colors"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">
              Logged time{" "}
              <span className="text-gray-600 text-xs">(HH:MM:SS)</span>
            </label>
            <input
              type="text"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
              className={`w-full bg-[#1a1a1a] border rounded-lg px-3 py-2 text-white font-mono focus:outline-none transition-colors ${
                timeError
                  ? "border-red-500 focus:border-red-400"
                  : "border-[#444] focus:border-[#E8763A]"
              }`}
            />
            {timeError && (
              <p className="text-red-400 text-xs mt-1">
                Format must be HH:MM:SS
              </p>
            )}
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#333] hover:bg-[#444] text-gray-300 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || timeError}
              className="px-4 py-2 rounded-lg bg-[#E8763A] hover:bg-[#d4682e] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
