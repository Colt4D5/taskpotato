"use client";

import { Nav } from "./Nav";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

export function Shell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100">
      <Nav />
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
