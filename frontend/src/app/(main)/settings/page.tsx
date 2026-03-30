"use client";

import { useState } from "react";
import Link from "next/link";
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
      <div className="flex h-full flex-col overflow-y-auto bg-background">
        <div className="mx-auto w-full max-w-2xl space-y-6 p-6">
          <div className="border-l border-border/70 pl-5">
            <p className="font-mono text-[0.66rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Preferences
            </p>
            <h1 className="mt-2 text-3xl leading-tight font-semibold">Settings</h1>
          </div>

          <section className="space-y-3 rounded-2xl border border-border/60 bg-card/45 p-5">
            <h2 className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Appearance
            </h2>
            <div className="flex gap-2">
              {themes.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn(
                    "flex-1 flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm transition-colors",
                    theme === value
                      ? "border-primary/45 bg-primary/10 text-foreground"
                      : "border-border/60 bg-background hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border/60 bg-card/45 p-5">
            <h2 className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Notifications
            </h2>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3">
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
                  "relative h-6 w-11 rounded-full transition-colors",
                  notifications ? "bg-primary" : "bg-muted-foreground/35"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                    notifications ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            </div>
          </section>

          <section className="space-y-3 rounded-2xl border border-border/60 bg-card/45 p-5">
            <h2 className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Privacy & Security
            </h2>
            <div className="space-y-2">
              <Link href="/blocked" className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background p-3 transition-colors hover:bg-muted/45">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Blocked users</span>
              </Link>
              <Link href="/support" className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background p-3 transition-colors hover:bg-muted/45">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Support & help</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
    </ProtectedRoute>
  );
}
