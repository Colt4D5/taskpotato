"use client";

import { useState, useMemo } from "react";
import { Invoice, Project, Client, TimeEntry } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface InvoiceListProps {
  invoices: Invoice[];
  entries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  onMarkSent: (id: string) => void;
  onMarkPaid: (id: string) => void;
  onDelete: (id: string, entryIds: string[]) => void;
  onCreateNew: () => void;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const STATUS_LABELS: Record<Invoice["status"], string> = {
  draft: "Draft",
  sent: "Sent",
  paid: "Paid",
};

const STATUS_COLORS: Record<Invoice["status"], string> = {
  draft: "text-zinc-400 bg-zinc-800 border-zinc-700",
  sent: "text-amber-300 bg-amber-500/10 border-amber-500/30",
  paid: "text-green-300 bg-green-500/10 border-green-500/30",
};

export function InvoiceList({
  invoices,
  entries,
  projects,
  clients,
  onMarkSent,
  onMarkPaid,
  onDelete,
  onCreateNew,
}: InvoiceListProps) {
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const clientMap = useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
  const entryMap = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);

  const detailInvoice = detailId ? invoices.find((i) => i.id === detailId) ?? null : null;

  if (invoices.length === 0) {
    return (
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-zinc-100">Invoices</h2>
          <Button variant="ghost" size="sm" onClick={onCreateNew}>+ New Invoice</Button>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-8 text-center">
          <p className="text-sm text-zinc-500 mb-1">No invoices yet.</p>
          <p className="text-xs text-zinc-600">Create an invoice to mark billable entries as invoiced and track payment status.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">Invoices</h2>
        <Button variant="ghost" size="sm" onClick={onCreateNew}>+ New Invoice</Button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl divide-y divide-zinc-800">
        {invoices.map((inv) => {
          const client = inv.clientId ? clientMap.get(inv.clientId) : null;
          const invProjects = inv.projectIds
            .map((pid) => projectMap.get(pid))
            .filter(Boolean) as Project[];

          return (
            <div key={inv.id} className="flex items-center gap-3 px-4 py-3 group">
              {/* Number + date */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    className="text-sm font-semibold text-zinc-100 hover:text-orange-300 transition-colors"
                    onClick={() => setDetailId(inv.id)}
                  >
                    {inv.number}
                  </button>
                  {/* Status badge */}
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[inv.status]}`}>
                    {STATUS_LABELS[inv.status]}
                  </span>
                  {client && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full border"
                      style={{
                        color: client.color,
                        borderColor: `${client.color}40`,
                        backgroundColor: `${client.color}15`,
                      }}
                    >
                      {client.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className="text-xs text-zinc-500">{formatDate(inv.issuedAt)}</span>
                  <span className="text-xs text-zinc-600">·</span>
                  <span className="text-xs text-zinc-500">{inv.entryIds.length} entries</span>
                  <span className="text-xs text-zinc-600">·</span>
                  <span className="text-xs text-zinc-500 font-mono">{formatDurationShort(inv.totalMs)}</span>
                  {invProjects.slice(0, 2).map((p) => (
                    <Badge key={p.id} label={p.name} color={p.color} />
                  ))}
                  {invProjects.length > 2 && (
                    <span className="text-xs text-zinc-500">+{invProjects.length - 2} more</span>
                  )}
                </div>
              </div>

              {/* Total */}
              {inv.totalEarnings > 0 && (
                <span className="text-sm font-mono font-semibold text-green-400 flex-shrink-0">
                  {formatCurrency(inv.totalEarnings)}
                </span>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                {inv.status === "draft" && (
                  <button
                    onClick={() => onMarkSent(inv.id)}
                    className="text-xs px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg transition-colors"
                    title="Mark as sent"
                  >
                    Mark sent
                  </button>
                )}
                {inv.status === "sent" && (
                  <button
                    onClick={() => onMarkPaid(inv.id)}
                    className="text-xs px-2 py-1 bg-green-500/10 hover:bg-green-500/20 text-green-300 border border-green-500/30 rounded-lg transition-colors"
                    title="Mark as paid"
                  >
                    Mark paid
                  </button>
                )}
                <button
                  onClick={() => setDetailId(inv.id)}
                  className="text-xs px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 border border-zinc-700 rounded-lg transition-colors"
                >
                  View
                </button>
                {confirmDeleteId === inv.id ? (
                  <>
                    <button
                      onClick={() => {
                        onDelete(inv.id, inv.entryIds);
                        setConfirmDeleteId(null);
                      }}
                      className="text-xs px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-lg transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="text-xs px-1 py-1 text-zinc-500 hover:text-zinc-300"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(inv.id)}
                    className="text-xs px-2 py-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Delete invoice (entries become unbilled)"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {detailInvoice && (
        <InvoiceDetailModal
          invoice={detailInvoice}
          entries={detailInvoice.entryIds
            .map((id) => entryMap.get(id))
            .filter(Boolean) as TimeEntry[]}
          projectMap={projectMap}
          clientMap={clientMap}
          onMarkSent={() => { onMarkSent(detailInvoice.id); setDetailId(null); }}
          onMarkPaid={() => { onMarkPaid(detailInvoice.id); setDetailId(null); }}
          onClose={() => setDetailId(null)}
        />
      )}
    </section>
  );
}

/* ── Invoice Detail Modal ── */

interface InvoiceDetailModalProps {
  invoice: Invoice;
  entries: TimeEntry[];
  projectMap: Map<string, Project>;
  clientMap: Map<string, Client>;
  onMarkSent: () => void;
  onMarkPaid: () => void;
  onClose: () => void;
}

function InvoiceDetailModal({
  invoice,
  entries,
  projectMap,
  clientMap,
  onMarkSent,
  onMarkPaid,
  onClose,
}: InvoiceDetailModalProps) {
  const client = invoice.clientId ? clientMap.get(invoice.clientId) : null;

  const sortedEntries = [...entries].sort((a, b) => a.startedAt - b.startedAt);

  // Group by project
  const byProject = useMemo(() => {
    const map = new Map<string | null, TimeEntry[]>();
    for (const e of sortedEntries) {
      const key = e.projectId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [sortedEntries]);

  return (
    <Modal open onClose={onClose} title={`Invoice ${invoice.number}`}>
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        {/* Header info */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Status</p>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[invoice.status]}`}>
              {STATUS_LABELS[invoice.status]}
            </span>
          </div>
          {client && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Client</p>
              <span className="text-sm text-zinc-200">{client.name}</span>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Issued</p>
            <span className="text-sm text-zinc-200">{formatDate(invoice.issuedAt)}</span>
          </div>
          {invoice.sentAt && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Sent</p>
              <span className="text-sm text-zinc-200">{formatDate(invoice.sentAt)}</span>
            </div>
          )}
          {invoice.paidAt && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Paid</p>
              <span className="text-sm text-zinc-200">{formatDate(invoice.paidAt)}</span>
            </div>
          )}
          <div>
            <p className="text-xs text-zinc-500 mb-0.5">Total time</p>
            <span className="text-sm font-mono text-zinc-200">{formatDurationShort(invoice.totalMs)}</span>
          </div>
          {invoice.totalEarnings > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-0.5">Total</p>
              <span className="text-sm font-mono font-semibold text-green-400">
                {formatCurrency(invoice.totalEarnings)}
              </span>
            </div>
          )}
        </div>

        {invoice.notes && (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2">
            <p className="text-xs text-zinc-500 mb-1">Notes</p>
            <p className="text-sm text-zinc-300">{invoice.notes}</p>
          </div>
        )}

        {/* Entry breakdown by project */}
        <div>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Entries ({entries.length})</p>
          <div className="flex flex-col gap-3">
            {byProject.map(([projId, projEntries]) => {
              const proj = projId ? projectMap.get(projId) : null;
              const projMs = projEntries.reduce((s, e) => s + elapsedMs(e.startedAt, e.stoppedAt), 0);
              const projEarnings = proj?.hourlyRate ? (projMs / 3_600_000) * proj.hourlyRate : null;

              return (
                <div key={projId ?? "_none"} className="bg-zinc-800/30 rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between mb-1.5">
                    {proj ? (
                      <Badge label={proj.name} color={proj.color} />
                    ) : (
                      <span className="text-xs text-zinc-500 italic">No project</span>
                    )}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-zinc-400">{formatDurationShort(projMs)}</span>
                      {projEarnings !== null && (
                        <span className="text-green-400">{formatCurrency(projEarnings)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {projEntries.map((e) => {
                      const dur = elapsedMs(e.startedAt, e.stoppedAt);
                      const entryDate = new Date(e.startedAt).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      });
                      return (
                        <div key={e.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-zinc-600 flex-shrink-0">{entryDate}</span>
                            <span className="text-zinc-400 truncate">{e.notes || <em className="text-zinc-600">No description</em>}</span>
                          </div>
                          <span className="text-zinc-500 font-mono ml-2 flex-shrink-0">{formatDurationShort(dur)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          {invoice.status === "draft" && (
            <Button variant="ghost" onClick={onMarkSent}>
              Mark sent
            </Button>
          )}
          {invoice.status === "sent" && (
            <Button variant="primary" onClick={onMarkPaid}>
              Mark paid ✓
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </Modal>
  );
}
