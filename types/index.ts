export interface Task {
  id: string;           // crypto.randomUUID()
  title: string;
  description: string;
  totalMs: number;      // accumulated time in ms
  createdAt: string;    // ISO string
  order: number;        // for sorting within day
}

export interface ActiveTimer {
  taskId: string;
  startedAt: number;    // Date.now() timestamp
}
