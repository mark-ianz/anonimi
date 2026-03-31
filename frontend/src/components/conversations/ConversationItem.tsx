"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePresence } from "@/hooks/usePresence";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import type { Conversation } from "@/types/conversation";
import DateDisplay from "@/components/shared/DateDisplay";

interface ConversationItemProps {
  conversation: Conversation;
  isActive?: boolean;
  style?: React.CSSProperties;
}

function getLastMessagePreview(conversation: Conversation): string {
  const lm = conversation.lastMessage;
  if (!lm) return "No messages yet";
  if (lm.type === "image") return "📷 Photo";
  if (lm.type === "video") return "🎥 Video";
  if (lm.type === "audio") return "🎵 Audio";
  if (lm.type === "file") return "📎 File";
  if (lm.type === "system") return lm.content ?? "";
  return lm.content ?? "";
}

export default function ConversationItem({
  conversation,
  isActive,
  style,
}: ConversationItemProps) {
  const { user } = useAuthStore();
  const { unreadCounts } = useChatStore();
  const isGroup = conversation.type === "group";
  const participantId = conversation.participant?.id;
  const { status: presenceStatus } = usePresence(
    isGroup ? null : participantId,
    conversation.participant?.onlineStatus ?? "offline"
  );

  const unread = unreadCounts[conversation.id] ?? conversation.unreadCount ?? 0;
  const hasUnread = unread > 0;

  const displayName = isGroup
    ? conversation.group?.name ?? "Group"
    : conversation.participant?.nickname ?? conversation.participant?.username ?? "Unknown";

  const displayImage = isGroup
    ? conversation.group?.image
    : conversation.participant?.profileImage;

  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const isPending = conversation.requestStatus === "pending";
  const lastSenderIsMe = conversation.lastMessage?.senderId === user?.id;
  const basePreview = getLastMessagePreview(conversation);
  const preview = isPending
    ? "Pending request..."
    : lastSenderIsMe
    ? `You: ${basePreview}`
    : basePreview;
  const timestamp = conversation.lastMessage?.timestamp ?? conversation.updatedAt;

  return (
    <Link
      href={`/chat/${conversation.id}`}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-3 transition-colors group cursor-pointer border-b border-border/20 animate-fade-in",
        isActive ? "bg-primary/10" : "hover:bg-muted/50"
      )}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div
          className={cn(
            "w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-white font-medium text-sm",
            isGroup
              ? "bg-linear-to-br from-violet-500 to-purple-600"
              : "bg-linear-to-br from-cyan-500 to-blue-600"
          )}
        >
          {displayImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </div>
        {!isGroup && (
          <span
            className={cn(
              "absolute bottom-0 right-0 w-3 h-3 border-2 border-background rounded-full",
              presenceStatus === "online"
                ? "bg-green-500"
                : presenceStatus === "away"
                ? "bg-yellow-500"
                : presenceStatus === "dnd"
                ? "bg-red-500"
                : "bg-muted-foreground/40"
            )}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <span
            className={cn(
              "text-sm truncate",
              hasUnread ? "font-semibold text-foreground" : "font-medium"
            )}
          >
            {displayName}
          </span>
          {timestamp && (
            <DateDisplay
              date={timestamp}
              format="relative"
              className={cn("shrink-0 ml-2", hasUnread && "text-primary font-medium")}
            />
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p
            className={cn(
              "text-xs truncate",
              hasUnread ? "text-foreground font-medium" : "text-muted-foreground"
            )}
          >
            {preview}
          </p>
          {hasUnread && (
            <span className="shrink-0 min-w-4.5 h-4.5 px-1 rounded-full bg-primary text-white text-[10px] font-semibold flex items-center justify-center">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
