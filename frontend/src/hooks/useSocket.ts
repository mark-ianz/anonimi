"use client";

import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { getChatSocket } from "@/lib/socket";
import { useAuthStore } from "@/stores/authStore";
import { useSocketStore } from "@/stores/socketStore";

export function useSocket(): Socket | null {
  const { isAuthenticated } = useAuthStore();
  const { chatStatus } = useSocketStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    socketRef.current = getChatSocket();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  return socketRef.current;
}
