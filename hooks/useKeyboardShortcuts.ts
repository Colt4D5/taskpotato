"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface UseKeyboardShortcutsOptions {
  onToggleTimer?: () => void;
  timerInputFocused?: boolean;
}

/**
 * Global keyboard shortcuts:
 *   T → navigate to /timer
 *   L → navigate to /log
 *   R → navigate to /reports
 *   Space → toggle timer (only when no input is focused)
 *   ? → show shortcuts help (dispatches custom event)
 */
export function useKeyboardShortcuts({
  onToggleTimer,
  timerInputFocused = false,
}: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs/textareas/selects
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      if (isInput) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key.toLowerCase()) {
        case "t":
          e.preventDefault();
          router.push("/timer");
          break;
        case "l":
          e.preventDefault();
          router.push("/log");
          break;
        case "r":
          e.preventDefault();
          router.push("/reports");
          break;
        case " ":
          if (!timerInputFocused && onToggleTimer) {
            e.preventDefault();
            onToggleTimer();
          }
          break;
        case "?":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent("taskpotato:shortcuts-help"));
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [router, onToggleTimer, timerInputFocused]);
}
