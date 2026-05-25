"use client";

import { useState, useMemo } from "react";
import { TimeEntry, Project, Client, Invoice } from "@/types";
import { elapsedMs, formatDurationShort } from "@/lib/duration";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface CreateInvoiceModalProps {
  open: boolean;
  onClose: () => void;
  entries: TimeEntry[];
  projects: Project[];
  clients: Client[];
  defaultNumber: string;
  onCreate: (
    data: Omit<Invoice, "id" | "issuedAt">,
    entryIds: string[]
  ) => void;
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

function toLocalIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function CreateInvoiceModal({
  open,
  onClose,
  entries,
  projects,
  clients,
  defaultNumber,
  onCreate,
}: CreateInvoiceModalProps) {
  const today = toLocalIso(new Date());
  const firstOfMonth = toLocalIso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [invoiceNumber, setInvoiceNumber] = useState(defaultNumber);
  const [clientId, setClientId] = useState<string>("");
  const [dateFrom, setDateFrom] = useState<string>(firstOfMonth);
  const [dateTo, setDateTo] = useState<string>(today);
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string>("");

  const projectMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  // Completed, billable, not already invoiced entries within the range
  const candidateEntries = useMemo(() => {
    if (!dateFrom || !dateTo) return [];
    const fromMs = new Date(dateFrom + "T00:00:00").getTime();
    const toMs = new Date(dateTo + "T23:59:59").getTime();

    return entries.filter((e) => {
      if (e.stoppedAt === null) return false;
      if (e.billable === false) return false;
      if (e.invoiceId) return false;
      if (e.startedAt < fromMs || e.startedAt > toMs) return false;
      if (clientId) {
        const proj = e.projectId ? projectMap.get(e.projectId) : null;
        if (!proj || proj.clientId !== clientId) return false;
      }
      return true;
    });
  }, [entries, dateFrom, dateTo, clientId, projectMap]);

  // Compute totals
  const { totalMs, totalEarnings, projectIds } = useMemo(() => {
    let ms = 0;
    let earnings = 0;
    const projSet = new Set<string>();
    for (const e of candidateEntries) {
      const dur = elapsedMs(e.startedAt, e.stoppedAt);
      ms += dur;
      if (e.projectId) {
        projSet.add(e.projectId);
        const proj = projectMap.get(e.projectId);
        if (proj?.hourlyRate) {
          earnings += (dur / 3_600_000) * proj.hourlyRate;
        }
      }
    }
    return { totalMs: ms, totalEarnings: earnings, projectIds: Array.from(projSet) };
  }, [candidateEntries, projectMap]);

  // Group candidate entries by project for preview
  const byProject = useMemo(() => {
    const map = new Map<string | null, TimeEntry[]>();
    for (const e of candidateEntries) {
      const key = e.projectId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).sort((a, b) => {
      const aMs = a[1].reduce((s, x) => s + elapsedMs(x.startedAt, x.stoppedAt), 0);
      const bMs = b[1].reduce((s, x) => s + elapsedMs(x.startedAt, x.stoppedAt), 0);
      return bMs - aMs;
    });
  }, [candidateEntries]);

  function handleCreate() {
    setError("");
    if (!invoiceNumber.trim()) { setError("Invoice number is required."); return; }
    if (!dateFrom || !dateTo) { setError("Date range is required."); return; }
    if (new Date(dateFrom) > new Date(dateTo)) { setError("Start date must be before end date."); return; }
    if (candidateEntries.length === 0) { setError("No unbilled billable entries in this range."); return; }

    const data: Omit<Invoice, "id" | "issuedAt"> = {
      number: invoiceNumber.trim(),
      clientId: clientId || null,
      projectIds,
      entryIds: candidateEntries.map((e) => e.id),
      totalMs,
      totalEarnings,
      status: "draft",
      notes: notes.trim() || undefined,
    };
    onCreate(data, candidateEntries.map((e) => e.id));
    onClose();
    // reset
    setInvoiceNumber(defaultNumber);
    setClientId("");
    setDateFrom(firstOfMonth);
    setDateTo(today);
    setNotes("");
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Invoice">
      <div className="flex flex-col gap-4">

        {/* Invoice number */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Invoice Number</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            placeholder="INV-001"
          />
        </div>

        {/* Client filter */}
        {clients.length > 0 && (
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Client (optional)</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <option value="">All clients</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date range */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-zinc-400 mb-1">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-zinc-400 mb-1">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs text-zinc-400 mb-1">Memo / Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-orange-500/50 placeholder-zinc-600"
            placeholder="Due in 30 days…"
          />
        </div>

        {/* Preview */}
        {candidateEntries.length > 0 ? (
          <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                {candidateEntries.length} entries · {formatDurationShort(totalMs)}
              </span>
              {totalEarnings > 0 && (
                <span className="text-sm font-mono font-semibold text-green-400">
                  {formatCurrency(totalEarnings)}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
              {byProject.map(([projId, projEntries]) => {
                const proj = projId ? projectMap.get(projId) : null;
                const projMs = projEntries.reduce((s, e) => s + elapsedMs(e.startedAt, e.stoppedAt), 0);
                const projEarnings = proj?.hourlyRate
                  ? (projMs / 3_600_000) * proj.hourlyRate
                  : null;
                return (
                  <div key={projId ?? "_none"} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {proj ? (
                        <Badge label={proj.name} color={proj.color} />
                      ) : (
                        <span className="text-xs text-zinc-500 italic">No project</span>
                      )}
                      <span className="text-xs text-zinc-500">{projEntries.length} entries</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="text-zinc-400">{formatDurationShort(projMs)}</span>
                      {projEarnings !== null && (
                        <span className="text-green-400">{formatCurrency(projEarnings)}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (dateFrom && dateTo) ? (
          <div className="text-xs text-zinc-500 text-center py-3 bg-zinc-800/30 rounded-lg border border-zinc-800">
            No unbilled billable entries in this range
          </div>
        ) : null}

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary"
            onClick={handleCreate}
            disabled={candidateEntries.length === 0}
          >
            Create Invoice
          </Button>
        </div>
      </div>
    </Modal>
  );
}
