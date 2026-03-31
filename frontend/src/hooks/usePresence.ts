"use client";

import { usePresenceStore } from "@/stores/presenceStore";
import type { OnlineStatus } from "@/types/user";

export function usePresence(userId: string | null | undefined): {
  status: OnlineStatus;
  lastSeen: string | null;
}
export function usePresence(
  userId: string | null | undefined,
  fallbackStatus: OnlineStatus,
  fallbackLastSeen?: string | null
): {
  status: OnlineStatus;
  lastSeen: string | null;
}
export function usePresence(
  userId: string | null | undefined,
  fallbackStatus: OnlineStatus = "offline",
  fallbackLastSeen: string | null = null
): {
  status: OnlineStatus;
  lastSeen: string | null;
} {
  const { getPresence } = usePresenceStore();

  if (!userId) return { status: fallbackStatus, lastSeen: fallbackLastSeen };

  const entry = getPresence(userId);
  return {
    status: entry?.status ?? fallbackStatus,
    lastSeen: entry?.lastSeen ?? fallbackLastSeen,
  };
}
