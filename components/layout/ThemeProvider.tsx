"use client";

import { useEffect } from "react";
import { useStorage } from "@/hooks/useStorage";
import { AppSettings, DEFAULT_SETTINGS } from "@/types";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings] = useStorage<AppSettings>("settings", DEFAULT_SETTINGS);

  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = (theme: AppSettings["theme"]) => {
      if (theme === "system") {
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
        root.classList.toggle("light", !prefersDark);
      } else {
        root.classList.toggle("dark", theme === "dark");
        root.classList.toggle("light", theme === "light");
      }
    };

    applyTheme(settings.theme);

    if (settings.theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("system");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [settings.theme]);

  return <>{children}</>;
}
