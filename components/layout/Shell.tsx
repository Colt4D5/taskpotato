"use client";

import { Nav } from "./Nav";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useCommandPalette } from "@/hooks/useCommandPalette";
import { useEntries } from "@/hooks/useEntries";
import { useProjects } from "@/hooks/useProjects";
import { useTasks } from "@/hooks/useTasks";
import { CommandPalette } from "@/components/ui/CommandPalette";

export function Shell({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  const { isOpen, open, close } = useCommandPalette();
  const { entries } = useEntries();
  const { projects } = useProjects();
  const { tasks } = useTasks();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-zinc-950 text-zinc-100">
      <Nav onOpenCommandPalette={open} />
      <main className="flex-1 pb-20 md:pb-0 overflow-y-auto">
        {children}
      </main>
      {isOpen && (
        <CommandPalette
          entries={entries}
          projects={projects}
          tasks={tasks}
          onClose={close}
        />
      )}
    </div>
  );
}
