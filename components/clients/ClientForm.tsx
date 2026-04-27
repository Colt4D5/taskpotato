"use client";

import { useState } from "react";
import { Client } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ColorPicker } from "@/components/ui/ColorPicker";

interface ClientFormProps {
  open: boolean;
  initial?: Partial<Client>;
  onSave: (data: { name: string; color: string; notes?: string }) => void;
  onClose: () => void;
  title?: string;
}

const DEFAULT_COLOR = "#6366f1";

export function ClientForm({
  open,
  initial,
  onSave,
  onClose,
  title = "New Client",
}: ClientFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Client name is required.");
      return;
    }
    onSave({ name: trimmed, color, notes: notes.trim() || undefined });
    setName("");
    setColor(DEFAULT_COLOR);
    setNotes("");
    setError("");
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        <Input
          label="Client Name"
          value={name}
          onChange={(e) => { setName(e.target.value); setError(""); }}
          placeholder="e.g. Acme Corp"
          error={error}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">Color</label>
          <ColorPicker value={color} onChange={setColor} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">
            Notes <span className="text-zinc-500 font-normal">— optional</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contact info, billing notes, etc."
            rows={3}
            className="rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full resize-none"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
