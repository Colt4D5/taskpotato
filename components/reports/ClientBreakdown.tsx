"use client";

import { Client, Project, TimeEntry } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";

interface ClientBreakdownProps {
  clients: Client[];
  projects: Project[];
  entries: TimeEntry[];
  totalMs: number;
}

export function ClientBreakdown({ clients, projects, entries, totalMs }: ClientBreakdownProps) {
  if (clients.length === 0) return null;

  // Build projectId → clientId map
  const projectClientMap = new Map<string, string>();
  for (const p of projects) {
    if (p.clientId) projectClientMap.set(p.id, p.clientId);
  }

  // Accumulate ms per client
  const clientMs = new Map<string, number>();
  let unassignedMs = 0;

  for (const e of entries) {
    const ms = elapsedMs(e.startedAt, e.stoppedAt);
    const clientId = e.projectId ? projectClientMap.get(e.projectId) : undefined;
    if (clientId) {
      clientMs.set(clientId, (clientMs.get(clientId) ?? 0) + ms);
    } else {
      unassignedMs += ms;
    }
  }

  const sorted = Array.from(clientMs.entries())
    .map(([id, ms]) => ({ client: clients.find((c) => c.id === id)!, ms }))
    .filter((r) => r.client)
    .sort((a, b) => b.ms - a.ms);

  if (sorted.length === 0) return null;

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-4 mb-6">
      <h2 className="text-sm font-semibold text-zinc-400 mb-4 uppercase tracking-wider">
        By Client
      </h2>
      <div className="flex flex-col gap-3">
        {sorted.map(({ client, ms }) => {
          const pct = totalMs > 0 ? Math.round((ms / totalMs) * 100) : 0;
          return (
            <div key={client.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className="flex-none w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: client.color }}
                  />
                  <span className="text-sm text-zinc-200">{client.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-500">{pct}%</span>
                  <span className="text-sm font-mono text-zinc-300">{formatDurationShort(ms)}</span>
                </div>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: client.color }}
                />
              </div>
            </div>
          );
        })}
        {unassignedMs > 0 && sorted.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-zinc-500 italic">No client</span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500">
                  {totalMs > 0 ? Math.round((unassignedMs / totalMs) * 100) : 0}%
                </span>
                <span className="text-sm font-mono text-zinc-300">{formatDurationShort(unassignedMs)}</span>
              </div>
            </div>
            <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-zinc-700 transition-all"
                style={{ width: `${totalMs > 0 ? Math.round((unassignedMs / totalMs) * 100) : 0}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
