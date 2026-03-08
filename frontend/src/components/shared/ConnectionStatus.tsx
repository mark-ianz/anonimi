"use client";

import { useSocketStore } from "@/stores/socketStore";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

export default function ConnectionStatus({ className }: { className?: string }) {
  const { chatStatus } = useSocketStore();

  if (chatStatus === "connected") return null;

  const isConnecting = chatStatus === "connecting" || chatStatus === "reconnecting";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
        isConnecting
          ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
          : "bg-destructive/10 text-destructive",
        className
      )}
    >
      {isConnecting ? (
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
