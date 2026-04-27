"use client";

import { useState } from "react";
import { Client } from "@/types";
import { Button } from "@/components/ui/Button";
import { ClientForm } from "./ClientForm";
import { useClients } from "@/hooks/useClients";

interface ClientListProps {
  clients: Client[];
  onAdd: (name: string, color: string, notes?: string) => void;
  onUpdate: (id: string, patch: Partial<Omit<Client, "id" | "createdAt">>) => void;
  onDelete: (id: string) => void;
}

export function ClientList({ clients, onAdd, onUpdate, onDelete }: ClientListProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const editClient = clients.find((c) => c.id === editId);

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Clients</h2>
        <Button variant="ghost" size="sm" onClick={() => setAddOpen(true)}>
          + New Client
        </Button>
      </div>

      <ClientForm
        open={addOpen}
        onSave={(data) => { onAdd(data.name, data.color, data.notes); setAddOpen(false); }}
        onClose={() => setAddOpen(false)}
      />

      {editClient && (
        <ClientForm
          open={!!editId}
          initial={editClient}
          title="Edit Client"
          onSave={(data) => { onUpdate(editId!, data); setEditId(null); }}
          onClose={() => setEditId(null)}
        />
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {clients.length === 0 ? (
          <p className="px-4 py-6 text-sm text-zinc-600 italic text-center">
            No clients yet. Add one to associate projects and track billing.
          </p>
        ) : (
          clients.map((client) => (
            <div key={client.id} className="flex items-center justify-between px-4 py-3 group">
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className="flex-none w-3 h-3 rounded-full"
                  style={{ backgroundColor: client.color }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{client.name}</p>
                  {client.notes && (
                    <p className="text-xs text-zinc-500 truncate max-w-xs">{client.notes}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditId(client.id)}
                  className="text-zinc-400 hover:text-zinc-100 text-xs px-2 py-1"
                >
                  Edit
                </Button>
                {deleteId === client.id ? (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => { onDelete(client.id); setDeleteId(null); }}
                    className="text-xs px-2 py-1"
                  >
                    Confirm?
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteId(client.id)}
                    className="text-red-400 hover:text-red-300 text-xs px-2 py-1"
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
