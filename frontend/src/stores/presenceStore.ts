import { create } from "zustand";
import type { OnlineStatus } from "@/types/user";

interface PresenceEntry {
  status: OnlineStatus;
  lastSeen: string;
}

interface PresenceState {
  presence: Record<string, PresenceEntry>; // userId → presence

  setPresence: (userId: string, status: OnlineStatus, lastSeen: string) => void;
  bulkSetPresence: (entries: Record<string, PresenceEntry>) => void;
  getPresence: (userId: string) => PresenceEntry | null;
}

export const usePresenceStore = create<PresenceState>()((set, get) => ({
  presence: {},

  setPresence: (userId, status, lastSeen) =>
    set((state) => ({
      presence: {
        ...state.presence,
        [userId]: { status, lastSeen },
      },
    })),

  bulkSetPresence: (entries) =>
    set((state) => ({
      presence: { ...state.presence, ...entries },
    })),

  getPresence: (userId) => get().presence[userId] ?? null,
}));
