"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Moon, Sun, Monitor, Bell, Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/uiStore";
import { useAuth } from "@/hooks/useAuth";
import { useSocketContext } from "@/providers/SocketProvider";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushNotifications";
import type { AppearanceStatus } from "@/types/user";

type Theme = "light" | "dark" | "system";

const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const appearanceOptions: {
  value: AppearanceStatus;
  label: string;
  description: string;
  dotClass: string;
}[] = [
  {
    value: "online",
    label: "Online",
    description: "Show as available",
    dotClass: "bg-green-500",
  },
  {
    value: "away",
    label: "Away",
    description: "Show as temporarily away",
    dotClass: "bg-yellow-500",
  },
  {
    value: "dnd",
    label: "Do Not Disturb",
    description: "Show as busy",
    dotClass: "bg-red-500",
  },
  {
    value: "invisible",
    label: "Invisible",
    description: "Appear offline to others",
    dotClass: "bg-muted-foreground/45",
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(true);
  const [isPushToggling, setIsPushToggling] = useState(false);
  const { user, updateProfile, isUpdatingProfile } = useAuth();
  const { chatSocket } = useSocketContext();

  const appearanceStatus = user?.appearanceStatus ?? "online";

  const handleAppearanceChange = (status: AppearanceStatus) => {
    if (!user || status === user.appearanceStatus) return;

    updateProfile({ appearanceStatus: status });
    chatSocket?.emit("presence:set-status", { status });
  };

  useEffect(() => {
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const res = await api.get("/notifications/push/status");
        if (!isMounted) return;
        setPushEnabled(!!res.data?.data?.enabled);
      } catch {
        if (isMounted) {
          setPushEnabled(false);
        }
      } finally {
        if (isMounted) setIsPushLoading(false);
      }
    };

    loadStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePushToggle = async () => {
    if (isPushToggling || isPushLoading) return;
    if (!isPushSupported()) {
      toast.error("Push notifications are not supported in this browser.");
      return;
    }

    setIsPushToggling(true);

    try {
      if (!pushEnabled) {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          toast.error("Permission denied for notifications.");
          return;
        }

        const keyRes = await api.get("/notifications/push/public-key");
        const publicKey = keyRes.data?.data?.publicKey as string | undefined;
        if (!publicKey) {
          toast.error("Push notifications are not configured.");
          return;
        }

        const subscription = await subscribeToPush(publicKey);
        const payload = subscription.toJSON();
        await api.post("/notifications/push/subscribe", {
          endpoint: payload.endpoint,
          keys: payload.keys,
          expirationTime: payload.expirationTime ?? null,
          userAgent: navigator.userAgent,
        });
        setPushEnabled(true);
        toast.success("Push notifications enabled.");
      } else {
        const endpoint = await unsubscribeFromPush();
        await api.post("/notifications/push/unsubscribe", endpoint ? { endpoint } : {});
        setPushEnabled(false);
        toast.success("Push notifications disabled.");
      }
    } catch {
      toast.error("Failed to update push notifications.");
    } finally {
      setIsPushToggling(false);
    }
  };

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
              Status Visibility
            </h2>
            <div className="grid gap-2">
              {appearanceOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleAppearanceChange(option.value)}
                  disabled={isUpdatingProfile}
                  className={cn(
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors",
                    appearanceStatus === option.value
                      ? "border-primary/45 bg-primary/10"
                      : "border-border/60 bg-background hover:bg-muted/40",
                    isUpdatingProfile && "opacity-80"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn("h-2.5 w-2.5 rounded-full", option.dotClass)} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.description}</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full border",
                      appearanceStatus === option.value
                        ? "border-primary bg-primary"
                        : "border-border/70"
                    )}
                  />
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
                onClick={handlePushToggle}
                disabled={isPushLoading || isPushToggling}
                className={cn(
                  "relative h-6 w-11 rounded-full transition-colors",
                  pushEnabled ? "bg-primary" : "bg-muted-foreground/35",
                  (isPushLoading || isPushToggling) && "opacity-60 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "absolute top-1 h-4 w-4 rounded-full bg-white transition-transform shadow-sm",
                    pushEnabled ? "translate-x-6" : "translate-x-1"
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
