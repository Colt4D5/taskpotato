"use client";

import { useCallback } from "react";
import { useStorage } from "./useStorage";
import { Client } from "@/types";
import { uuid } from "@/lib/uuid";

const CLIENT_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

export function useClients() {
  const [clients, setClients] = useStorage<Client[]>("clients", []);

  const addClient = useCallback(
    (name: string, color?: string, notes?: string) => {
      const client: Client = {
        id: uuid(),
        name: name.trim(),
        color: color ?? CLIENT_COLORS[Math.floor(Math.random() * CLIENT_COLORS.length)],
        notes: notes?.trim() || undefined,
        createdAt: Date.now(),
      };
      setClients((prev) => [...prev, client]);
      return client;
    },
    [setClients]
  );

  const updateClient = useCallback(
    (id: string, patch: Partial<Omit<Client, "id" | "createdAt">>) => {
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
      );
    },
    [setClients]
  );

  const deleteClient = useCallback(
    (id: string) => {
      setClients((prev) => prev.filter((c) => c.id !== id));
    },
    [setClients]
  );

  return { clients, addClient, updateClient, deleteClient };
}
