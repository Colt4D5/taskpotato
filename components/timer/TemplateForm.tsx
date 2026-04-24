"use client";

import { useState } from "react";
import { EntryTemplate, Project, Task } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { TagInput } from "@/components/ui/TagInput";
import { Input } from "@/components/ui/Input";

interface TemplateFormProps {
  open: boolean;
  onClose: () => void;
  onSave: (
    name: string,
    projectId: string | null,
    taskId: string | null,
    notes: string,
    tags: string[],
    billable: boolean
  ) => void;
  initial?: EntryTemplate;
  projects: Project[];
  tasks: Task[];
}

export function TemplateForm({
  open,
  onClose,
  onSave,
  initial,
  projects,
  tasks,
}: TemplateFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [projectId, setProjectId] = useState<string | null>(initial?.projectId ?? null);
  const [taskId, setTaskId] = useState<string | null>(initial?.taskId ?? null);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [billable, setBillable] = useState(initial?.billable ?? true);
  const [nameError, setNameError] = useState("");

  const availableTasks = tasks.filter(
    (t) => !t.archived && (projectId ? t.projectId === projectId : false)
  );

  const handleProjectChange = (id: string) => {
    setProjectId(id || null);
    setTaskId(null);
  };

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError("Template name is required.");
      return;
    }
    setNameError("");
    onSave(trimmed, projectId, taskId, notes, tags, billable);
    onClose();
  };

  const handleClose = () => {
    setName(initial?.name ?? "");
    setProjectId(initial?.projectId ?? null);
    setTaskId(initial?.taskId ?? null);
    setNotes(initial?.notes ?? "");
    setTags(initial?.tags ?? []);
    setBillable(initial?.billable ?? true);
    setNameError("");
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={initial ? "Edit template" : "New template"}
    >
      <div className="space-y-4">
        <Input
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Daily standup"
          error={nameError}
          autoFocus
        />

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Project
          </label>
          <select
            value={projectId ?? ""}
            onChange={(e) => handleProjectChange(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="">No project</option>
            {projects
              .filter((p) => !p.archived)
              .map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>

        {projectId && availableTasks.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Task
            </label>
            <select
              value={taskId ?? ""}
              onChange={(e) => setTaskId(e.target.value || null)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">No task</option>
              {availableTasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Description
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Default description…"
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Tags
          </label>
          <TagInput tags={tags} onChange={setTags} />
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-zinc-300">Billable</span>
          <button
            type="button"
            onClick={() => setBillable((b) => !b)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              billable ? "bg-orange-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                billable ? "translate-x-4" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" className="flex-1" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleSave}>
            {initial ? "Save changes" : "Create template"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
