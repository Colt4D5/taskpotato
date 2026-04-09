"use client";

import { useState, useRef, useEffect } from "react";

interface NewTaskModalProps {
  onClose: () => void;
  onCreate: (title: string, description: string) => void;
}

export default function NewTaskModal({ onClose, onCreate }: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title.trim(), description.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#242424] rounded-xl border border-[#333] p-6 w-full max-w-md shadow-2xl">
        <h2 className="text-white font-semibold text-lg mb-4">New Task</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-1">
              Title <span className="text-[#E8763A]">*</span>
            </label>
            <input
              ref={inputRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you working on?"
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#E8763A] transition-colors"
            />
          </div>
          <div>
            <label className="text-gray-400 text-sm block mb-1">
              Description{" "}
              <span className="text-gray-600 text-xs">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description..."
              className="w-full bg-[#1a1a1a] border border-[#444] rounded-lg px-3 py-2 text-white placeholder-gray-600 focus:outline-none focus:border-[#E8763A] transition-colors"
            />
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
              disabled={!title.trim()}
              className="px-4 py-2 rounded-lg bg-[#E8763A] hover:bg-[#d4682e] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
