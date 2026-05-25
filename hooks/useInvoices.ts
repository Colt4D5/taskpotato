"use client";

import { useStorage } from "./useStorage";
import { Invoice } from "@/types";
import { uuid } from "@/lib/uuid";

export function useInvoices() {
  const [invoices, setInvoices] = useStorage<Invoice[]>("invoices", []);

  function addInvoice(data: Omit<Invoice, "id" | "issuedAt">): Invoice {
    const invoice: Invoice = {
      ...data,
      id: uuid(),
      issuedAt: Date.now(),
    };
    setInvoices((prev) => [invoice, ...prev]);
    return invoice;
  }

  function updateInvoice(id: string, patch: Partial<Omit<Invoice, "id">>) {
    setInvoices((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, ...patch } : inv))
    );
  }

  function deleteInvoice(id: string) {
    setInvoices((prev) => prev.filter((inv) => inv.id !== id));
  }

  function markSent(id: string) {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "sent" as const, sentAt: Date.now() } : inv
      )
    );
  }

  function markPaid(id: string) {
    setInvoices((prev) =>
      prev.map((inv) =>
        inv.id === id ? { ...inv, status: "paid" as const, paidAt: Date.now() } : inv
      )
    );
  }

  /** Generate a new invoice number like INV-042 based on existing count */
  function nextInvoiceNumber(): string {
    const n = invoices.length + 1;
    return `INV-${String(n).padStart(3, "0")}`;
  }

  return {
    invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    markSent,
    markPaid,
    nextInvoiceNumber,
  };
}
