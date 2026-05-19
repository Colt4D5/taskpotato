"use client";

import { Client, Project, TimeEntry } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";

interface ClientBudgetCardProps {
  clients: Client[];
  projects: Project[];
  /** Entries scoped to the current calendar month (caller's responsibility) */
  monthEntries: TimeEntry[];
  /** Display label for the month, e.g. "May 2026" */
  monthLabel: string;
}

interface BudgetRowProps {
  client: Client;
  trackedMs: number;
}

function BudgetRow({ client, trackedMs }: BudgetRowProps) {
  const budgetMs = (client.monthlyBudgetHours ?? 0) * 3_600_000;
  const pct = Math.min(trackedMs / budgetMs, 1);
  const over = trackedMs > budgetMs;
  const warn = pct >= 0.8 && !over;

  const barColor = over ? "bg-red-500" : warn ? "bg-amber-500" : "bg-orange-500";
  const labelColor = over ? "text-red-400" : warn ? "text-amber-400" : "text-zinc-400";

  const trackedHours = (trackedMs / 3_600_000).toFixed(1);
  const budgetHours = client.monthlyBudgetHours ?? 0;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center text-sm">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: client.color }}
          />
          <span className="text-zinc-200">{client.name}</span>
          {over && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-red-900/50 text-red-400 border border-red-700/50">
              over budget
            </span>
          )}
          {warn && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-amber-900/50 text-amber-400 border border-amber-700/50">
              near limit
            </span>
          )}
        </div>
        <span className={`text-xs font-mono ${labelColor}`}>
          {formatDurationShort(trackedMs)} / {budgetHours}h
        </span>
      </div>
      <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.min(pct * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{Math.round(pct * 100)}% used</span>
        <span>
          {over
            ? `${formatDurationShort(trackedMs - budgetMs)} over`
            : `${formatDurationShort(budgetMs - trackedMs)} remaining`}
        </span>
      </div>
    </div>
  );
}

export function ClientBudgetCard({
  clients,
  projects,
  monthEntries,
  monthLabel,
}: ClientBudgetCardProps) {
  // Only clients with a monthly budget
  const budgetedClients = clients.filter(
    (c) => c.monthlyBudgetHours && c.monthlyBudgetHours > 0
  );

  if (budgetedClients.length === 0) return null;

  // projectId → clientId lookup
  const projectClientMap = new Map<string, string>();
  for (const p of projects) {
    if (p.clientId) projectClientMap.set(p.id, p.clientId);
  }

  // Accumulate this month's tracked ms per client
  const trackedMsMap = new Map<string, number>();
  for (const e of monthEntries) {
    if (!e.projectId) continue;
    const clientId = projectClientMap.get(e.projectId);
    if (!clientId) continue;
    trackedMsMap.set(clientId, (trackedMsMap.get(clientId) ?? 0) + elapsedMs(e.startedAt, e.stoppedAt));
  }

  // Sort: over budget first, then by % burn descending
  const sorted = budgetedClients.slice().sort((a, b) => {
    const aBudgetMs = (a.monthlyBudgetHours ?? 0) * 3_600_000;
    const bBudgetMs = (b.monthlyBudgetHours ?? 0) * 3_600_000;
    const aMs = trackedMsMap.get(a.id) ?? 0;
    const bMs = trackedMsMap.get(b.id) ?? 0;
    const aPct = aBudgetMs > 0 ? aMs / aBudgetMs : 0;
    const bPct = bBudgetMs > 0 ? bMs / bBudgetMs : 0;
    return bPct - aPct;
  });

  return (
    <section className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Client Retainer Budgets</h2>
        <span className="text-xs text-zinc-500">{monthLabel}</span>
      </div>
      <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 flex flex-col gap-5">
        {sorted.map((client) => (
          <BudgetRow
            key={client.id}
            client={client}
            trackedMs={trackedMsMap.get(client.id) ?? 0}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Budget burn calculated from all tracked time this calendar month across all projects assigned to each client.
      </p>
    </section>
  );
}
