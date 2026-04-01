"use client";

import { useEffect, useState } from "react";
import { useSocketStore } from "@/stores/socketStore";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

export default function ConnectionStatus({ className }: { className?: string }) {
  const { chatStatus, connectedFeedbackUntil } = useSocketStore();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!connectedFeedbackUntil) return;
    const delay = Math.max(connectedFeedbackUntil - Date.now(), 0);
    const timer = window.setTimeout(() => setNow(Date.now()), delay);
    return () => window.clearTimeout(timer);
  }, [connectedFeedbackUntil]);

  const showConnected =
    chatStatus === "connected" &&
    !!connectedFeedbackUntil &&
    connectedFeedbackUntil > now;

  if (chatStatus === "connected" && !showConnected) return null;

  const isConnecting = chatStatus === "connecting" || chatStatus === "reconnecting";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
        showConnected
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : isConnecting
          ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          : "bg-destructive/10 text-destructive",
        className
      )}
    >
      {showConnected ? (
        <>
          <span className="w-2 h-2 rounded-full bg-green-500" />
          Connected
        </>
      ) : isConnecting ? (
        <>
          <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
          Reconnecting...
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          Disconnected
        </>
      )}
    </div>
  );
}
