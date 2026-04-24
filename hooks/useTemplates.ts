"use client";

import { useStorage } from "./useStorage";
import { EntryTemplate } from "@/types";
import { uuid } from "@/lib/uuid";

export function useTemplates() {
  const [templates, setTemplates] = useStorage<EntryTemplate[]>("templates", []);

  const addTemplate = (
    name: string,
    projectId: string | null,
    taskId: string | null,
    notes: string,
    tags: string[],
    billable: boolean
  ): EntryTemplate => {
    const template: EntryTemplate = {
      id: uuid(),
      name,
      projectId,
      taskId,
      notes,
      tags,
      billable,
      createdAt: Date.now(),
    };
    setTemplates((prev) => [...prev, template]);
    return template;
  };

  const updateTemplate = (id: string, updates: Partial<Omit<EntryTemplate, "id" | "createdAt">>) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return { templates, addTemplate, updateTemplate, deleteTemplate };
}
