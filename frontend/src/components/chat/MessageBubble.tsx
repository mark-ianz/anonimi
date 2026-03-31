"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { Message } from "@/types/message";
import DateDisplay from "@/components/shared/DateDisplay";
import MessageActions from "./MessageActions";
import ReadReceipt from "./ReadReceipt";
import MediaPreview from "./MediaPreview";
import UserAvatar from "@/components/shared/UserAvatar";
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

  const tooltipPositionClass = isMine
    ? (message.unsent
      ? "right-[calc(100%+8px)] top-1/2 -translate-y-1/2"
      : "left-[calc(100%+8px)] top-1/2 -translate-y-1/2")
    : "left-[calc(100%+8px)] top-1/2 -translate-y-1/2";

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
        "relative flex items-end gap-2 px-4 py-0.5 animate-message-appear hover:z-30",
        isMine && "flex-row-reverse"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { if (!dialogOpen) setShowActions(false); }}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && !isMine && (
          <UserAvatar
            imageUrl={senderImage}
            name={senderName}
            alt={senderName ?? "Sender"}
            className="w-8 h-8"
            textClassName="text-xs"
          />
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
              "pointer-events-none absolute z-80 hidden whitespace-nowrap rounded-md border border-border/60 bg-background/95 px-2 py-0.5 text-[11px] text-muted-foreground shadow-soft group-hover/bubble:block",
              tooltipPositionClass
            )}
          >
            {message.unsent ? (
              <div className="space-y-0.5">
                <div>
                  <span className="text-muted-foreground/80">Sent: </span>
                  <DateDisplay date={message.createdAt} format="time" className="text-[11px] text-muted-foreground inline" />
                </div>
                <div>
                  <span className="text-muted-foreground/80">Unsent: </span>
                  <DateDisplay date={message.unsentAt ?? message.createdAt} format="time" className="text-[11px] text-muted-foreground inline" />
                </div>
              </div>
            ) : (
              <DateDisplay date={message.createdAt} format="time" className="text-[11px] text-muted-foreground" />
            )}
          </div>

          {/* Media content */}
          {!message.unsent && message.type !== "text" && message.mediaUrl && (
            <MediaPreview message={message} />
          )}

          {/* Text content */}
          {message.unsent ? (
            <p className="italic text-current">Message was unsent</p>
          ) : message.content ? (
            <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
          ) : null}

          {/* Pending/failed indicator */}
          {message.pending && (
            <span className="text-xs opacity-60 mt-1 block text-right">Sending...</span>
          )}
          {message.failed && (
            <span className="text-xs text-destructive mt-1 block text-right">Failed</span>
          )}

          {isMine && !message.pending && !message.failed && !message.unsent && showReadReceipt && (
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
