"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Moon, Sun, Monitor, Bell, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";

type Theme = "light" | "dark" | "system";

const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const [notifications, setNotifications] = useState(true);

  return (
    <ProtectedRoute>
      <div className="flex flex-col h-full overflow-y-auto">
        <div className="p-6 space-y-6 max-w-lg mx-auto w-full">
          <h1 className="text-xl font-display font-semibold">Settings</h1>

          {/* Appearance */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Appearance
            </h2>
            <div className="flex gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm transition-colors",
                    theme === value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/50 hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Notifications */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Notifications
            </h2>
            <div className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/30">
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Push notifications</p>
                  <p className="text-xs text-muted-foreground">Receive message notifications</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications((v) => !v)}
                className={cn(
                  "relative w-11 h-6 rounded-full transition-colors",
                  notifications ? "bg-primary" : "bg-muted-foreground/30"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform shadow-sm",
                    notifications ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </section>

          {/* Privacy */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Privacy & Security
            </h2>
            <div className="space-y-2">
              <a href="/blocked" className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/30 hover:bg-muted/60 transition-colors">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Blocked users</span>
              </a>
              <a href="/support" className="flex items-center gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/30 hover:bg-muted/60 transition-colors">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Support & help</span>
              </a>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
