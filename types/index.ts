export interface Client {
  id: string;
  name: string;
  color: string;
  notes?: string;
  monthlyBudgetHours?: number; // 0 or undefined = no budget
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  createdAt: number;
  budgetHours?: number;       // 0 or undefined = no budget (all-time)
  weeklyTargetHours?: number; // 0 or undefined = no weekly target
  hourlyRate?: number;        // USD per hour; undefined = no rate set
  clientId?: string | null;
}

export interface Task {
  id: string;
  projectId: string;
  name: string;
  notes: string;
  archived: boolean;
  createdAt: number;
}

export interface TimeEntry {
  id: string;
  taskId: string | null;
  projectId: string | null;
  startedAt: number;
  stoppedAt: number | null;
  notes: string;
  tags: string[];
  billable: boolean;
  resumedAt?: number;   // timestamp when last resumed (for in-progress resume)
  offsetMs?: number;    // accumulated ms from previous runs before this resume
  invoiceId?: string;   // set when entry has been added to an invoice
}

export interface EntryTemplate {
  id: string;
  name: string;
  projectId: string | null;
  taskId: string | null;
  notes: string;
  tags: string[];
  billable: boolean;
  createdAt: number;
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  weekStartsOn: 0 | 1;
  defaultView: "timer" | "log" | "reports";
  idleAlertHours: 0 | 1 | 2 | 4 | 8;
  timeRounding: 0 | 5 | 10 | 15;
  weeklyGoalHours: number; // 0 = disabled
  tagGoals?: Record<string, number>; // tag name → hours/week; omit or 0 = no goal
}

export interface FilterPreset {
  id: string;
  name: string;
  clientId: string;
  projectId: string;
  taskName: string;
  tag: string;
  notes: string;
  dateRangeFrom: string; // YYYY-MM-DD or ""
  dateRangeTo: string;   // YYYY-MM-DD or ""
  createdAt: number;
}

export interface Invoice {
  id: string;
  number: string;          // user-defined invoice number, e.g. "INV-001"
  clientId: string | null; // which client this is billed to
  projectIds: string[];    // projects included (for display)
  entryIds: string[];      // the entry ids that make up this invoice
  totalMs: number;         // total tracked time in ms (billable only)
  totalEarnings: number;   // total USD amount
  status: "draft" | "sent" | "paid";
  issuedAt: number;        // timestamp when invoice was created
  sentAt?: number;         // timestamp when marked sent
  paidAt?: number;         // timestamp when marked paid
  notes?: string;          // optional memo/notes
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  weekStartsOn: 1,
  defaultView: "timer",
  idleAlertHours: 2,
  timeRounding: 0,
  weeklyGoalHours: 0,
  tagGoals: {},
};
