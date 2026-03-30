"use client";

import { cn } from "@/lib/utils";
import type { OnlineStatus } from "@/types/user";

interface OnlineIndicatorProps {
  status: OnlineStatus;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  sm: "w-2 h-2",
  md: "w-2.5 h-2.5",
  lg: "w-3.5 h-3.5",
};

const colorMap: Record<OnlineStatus, string> = {
  online: "bg-green-500",
  away: "bg-yellow-500",
  dnd: "bg-red-500",
  offline: "bg-muted-foreground/40",
};

const labelMap: Record<OnlineStatus, string> = {
  online: "Online",
  away: "Away",
  dnd: "Do Not Disturb",
  offline: "Offline",
};

export default function OnlineIndicator({
  status,
  size = "md",
  className,
  showLabel,
}: OnlineIndicatorProps) {
  return (
    <span className={cn("flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "rounded-full shrink-0",
          sizeMap[size],
          colorMap[status],
          status === "online" && "animate-pulse"
        )}
      />
      {showLabel && (
        <span className="text-xs text-muted-foreground">{labelMap[status]}</span>
      )}
    </span>
  );
}
