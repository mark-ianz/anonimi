"use client";

import { useCallback, useEffect, useRef } from "react";
import { getChatSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/authStore";
import { useTypingStore } from "@/stores/typingStore";
import { TYPING_DEBOUNCE_MS, TYPING_TIMEOUT_MS } from "@/lib/constants";

export function useTyping(conversationId: string | null) {
  const { isAuthenticated } = useAuthStore();
  const { getTypingUsers } = useTypingStore();
  const isTypingRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!conversationId || !isAuthenticated) return;
      const socket = getChatSocket();
      if (!socket.connected) return;
      socket.emit("message:typing", { conversationId, isTyping });
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

  const typingUsers = conversationId ? getTypingUsers(conversationId) : [];

  return { onInputChange, onBlur, typingUsers };
}
