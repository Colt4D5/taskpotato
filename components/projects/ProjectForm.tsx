"use client";

import { useState } from "react";
import { Project, Client } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ColorPicker } from "@/components/ui/ColorPicker";

interface ProjectFormProps {
  open: boolean;
  initial?: Partial<Project>;
  clients?: Client[];
  onSave: (data: { name: string; color: string; budgetHours?: number; clientId?: string | null }) => void;
  onClose: () => void;
  title?: string;
}

const DEFAULT_COLOR = "#3b82f6";

export function ProjectForm({
  open,
  initial,
  clients = [],
  onSave,
  onClose,
  title = "New Project",
}: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [color, setColor] = useState(initial?.color ?? DEFAULT_COLOR);
  const [budgetRaw, setBudgetRaw] = useState(
    initial?.budgetHours ? String(initial.budgetHours) : ""
  );
  const [clientId, setClientId] = useState<string>(initial?.clientId ?? "");
  const [error, setError] = useState("");

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Project name is required.");
      return;
    }
    const budgetHours = budgetRaw.trim() === "" ? undefined : parseFloat(budgetRaw);
    if (budgetHours !== undefined && (isNaN(budgetHours) || budgetHours <= 0)) {
      setError("Budget must be a positive number.");
      return;
    }
    onSave({ name: trimmed, color, budgetHours, clientId: clientId || null });
    setName("");
    setColor(DEFAULT_COLOR);
    setBudgetRaw("");
    setClientId("");
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
        {clients.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-zinc-400">Client <span className="text-zinc-500 font-normal">— optional</span></label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
            >
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-400">
            Budget (hours) <span className="text-zinc-500 font-normal">— optional</span>
          </label>
          <input
            type="number"
            min="0.1"
            step="0.5"
            value={budgetRaw}
            onChange={(e) => { setBudgetRaw(e.target.value); setError(""); }}
            placeholder="e.g. 40"
            className="rounded-md bg-zinc-800 border border-zinc-700 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-full"
          />
          <p className="text-xs text-zinc-500">
            Set a cap on total tracked hours. You'll see burn progress on the Reports page.
          </p>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
