"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SmilePlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useAuthStore } from "@/stores/authStore";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { Message, ReactionEmoji } from "@/types/message";
import { REACTION_EMOJIS } from "@/types/message";
import { createPortal } from "react-dom";

interface MessageReactionPickerProps {
  message: Message;
  isMine: boolean;
  showOnHover?: boolean;
  hasReactions?: boolean;
  forceVisible?: boolean;
}

export default function MessageReactionPicker({
  message,
  isMine,
  showOnHover = false,
  hasReactions = false,
  forceVisible = false,
}: MessageReactionPickerProps) {
  const { user } = useAuthStore();
  const { addReaction } = useMessages(message.conversationId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const LONG_MESSAGE_THRESHOLD = 60;
  const isLongMessage = message.content && message.content.length > LONG_MESSAGE_THRESHOLD;

  const canReact = !message.unsent && !message.pending && !message.failed;

  const closePicker = useCallback(() => setPickerOpen(false), []);

  const handleEmojiSelect = (emoji: string) => {
    const existing = (message.reactions ?? []).find(
      (reaction) => reaction.userId === user?.id && reaction.emoji === emoji
    );
    if (existing) {
      addReaction({ messageId: message.id, emoji: emoji as ReactionEmoji });
      closePicker();
      return;
    }
    addReaction({ messageId: message.id, emoji: emoji as ReactionEmoji });
    closePicker();
  };

  useEffect(() => {
    if (!pickerOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        pickerRef.current &&
        !pickerRef.current.contains(target) &&
        !triggerRef.current?.contains(target)
      ) {
        closePicker();
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePicker();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [pickerOpen, closePicker]);

  if (!canReact) return null;

  const emojiButtons = (
    <>
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => handleEmojiSelect(emoji)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-lg hover:border-border/80 hover:bg-muted/40",
            "cursor-pointer",
            (message.reactions ?? []).some(
              (reaction) => reaction.userId === user?.id && reaction.emoji === emoji
            ) && "bg-muted/70"
          )}
        >
          {emoji}
        </button>
      ))}
    </>
  );

  const effectiveSide = isLongMessage
    ? (isMine ? "left" : "right")
    : (isMine ? "right" : "left");

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setPickerOpen((prev) => !prev)}
        className={cn(
          "cursor-pointer flex h-7 w-7 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:text-foreground",
          showOnHover && !hasReactions && !forceVisible
            ? "opacity-0 group-hover/message:opacity-100 md:group-hover/message:opacity-100"
            : "opacity-100"
        )}
      >
        <SmilePlus className="h-4 w-4" />
      </button>

      {pickerOpen &&
        isMobile &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-end justify-center pb-24 bg-black/20"
            onClick={closePicker}
          >
            <div
              ref={pickerRef}
              className="rounded-full border border-border/60 bg-card/95 px-2 py-1.5 shadow-elevated backdrop-blur-sm animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-1.5">{emojiButtons}</div>
            </div>
          </div>,
          document.body
        )}

      {pickerOpen && !isMobile && (
        <div
          ref={pickerRef}
          className={cn(
            "absolute z-20 bottom-full mb-2 rounded-full border border-border/60 bg-card/95 px-2 py-1 shadow-elevated backdrop-blur-sm",
            effectiveSide === "right" ? "right-0" : "left-0"
          )}
        >
          <div className="flex items-center gap-1.5">{emojiButtons}</div>
        </div>
      )}
    </div>
  );
}
