"use client";

import { useCallback } from "react";
import { useStorage } from "./useStorage";
import { Project } from "@/types";
import { uuid } from "@/lib/uuid";

const PROJECT_COLORS = [
  "#ef4444", "#f97316", "#eab308", "#22c55e",
  "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
];

export function useProjects() {
  const [projects, setProjects] = useStorage<Project[]>("projects", []);

  const addProject = useCallback(
    (name: string, color?: string) => {
      const project: Project = {
        id: uuid(),
        name: name.trim(),
        color: color ?? PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
        archived: false,
        createdAt: Date.now(),
      };
      setProjects((prev) => [...prev, project]);
      return project;
    },
    [setProjects]
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<Omit<Project, "id" | "createdAt">>) => {
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    [setProjects]
  );

  const deleteProject = useCallback(
    (id: string) => {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    },
    [setProjects]
  );

  const activeProjects = projects.filter((p) => !p.archived);

  return { projects, activeProjects, addProject, updateProject, deleteProject };
}
