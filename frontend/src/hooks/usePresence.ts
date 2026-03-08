"use client";

import { usePresenceStore } from "@/stores/presenceStore";
import type { OnlineStatus } from "@/types/user";

export function usePresence(userId: string | null | undefined): {
  status: OnlineStatus;
  lastSeen: string | null;
} {
  const { getPresence } = usePresenceStore();

  if (!userId) return { status: "offline", lastSeen: null };

  const entry = getPresence(userId);
  return {
    status: entry?.status ?? "offline",
    lastSeen: entry?.lastSeen ?? null,
  };
}
