"use client";

import { cn } from "@/lib/utils";
import UserAvatar from "@/components/shared/UserAvatar";

interface TypingUser {
  userId: string;
  username: string;
  profileImage?: string | null;
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
      ? `${safeName(users[0].username)} is typing`
      : users.length === 2
      ? `${safeName(users[0].username)} and ${safeName(users[1].username)} are typing`
      : `${safeName(users[0].username)} and ${users.length - 1} others are typing`;

  const visibleUsers = users.slice(0, 2);
  const extraCount = users.length - visibleUsers.length;

  return (
    <div className={cn("flex items-center gap-2 px-4 py-1 animate-fade-in", className)}>
      <div className="flex items-center -space-x-2">
        {visibleUsers.map((typingUser) => (
          <UserAvatar
            key={typingUser.userId}
            imageUrl={typingUser.profileImage}
            name={typingUser.username}
            alt={typingUser.username}
            className="h-8 w-8 ring-1 ring-background"
            textClassName="text-sm"
          />
        ))}
        {extraCount > 0 && (
          <div className="h-8 w-8 rounded-full ring-1 ring-background bg-muted text-xs text-muted-foreground flex items-center justify-center">
            +{extraCount}
          </div>
        )}
      </div>
      <span className="text-xs text-muted-foreground ml-1">
        {label}
        <span className="typing-ellipsis" aria-hidden="true">...</span>
      </span>
    </div>
  );
}
