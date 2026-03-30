"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { Message } from "@/types/message";
import DateDisplay from "@/components/shared/DateDisplay";
import MessageActions from "./MessageActions";
import ReadReceipt from "./ReadReceipt";
import MediaPreview from "./MediaPreview";
import { useState } from "react";

interface MessageBubbleProps {
  message: Message;
  isFirst?: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderImage?: string | null;
  participantCount?: number;
  conversationType?: "private" | "group";
  showReadReceipt?: boolean;
  timestampBubblePosition?: "single" | "first" | "middle" | "last";
}

export default function MessageBubble({
  message,
  isFirst,
  showAvatar,
  senderName,
  senderImage,
  participantCount = 2,
  conversationType = "private",
  showReadReceipt = true,
  timestampBubblePosition = "single",
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const isMine = message.senderId === user?.id;
  const [showActions, setShowActions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const bubbleShapeClass = isMine
    ? {
        // Outgoing (right side): timestamp-chain points live on right corners.
        single: "rounded-2xl",
        first: "rounded-2xl rounded-br-sm",
        middle: "rounded-2xl rounded-tr-[4px] rounded-br-[4px]",
        last: "rounded-2xl rounded-tr-sm",
      }[timestampBubblePosition]
    : {
        // Incoming (left side): timestamp-chain points live on left corners.
        single: "rounded-2xl",
        first: "rounded-2xl rounded-bl-sm",
        middle: "rounded-2xl rounded-tl-[4px] rounded-bl-[4px]",
        last: "rounded-2xl rounded-tl-sm",
      }[timestampBubblePosition];

  if (message.unsent) {
    return (
      <div className={cn("flex items-end gap-2 px-4 py-0.5", isMine && "flex-row-reverse")}>
        <div className="w-8 shrink-0" />
        <div className="px-3 py-2 rounded-2xl bg-muted/50 text-muted-foreground text-sm italic">
          Message was unsent
        </div>
      </div>
    );
  }

  if (message.type === "system") {
    return (
      <div className="flex justify-center py-2 px-4">
        <span className="text-xs text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end gap-2 px-4 py-0.5 animate-message-appear",
        isMine && "flex-row-reverse"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { if (!dialogOpen) setShowActions(false); }}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && !isMine && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
            {senderImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={senderImage} alt={senderName ?? ""} className="w-full h-full object-cover" />
            ) : (
              (senderName?.[0] ?? "?").toUpperCase()
            )}
          </div>
        )}
      </div>

      <div className={cn("flex flex-col max-w-[70%]", isMine && "items-end")}>
        {/* Sender name for groups */}
        {isFirst && !isMine && senderName && (
          <span className="text-xs text-muted-foreground mb-1 ml-1">{senderName}</span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "group/bubble relative px-3 py-2 text-sm leading-relaxed",
            bubbleShapeClass,
            isMine
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border/50 text-foreground",
            message.pending && "opacity-70",
            message.failed && "border-destructive/50 bg-destructive/5"
          )}
        >
          {/* Hover timestamp tooltip */}
          <div
            className={cn(
              "pointer-events-none absolute left-[calc(100%+8px)] top-1/2 z-10 -translate-y-1/2 whitespace-nowrap rounded-md border border-border/60 bg-background/95 px-2 py-0.5 text-[11px] text-muted-foreground opacity-0 shadow-soft transition-opacity group-hover/bubble:opacity-100"
            )}
          >
            <DateDisplay date={message.createdAt} format="time" className="text-[11px] text-muted-foreground" />
          </div>

          {/* Media content */}
          {message.type !== "text" && message.mediaUrl && (
            <MediaPreview message={message} />
          )}

          {/* Text content */}
          {message.content && (
            <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
          )}

          {/* Pending/failed indicator */}
          {message.pending && (
            <span className="text-xs opacity-60 mt-1 block text-right">Sending...</span>
          )}
          {message.failed && (
            <span className="text-xs text-destructive mt-1 block text-right">Failed</span>
          )}

          {isMine && !message.pending && !message.failed && showReadReceipt && (
            <div className="group mt-1 flex justify-end">
              <ReadReceipt
                readBy={message.readBy}
                participantCount={participantCount}
                conversationType={conversationType}
                currentUserId={user?.id}
                className="opacity-70"
              />
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div
        className={cn(
          "self-center transition-opacity",
          (showActions || dialogOpen) ? "opacity-100" : "opacity-0",
          isMine ? "order-first" : "order-last"
        )}
      >
        <MessageActions message={message} isMine={isMine} onDialogOpenChange={setDialogOpen} />
      </div>
    </div>
  );
}
