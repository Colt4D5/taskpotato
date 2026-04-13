export interface Project {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  createdAt: number;
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
  resumedAt?: number;   // timestamp when last resumed (for in-progress resume)
  offsetMs?: number;    // accumulated ms from previous runs before this resume
}

export interface AppSettings {
  theme: "light" | "dark" | "system";
  weekStartsOn: 0 | 1;
  defaultView: "timer" | "log" | "reports";
  idleAlertHours: 0 | 1 | 2 | 4 | 8;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: "system",
  weekStartsOn: 1,
  defaultView: "timer",
  idleAlertHours: 2,
};
