import { create } from "zustand";

interface TypingUser {
  userId: string;
  username: string;
  expiresAt: number; // timestamp
}

interface TypingState {
  typing: Record<string, TypingUser[]>; // conversationId → typing users

  setTyping: (conversationId: string, userId: string, username: string, isTyping: boolean) => void;
  getTypingUsers: (conversationId: string) => TypingUser[];
  pruneExpired: () => void;
}

const TYPING_EXPIRY_MS = 5500;

export const useTypingStore = create<TypingState>()((set, get) => ({
  typing: {},

  setTyping: (conversationId, userId, username, isTyping) =>
    set((state) => {
      const current = state.typing[conversationId] ?? [];

      if (!isTyping) {
        return {
          typing: {
            ...state.typing,
            [conversationId]: current.filter((u) => u.userId !== userId),
          },
        };
      }

      const filtered = current.filter((u) => u.userId !== userId);
      return {
        typing: {
          ...state.typing,
          [conversationId]: [
            ...filtered,
            { userId, username, expiresAt: Date.now() + TYPING_EXPIRY_MS },
          ],
        },
      };
    }),

  getTypingUsers: (conversationId) => {
    const now = Date.now();
    return (get().typing[conversationId] ?? []).filter(
      (u) => u.expiresAt > now
    );
  },

  pruneExpired: () =>
    set((state) => {
      const now = Date.now();
      const pruned: Record<string, TypingUser[]> = {};
      for (const [convId, users] of Object.entries(state.typing)) {
        pruned[convId] = users.filter((u) => u.expiresAt > now);
      }
      return { typing: pruned };
    }),
}));
