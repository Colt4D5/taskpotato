"use client";

import { useState } from "react";
import { Task } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface TaskFormProps {
  open: boolean;
  initial?: Partial<Task>;
  onSave: (data: { name: string; notes: string }) => void;
  onClose: () => void;
  title?: string;
}

export function TaskForm({
  open,
  initial,
  onSave,
  onClose,
  title = "New Task",
}: TaskFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Task name is required.");
      return;
    }
    onSave({ name: trimmed, notes: notes.trim() });
    setName("");
    setNotes("");
    setError("");
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <Input
          label="Task Name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Homepage layout"
          error={error}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <Input
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any additional context..."
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
