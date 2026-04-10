"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import ProtectedRoute from "@/components/shared/ProtectedRoute";
import { Moon, Sun, Monitor, Bell, Shield, Lock, Type, Volume2, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { getChatSocket } from "@/lib/socket";
import { useUIStore } from "@/stores/uiStore";
import { useAuth } from "@/hooks/useAuth";
import api from "@/lib/api";
import { toast } from "sonner";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/pushNotifications";
import { NOTIFICATION_SOUND_OPTIONS, playNotificationSound } from "@/lib/notificationSounds";
import type { AppearanceStatus, FontStyle, NotificationSound } from "@/types/user";

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

const fontOptions: {
  value: FontStyle;
  label: string;
  description: string;
  previewFamily: CSSProperties["fontFamily"];
}[] = [
  {
    value: "modern",
    label: "Modern",
    description: "Manrope-inspired clean sans serif",
    previewFamily: 'var(--font-manrope), "Segoe UI", sans-serif',
  },
  {
    value: "system",
    label: "System",
    description: "Native platform UI font stack",
    previewFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  {
    value: "editorial",
    label: "Editorial",
    description: "Classic serif with a print-like feel",
    previewFamily: 'Georgia, "Times New Roman", serif',
  },
  {
    value: "rounded",
    label: "Rounded",
    description: "Softer, friendlier letterforms",
    previewFamily: '"Trebuchet MS", "Avenir Next", "Segoe UI", sans-serif',
  },
  {
    value: "humanist",
    label: "Humanist",
    description: "Warm, readable sans serif with personality",
    previewFamily: '"Gill Sans", "Trebuchet MS", Calibri, sans-serif',
  },
  {
    value: "mono",
    label: "Mono",
    description: "Technical monospaced look",
    previewFamily: 'var(--font-fira-mono), "SFMono-Regular", Consolas, monospace',
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useUIStore();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [isPushLoading, setIsPushLoading] = useState(true);
  const [isPushToggling, setIsPushToggling] = useState(false);
  const [isBrave, setIsBrave] = useState(false);
  const { user, updateProfile, isUpdatingProfile } = useAuth();

  const appearanceStatus = user?.appearanceStatus ?? "online";
  const selectedFontStyle = user?.fontStyle ?? "modern";
  const notificationSoundEnabled = user?.notificationSoundEnabled ?? true;
  const selectedNotificationSound = user?.notificationSound ?? "notification_1";

  const handleAppearanceChange = (status: AppearanceStatus) => {
    if (!user || status === user.appearanceStatus) return;

    updateProfile({ appearanceStatus: status });
    getChatSocket().emit("presence:set-status", { status });
  };

  const handleFontStyleChange = (fontStyle: FontStyle) => {
    if (!user || fontStyle === user.fontStyle) return;
    updateProfile({ fontStyle });
  };

  const handleNotificationSoundEnabledChange = (enabled: boolean) => {
    if (!user || enabled === notificationSoundEnabled) return;
    updateProfile({ notificationSoundEnabled: enabled });
  };

  const handleNotificationSoundChange = async (sound: NotificationSound) => {
    if (!user) return;
    if (sound !== selectedNotificationSound) {
      updateProfile({ notificationSound: sound });
    }
    await playNotificationSound(sound);
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

  useEffect(() => {
    let isMounted = true;

    const detectBrave = async () => {
      if (typeof navigator === "undefined") return;
      const braveApi = (navigator as { brave?: { isBrave?: () => Promise<boolean> } }).brave;
      if (braveApi?.isBrave) {
        try {
          const result = await braveApi.isBrave();
          if (isMounted) setIsBrave(result);
          return;
        } catch {
          // Fall back to UA check.
        }
      }

      const ua = navigator.userAgent || "";
      if (isMounted) setIsBrave(ua.includes("Brave"));
    };

    void detectBrave();

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

  const handleOpenBraveSettings = async () => {
    const opened = window.open("brave://settings/privacy", "_blank");
    if (opened) return;

    try {
      await navigator.clipboard.writeText("brave://settings/privacy");
      toast.info("Brave settings link copied. Paste it in the address bar.");
    } catch {
      toast.info("Open brave://settings/privacy in the address bar.");
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
                    "flex-1 flex flex-col items-center gap-1.5 rounded-xl border py-3 text-sm transition-colors cursor-pointer",
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
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-mono text-[0.68rem] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Font Style
              </h2>
            </div>
            <div
              className="rounded-2xl border border-border/60 bg-background px-4 py-4 text-base text-foreground"
              style={{
                fontFamily:
                  fontOptions.find((option) => option.value === selectedFontStyle)?.previewFamily,
              }}
            >
              The quick brown fox jumps over the lazy dog.
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fontOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleFontStyleChange(option.value)}
                  disabled={isUpdatingProfile}
                  className={cn(
                    "cursor-pointer rounded-2xl border p-4 text-left transition-colors",
                    selectedFontStyle === option.value
                      ? "border-primary/45 bg-primary/10"
                      : "border-border/60 bg-background hover:bg-muted/40",
                    isUpdatingProfile && "opacity-80"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{option.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{option.description}</p>
                    </div>
                    <span
                      className={cn(
                        "mt-1 h-4 w-4 rounded-full border",
                        selectedFontStyle === option.value
                          ? "border-primary bg-primary"
                          : "border-border/70"
                      )}
                    />
                  </div>
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
                  {isBrave && (
                    <p className="text-xs text-amber-600">
                      Brave requires enabling "Use Google services for push messaging" in Settings.{" "}
                      <button
                        type="button"
                        onClick={handleOpenBraveSettings}
                        className="underline hover:text-amber-700 cursor-pointer"
                      >
                        Open Brave Settings
                      </button>
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handlePushToggle}
                disabled={isPushLoading || isPushToggling}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                  pushEnabled ? "bg-primary" : "bg-muted-foreground/35",
                  (isPushLoading || isPushToggling) && "opacity-60 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm",
                    pushEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border/60 bg-background p-3">
              <div className="flex items-center gap-2.5">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Notification sound</p>
                  <p className="text-xs text-muted-foreground">
                    Play a sound for new messages and other notifications
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleNotificationSoundEnabledChange(!notificationSoundEnabled)}
                disabled={isUpdatingProfile}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
                  notificationSoundEnabled ? "bg-primary" : "bg-muted-foreground/35",
                  isUpdatingProfile && "opacity-60 cursor-not-allowed"
                )}
              >
                <span
                  className={cn(
                    "absolute left-0.5 h-5 w-5 rounded-full bg-white transition-transform shadow-sm",
                    notificationSoundEnabled ? "translate-x-5" : "translate-x-0"
                  )}
                />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {NOTIFICATION_SOUND_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "rounded-2xl border p-4 transition-colors",
                    selectedNotificationSound === option.value
                      ? "border-primary/45 bg-primary/10"
                      : "border-border/60 bg-background",
                    !notificationSoundEnabled && "opacity-55"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => void handleNotificationSoundChange(option.value)}
                      disabled={isUpdatingProfile}
                      className="flex min-w-0 flex-1 cursor-pointer items-start gap-3 text-left disabled:cursor-not-allowed"
                    >
                      <span
                        className={cn(
                          "mt-1 h-4 w-4 rounded-full border",
                          selectedNotificationSound === option.value
                            ? "border-primary bg-primary"
                            : "border-border/70"
                        )}
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{option.label}</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => void playNotificationSound(option.value)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground cursor-pointer"
                      aria-label={`Preview ${option.label}`}
                    >
                      <Play className="h-4 w-4" />
                    </button>
                  </div>
                </div>
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
                    "flex items-center justify-between rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer",
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
