"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "anonimi-ui"; // store full ui JSON: { state: { theme, ... }, version }

export default function ThemeToggle() {
  // Start as `system` for SSR parity. Read stored preference after mount.
  const [theme, setTheme] = useState<Theme>("system");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const storedTheme = parsed?.state?.theme;
      if (storedTheme === "light" || storedTheme === "dark" || storedTheme === "system") {
        setTheme(storedTheme as Theme);
      }
    } catch {
      // ignore malformed storage
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");

    function apply(pref: Theme) {
      if (pref === "dark") {
        document.documentElement.classList.add("dark");
      } else if (pref === "light") {
        document.documentElement.classList.remove("dark");
      } else {
        // system
        if (mq?.matches) document.documentElement.classList.add("dark");
        else document.documentElement.classList.remove("dark");
      }
    }

    apply(theme);

    function onMq(e: MediaQueryListEvent) {
      if (theme === "system") apply("system");
    }

    mq?.addEventListener?.("change", onMq);
    return () => mq?.removeEventListener?.("change", onMq);
  }, [theme]);

  useEffect(() => {
    try {
      // preserve other ui state keys, write state.theme
      const raw = localStorage.getItem(STORAGE_KEY);
      let parsed: any = {};
      if (raw) {
        try {
          parsed = JSON.parse(raw) || {};
        } catch {
          parsed = {};
        }
      }
      parsed.state = parsed.state || {};
      parsed.state.theme = theme;
      if (typeof parsed.version === "undefined") parsed.version = 0;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    } catch {}
  }, [theme]);

  function cycle() {
    setTheme((t) => (t === "light" ? "dark" : t === "dark" ? "system" : "light"));
  }

  const title = theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  return (
    <button
      aria-label={`Theme: ${title}`}
      title={`Theme: ${title}`}
      onClick={cycle}
      className="h-9 w-9 rounded-full flex items-center justify-center bg-card/70 border border-border/60 text-muted-foreground hover:text-foreground transition-colors"
    >
      {theme === "light" && <Sun className="h-4 w-4" />}
      {theme === "dark" && <Moon className="h-4 w-4" />}
      {theme === "system" && <Monitor className="h-4 w-4" />}
    </button>
  );
}
