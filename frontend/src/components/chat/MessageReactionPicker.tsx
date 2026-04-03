"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SmilePlus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMessages } from "@/hooks/useMessages";
import { useAuthStore } from "@/stores/authStore";
import type { Message, ReactionEmoji } from "@/types/message";
import { REACTION_EMOJIS } from "@/types/message";

interface MessageReactionPickerProps {
  message: Message;
  isMine: boolean;
  showOnHover?: boolean;
  hasReactions?: boolean;
}

export default function MessageReactionPicker({
  message,
  isMine,
  showOnHover = false,
  hasReactions = false,
}: MessageReactionPickerProps) {
  const { user } = useAuthStore();
  const { addReaction } = useMessages(message.conversationId);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const canReact = !message.unsent && !message.pending && !message.failed;

  const closePicker = useCallback(() => setPickerOpen(false), []);

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

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setPickerOpen((prev) => !prev)}
        className={cn(
          "cursor-pointer flex h-7 w-7 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition hover:text-foreground",
          showOnHover && !hasReactions ? "opacity-0 group-hover/message:opacity-100" : "opacity-100"
        )}
      >
        <SmilePlus className="h-4 w-4" />
      </button>

      {pickerOpen && (
        <div
          ref={pickerRef}
          className={cn(
            "absolute z-20 bottom-full mb-2 rounded-full border border-border/60 bg-card/95 px-2 py-1 shadow-elevated backdrop-blur-sm",
            isMine ? "right-0" : "left-0"
          )}
        >
          <div className="flex items-center gap-1.5">
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
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
                }}
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-lg hover:border-border/80 hover:bg-muted/40",
                  (message.reactions ?? []).some(
                    (reaction) => reaction.userId === user?.id && reaction.emoji === emoji
                  ) && "bg-muted/70"
                )}
              >
                {emoji}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
