"use client";

import { useEffect } from "react";
import { useUIStore, type Theme } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();
  const fontStyle = useAuthStore((state) => state.user?.fontStyle ?? "modern");

  useEffect(() => {
    const root = document.documentElement;

    function applyTheme(t: Theme) {
      if (t === "dark") {
        root.classList.add("dark");
      } else if (t === "light") {
        root.classList.remove("dark");
      } else {
        // system
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", prefersDark);
      }
    }

    applyTheme(theme);

    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        root.classList.toggle("dark", e.matches);
      };
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.fontStyle = fontStyle;
  }, [fontStyle]);

  return <>{children}</>;
}
