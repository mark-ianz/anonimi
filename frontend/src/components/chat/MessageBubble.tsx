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
}

export default function MessageBubble({
  message,
  isFirst,
  showAvatar,
  senderName,
  senderImage,
  participantCount = 2,
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const isMine = message.senderId === user?.id;
  const [showActions, setShowActions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
        "flex items-end gap-2 px-4 py-0.5 group animate-message-appear",
        isMine && "flex-row-reverse"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { if (!dialogOpen) setShowActions(false); }}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && !isMine && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
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
            "relative px-3 py-2 rounded-2xl text-sm leading-relaxed",
            isMine
              ? "bg-primary text-primary-foreground rounded-br-sm"
              : "bg-card border border-border/50 text-foreground rounded-bl-sm",
            message.pending && "opacity-70",
            message.failed && "border-destructive/50 bg-destructive/5"
          )}
        >
          {/* Media content */}
          {message.type !== "text" && message.mediaUrl && (
            <MediaPreview message={message} />
          )}

          {/* Text content */}
          {message.content && (
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
          )}

          {/* Pending/failed indicator */}
          {message.pending && (
            <span className="text-xs opacity-60 mt-1 block text-right">Sending...</span>
          )}
          {message.failed && (
            <span className="text-xs text-destructive mt-1 block text-right">Failed</span>
          )}
        </div>

        {/* Footer: time + read receipt */}
        <div className={cn("flex items-center gap-1.5 mt-0.5 mx-1", isMine && "flex-row-reverse")}>
          <DateDisplay date={message.createdAt} format="time" />
          {isMine && (
            <ReadReceipt
              readBy={message.readBy}
              participantCount={participantCount}
            />
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
