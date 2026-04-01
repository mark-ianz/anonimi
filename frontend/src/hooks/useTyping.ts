"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { shallow } from "zustand/shallow";
import { getChatSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/authStore";
import { useTypingStore } from "@/stores/typingStore";
import { TYPING_DEBOUNCE_MS, TYPING_TIMEOUT_MS } from "@/lib/constants";

const EMPTY_TYPING_USERS: Array<{ userId: string; username: string; expiresAt: number }> = [];

export function useTyping(conversationId: string | null) {
  const { isAuthenticated } = useAuthStore();
  const typingUsersRaw = useTypingStore(
    (state) => (conversationId ? state.typing[conversationId] ?? EMPTY_TYPING_USERS : EMPTY_TYPING_USERS),
    shallow
  );
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId || !isAuthenticated) return;
      const socket = getChatSocket();
      if (!socket.connected) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[typing] skip emit (socket disconnected)", {
            conversationId,
            isTyping,
          });
        }
        return;
      }
      socket.emit("message:typing", { conversationId, isTyping });
      if (process.env.NODE_ENV !== "production") {
        console.debug("[typing] emit", { conversationId, isTyping });
      }
      isTypingRef.current = isTyping;
    },
    [conversationId, isAuthenticated]
  );

  const onInputChange = useCallback(() => {
    if (!isTypingRef.current) {
      emitTyping(true);
    }
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      emitTyping(false);
    }, TYPING_TIMEOUT_MS);
  }, [emitTyping]);

  const onBlur = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isTypingRef.current) emitTyping(false);
  }, [emitTyping]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (isTypingRef.current) emitTyping(false);
    };
  }, [emitTyping, conversationId]);

  const typingUsers = useMemo(() => {
    const now = Date.now();
    return typingUsersRaw.filter((user) => user.expiresAt > now);
  }, [typingUsersRaw]);

  return { onInputChange, onBlur, typingUsers };
}
