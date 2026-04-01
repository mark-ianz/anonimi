"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserPlus, MessageCircle } from "lucide-react";
import type { SearchUser, PublicUser } from "@/types/user";
import OnlineIndicator from "./OnlineIndicator";
import { resolveMediaUrl } from "@/lib/mediaUrl";

interface UserCardProps {
  user: SearchUser | PublicUser;
  showActions?: boolean;
  onAddContact?: (echoId: string) => void;
  onMessage?: (echoId: string) => void;
  className?: string;
}

export default function UserCard({
  user,
  showActions,
  onAddContact,
  onMessage,
  className,
}: UserCardProps) {
  const router = useRouter();
  const isContact = "isContact" in user ? user.isContact : false;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => router.push(`/user/${user.echoId}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          router.push(`/user/${user.echoId}`);
        }
      }}
      className={cn(
        "flex cursor-pointer items-center gap-3 border-b border-border/20 px-4 py-3 transition-colors hover:bg-muted/40",
        className
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-xl overflow-hidden bg-linear-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
          {user.profileImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveMediaUrl(user.profileImage)} alt={user.username} className="w-full h-full object-cover" />
          ) : (
            user.username[0].toUpperCase()
          )}
        </div>
        <OnlineIndicator
          status={user.onlineStatus}
          size="sm"
          className="absolute bottom-0 right-0 border-2 border-background rounded-full"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium hover:underline">
          {user.username}
        </p>
        <p className="text-xs text-muted-foreground">@{user.echoId}</p>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-1.5 shrink-0">
          {!isContact && onAddContact && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddContact(user.echoId);
              }}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Add
            </button>
          )}
          {onMessage && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMessage(user.echoId);
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
