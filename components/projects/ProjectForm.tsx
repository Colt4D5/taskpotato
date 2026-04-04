"use client";

import { useState } from "react";
import { Project } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ColorPicker } from "@/components/ui/ColorPicker";

interface ProjectFormProps {
  open: boolean;
  initial?: Partial<Project>;
  onSave: (data: { name: string; color: string }) => void;
  onClose: () => void;
  title?: string;
}

const DEFAULT_COLOR = "#3b82f6";

export function ProjectForm({
  open,
  initial,
  onSave,
  onClose,
  title = "New Project",
}: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }
    onSave({ name: trimmed, color });
    setName("");
    setColor(DEFAULT_COLOR);
    setError("");
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <Input
          label="Project Name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Website Redesign"
          error={error}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
