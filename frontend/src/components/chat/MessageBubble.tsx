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
import { EyeOff, MessageCircle, Pencil, User, X } from "lucide-react";

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
  isHighlighted?: boolean;
  onEditStart?: (message: Message) => void;
  onReply?: (message: Message) => void;
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
  isHighlighted = false,
  onEditStart,
  onReply,
}: MessageBubbleProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const isMine = message.senderId === user?.id;
  const isStealth = !!message.isStealth;
  const [now, setNow] = useState(() => Date.now());
  const [showActions, setShowActions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
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

  const canEdit =
    isMine &&
    !message.unsent &&
    !message.pending &&
    !message.failed &&
    !isStealth &&
    message.type === "text" &&
    (Date.now() - new Date(message.createdAt).getTime()) / (1000 * 60 * 60) <= 24;

  const isEdited = Boolean(message.editedAt || (message.editHistory?.length ?? 0) > 0);

  const stealthExpiresAt = message.stealthExpiresAt ? new Date(message.stealthExpiresAt).getTime() : null;
  const stealthExpired =
    isStealth &&
    (!!message.stealthExpiredAt || (stealthExpiresAt ? stealthExpiresAt <= now : true));
  const remainingMs = stealthExpiresAt ? Math.max(stealthExpiresAt - now, 0) : 0;
  const stealthPlaceholderLength = Math.max(
    3,
    Math.min(message.stealthContentLength ?? 0, 240)
  );

  const replyPreview = message.replyPreview;
  const replySenderLabel = replyPreview
    ? (replyPreview.senderId && replyPreview.senderId === user?.id
      ? "You"
      : replyPreview.senderUsername ?? "Member")
    : null;

  const replyPreviewText = (() => {
    if (!replyPreview) return null;
    if (replyPreview.content) return replyPreview.content;
    if (replyPreview.type === "image") return "Photo";
    if (replyPreview.type === "video") return "Video";
    if (replyPreview.type === "audio") return "Audio";
    if (replyPreview.type === "file") return replyPreview.fileName ?? "File";
    return "Message";
  })();

  const formatRemaining = (ms: number) => {
    const totalSeconds = Math.max(Math.floor(ms / 1000), 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };


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
    ? "right-[calc(100%+8px)] top-1/2 -translate-y-1/2"
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
    if (!isStealth || stealthExpired || !stealthExpiresAt) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isStealth, stealthExpired, stealthExpiresAt]);

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
    <>
      <div
        className={cn(
          "group/message relative my-1 flex items-end gap-2 px-4 py-0.5 animate-message-appear hover:z-30",
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

        {isEdited && (
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className={cn(
              "mb-1 flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors",
              isMine ? "self-end" : "self-start"
            )}
          >
            <Pencil className="h-3 w-3" />
            Edited
          </button>
        )}

        {isStealth && !stealthExpired && (
          <div
            className={cn(
              "mb-1 flex items-center gap-1 text-[11px] font-medium text-amber-700/70 dark:text-amber-200/70",
              isMine ? "self-end" : "self-start"
            )}
          >
            <EyeOff className="h-3 w-3" />
            {formatRemaining(remainingMs)}
          </div>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "group/bubble relative px-3 py-2 text-sm leading-relaxed transition-colors duration-700",
            bubbleShapeClass,
            isStealth
              ? (stealthExpired
                ? "bg-amber-50/40 border border-amber-200/40 text-foreground dark:bg-amber-400/5 dark:border-amber-300/20"
                : "bg-amber-50/70 border border-amber-200/50 text-foreground dark:bg-amber-400/10 dark:border-amber-300/30")
              : isMine
              ? "bg-primary text-primary-foreground"
              : "bg-card border border-border/50 text-foreground",
            message.pending && "opacity-70",
            message.failed && "border-destructive/50 bg-destructive/5",
            isHighlighted &&
              "ring-2 ring-primary/80 ring-offset-2 ring-offset-background shadow-[0_0_0_4px_rgba(47,87,131,0.22)] animate-message-highlight transition-shadow duration-700",
            isHighlighted && !isMine &&
              "bg-amber-200/90 border-amber-300/80 text-foreground dark:bg-amber-400/20 dark:border-amber-300/50",
            isHighlighted && isMine &&
              "bg-sky-600 text-white border-sky-300/60"
          )}
        >
          {replyPreview && !message.unsent && (
            <div
              className={cn(
                "mb-2 rounded-lg border border-border/60 bg-background/60 px-2.5 py-1.5",
                isMine && "bg-primary-foreground/10 border-primary-foreground/20"
              )}
            >
              <p className="text-[11px] font-semibold text-muted-foreground">
                Replying to {replySenderLabel}
              </p>
              {replyPreviewText && (
                <p className="text-xs text-foreground line-clamp-1">
                  {replyPreviewText}
                </p>
              )}
            </div>
          )}
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
          ) : isStealth && stealthExpired ? (
            <p className="whitespace-pre-wrap wrap-break-word text-transparent select-none">
              {"█".repeat(stealthPlaceholderLength)}
            </p>
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
        <MessageActions
          message={message}
          isMine={isMine}
          onDialogOpenChange={setDialogOpen}
          canEdit={canEdit}
          onEdit={() => onEditStart?.(message)}
          onReply={() => onReply?.(message)}
        />
      </div>
    </div>

    {historyOpen && typeof document !== "undefined" && createPortal(
      <div
        className="fixed inset-0 z-120 flex items-center justify-center p-4"
        onClick={() => setHistoryOpen(false)}
      >
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-md rounded-2xl border border-border/70 bg-card p-5 shadow-elevated"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Edit history</h3>
              <p className="text-xs text-muted-foreground">
                {message.editHistory?.length ?? 0} previous version(s)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setHistoryOpen(false)}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted/60"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {(message.editHistory ?? [])
              .slice()
              .sort((a, b) => new Date(b.editedAt).getTime() - new Date(a.editedAt).getTime())
              .map((entry, index) => {
                const isEditor = entry.editedBy === user?.id;
                const editorName = isEditor
                  ? "You"
                  : readByUsersById?.[entry.editedBy]?.name ?? "User";

                return (
                  <div
                    key={`${entry.editedAt}-${index}`}
                    className="rounded-xl border border-border/50 bg-background/70 p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {editorName}
                      </span>
                      <DateDisplay
                        date={entry.editedAt}
                        format="time"
                        className="text-[11px] text-muted-foreground"
                      />
                    </div>
                    <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-foreground">
                      {entry.content}
                    </p>
                  </div>
                );
              })}
            {!message.editHistory?.length && (
              <div className="rounded-xl border border-border/50 bg-background/70 p-3 text-sm text-muted-foreground">
                No previous versions available.
              </div>
            )}
          </div>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
