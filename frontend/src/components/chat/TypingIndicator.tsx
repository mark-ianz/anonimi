"use client";

import { cn } from "@/lib/utils";

interface TypingUser {
  userId: string;
  username: string;
}

interface TypingIndicatorProps {
  users: TypingUser[];
  className?: string;
}

export default function TypingIndicator({ users, className }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const safeName = (value: string) => value?.trim() || "Someone";

  const label =
    users.length === 1
      ? `${safeName(users[0].username)} is typing...`
      : users.length === 2
      ? `${safeName(users[0].username)} and ${safeName(users[1].username)} are typing...`
      : `${safeName(users[0].username)} and ${users.length - 1} others are typing...`;

  return (
    <div className={cn("flex items-center gap-2 px-4 py-1 animate-fade-in", className)}>
      <div className="flex items-end gap-0.5">
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}
