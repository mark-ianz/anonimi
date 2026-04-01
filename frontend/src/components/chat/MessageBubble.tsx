"use client";

import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import type { Message } from "@/types/message";
import DateDisplay from "@/components/shared/DateDisplay";
import MessageActions from "./MessageActions";
import ReadReceipt from "./ReadReceipt";
import MediaPreview from "./MediaPreview";
import UserAvatar from "@/components/shared/UserAvatar";
import MessageReactions from "./MessageReactions";
import MessageReactionPicker from "./MessageReactionPicker";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { MessageCircle, User } from "lucide-react";

interface MessageBubbleProps {
  message: Message;
  isFirst?: boolean;
  showAvatar?: boolean;
  senderName?: string;
  senderImage?: string | null;
  senderAnonimiId?: string;
  participantCount?: number;
  conversationType?: "private" | "group";
  readByUsersById?: Record<string, { name?: string; anonimiId?: string; profileImage?: string | null }>;
  showReadReceipt?: boolean;
  timestampBubblePosition?: "single" | "first" | "middle" | "last";
}

export default function MessageBubble({
  message,
  isFirst,
  showAvatar,
  senderName,
  senderImage,
  senderAnonimiId,
  participantCount = 2,
  conversationType = "private",
  readByUsersById,
  showReadReceipt = true,
  timestampBubblePosition = "single",
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const isMine = message.senderId === user?.id;
  const [showActions, setShowActions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [avatarMenuPosition, setAvatarMenuPosition] = useState({ top: 0, left: 0 });
  const avatarMenuRef = useRef<HTMLDivElement>(null);
  const avatarTriggerRef = useRef<HTMLButtonElement>(null);
  const canUsePortal = typeof document !== "undefined";
  const latestReadAt = (() => {
    const readers = (message.readBy ?? []).filter((readerId) => readerId !== user?.id);
    const readTimestamps = readers
      .map((readerId) => message.readByAt?.[readerId])
      .filter((value): value is string => Boolean(value));

    if (readTimestamps.length === 0) return null;

    return readTimestamps.sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    )[0];
  })();

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

  const updateAvatarMenuPosition = useCallback(() => {
    const trigger = avatarTriggerRef.current;
    if (!trigger) return;

    const triggerRect = trigger.getBoundingClientRect();
    const menuHeight = avatarMenuRef.current?.offsetHeight ?? 88;
    const menuWidth = 160;
    const gap = 8;

    const spaceBelow = window.innerHeight - triggerRect.bottom;
    const shouldOpenUp = spaceBelow < menuHeight + gap && triggerRect.top > menuHeight + gap;

    const top = shouldOpenUp
      ? Math.max(gap, triggerRect.top - menuHeight - gap)
      : Math.min(window.innerHeight - menuHeight - gap, triggerRect.bottom + gap);

    const left = Math.min(
      Math.max(gap, triggerRect.left),
      window.innerWidth - menuWidth - gap
    );

    setAvatarMenuPosition({ top, left });
  }, []);

  useEffect(() => {
    if (!avatarMenuOpen) return;

    updateAvatarMenuPosition();

    const rafId = window.requestAnimationFrame(() => {
      updateAvatarMenuPosition();
    });

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideMenu = avatarMenuRef.current?.contains(target);
      const clickedTrigger = avatarTriggerRef.current?.contains(target);
      if (!clickedInsideMenu && !clickedTrigger) {
        setAvatarMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setAvatarMenuOpen(false);
      }
    };

    const handleViewportChange = () => {
      updateAvatarMenuPosition();
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [avatarMenuOpen, updateAvatarMenuPosition]);

  async function handleSendMessage() {
    if (!senderAnonimiId) return;
    try {
      const res = await api.post("/conversations", { participantAnonimiId: senderAnonimiId });
      const conversationId = res.data?.data?.conversationId as string | undefined;
      if (!conversationId) {
        toast.error("Could not open conversation.");
        return;
      }
      setAvatarMenuOpen(false);
      router.push(`/chat/${conversationId}`);
    } catch {
      toast.error("Failed to open conversation.");
    }
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
        "group/message relative flex items-end gap-2 px-4 py-0.5 animate-message-appear hover:z-30",
        isMine && "flex-row-reverse"
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { if (!dialogOpen) setShowActions(false); }}
    >
      {/* Avatar */}
      <div className="w-8 shrink-0">
        {showAvatar && !isMine && (
          <>
            <button
              ref={avatarTriggerRef}
              type="button"
              onClick={() => {
                if (!senderAnonimiId) return;
                setAvatarMenuOpen((prev) => !prev);
              }}
              className={cn(
                "rounded-full",
                senderAnonimiId ? "cursor-pointer" : "cursor-default"
              )}
              aria-haspopup="menu"
              aria-expanded={avatarMenuOpen}
              aria-label="Sender actions"
            >
              <UserAvatar
                imageUrl={senderImage}
                name={senderName}
                alt={senderName ?? "Sender"}
                className="w-8 h-8"
                textClassName="text-xs"
              />
            </button>

            {canUsePortal && avatarMenuOpen && senderAnonimiId &&
              createPortal(
                <div
                  ref={avatarMenuRef}
                  className="fixed z-120 w-40 rounded-xl border border-border/60 bg-card/95 p-1 shadow-elevated backdrop-blur-sm animate-fade-in"
                  style={{ top: avatarMenuPosition.top, left: avatarMenuPosition.left }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarMenuOpen(false);
                      router.push(`/user/${senderAnonimiId}`);
                    }}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/70"
                  >
                    <User className="h-4 w-4" />
                    View profile
                  </button>

                  {conversationType === "group" && (
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted/70"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send message
                    </button>
                  )}
                </div>,
                document.body
              )}
          </>
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
        </div>

        {!message.unsent && (
          <MessageReactions
            message={message}
            isMine={isMine}
            conversationType={conversationType}
            userMetaById={readByUsersById}
          />
        )}

        {isMine && !message.pending && !message.failed && !message.unsent && showReadReceipt && (
          <div className="group mt-1 px-1 flex justify-end w-full">
            <ReadReceipt
              readBy={message.readBy}
              readAt={latestReadAt}
              readByAt={message.readByAt}
              participantCount={participantCount}
              conversationType={conversationType}
              currentUserId={user?.id}
              readByUsersById={readByUsersById}
              className="opacity-70"
            />
          </div>
        )}
      </div>

      {/* Side controls */}
      <div
        className={cn(
          "self-center flex items-center gap-1.5 transition-opacity",
          (showActions || dialogOpen) ? "opacity-100" : "opacity-0"
        )}
      >
        <MessageReactionPicker
          message={message}
          isMine={isMine}
          showOnHover
          hasReactions={(message.reactions ?? []).length > 0}
        />
        <MessageActions message={message} isMine={isMine} onDialogOpenChange={setDialogOpen} />
      </div>
    </div>
  );
}
