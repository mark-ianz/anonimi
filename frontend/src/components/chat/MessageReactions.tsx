"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useMessages } from "@/hooks/useMessages";
import type { Message, MessageReaction, ReactionEmoji } from "@/types/message";
import DateDisplay from "@/components/shared/DateDisplay";
import UserAvatar from "@/components/shared/UserAvatar";

interface MessageReactionsProps {
  message: Message;
  userMetaById?: Record<string, { name?: string; profileImage?: string | null; anonimiId?: string }>;
  isMine: boolean;
  conversationType?: "private" | "group";
}

interface ReactionGroup {
  emoji: ReactionEmoji;
  reactions: MessageReaction[];
}

export default function MessageReactions({ message, userMetaById, isMine, conversationType }: MessageReactionsProps) {
  const { user } = useAuthStore();
  const { addReaction, removeReaction } = useMessages(message.conversationId);
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | ReactionEmoji>("all");
  const canUsePortal = typeof document !== "undefined";

  const reactions = message.reactions ?? [];

  const grouped = useMemo(() => {
    const map = new Map<ReactionEmoji, MessageReaction[]>();
    reactions.forEach((reaction) => {
      const list = map.get(reaction.emoji as ReactionEmoji) ?? [];
      list.push(reaction);
      map.set(reaction.emoji as ReactionEmoji, list);
    });
    return Array.from(map.entries()).map(([emoji, list]) => ({
      emoji,
      reactions: list,
    }));
  }, [reactions]);

  const showReactions = reactions.length > 0;
  const canToggle = !message.unsent && !message.pending && !message.failed;

  const openModal = (tab: "all" | ReactionEmoji) => {
    setActiveTab(tab);
    setModalOpen(true);
  };

  const resolveName = (userId: string) => {
    if (userId === user?.id) return "You";
    return userMetaById?.[userId]?.name ?? "Member";
  };

  const resolveAnonimiId = (userId: string) => userMetaById?.[userId]?.anonimiId;

  if (!showReactions) {
    return null;
  }

  return (
    <div className={cn("mt-2 flex flex-wrap items-center gap-2", isMine && "justify-end")}>
      <div className="flex flex-wrap items-center gap-1.5">
        {grouped.map((group) => {
          const myReaction = group.reactions.find(
            (reaction) => reaction.userId === user?.id
          );
          const isActive = !!myReaction;

          return (
            <button
              key={group.emoji}
              type="button"
              onClick={() => {
                if (!canToggle) return;
                if (myReaction) {
                  removeReaction({ messageId: message.id, reactionId: myReaction.id });
                  return;
                }
                addReaction({ messageId: message.id, emoji: group.emoji });
              }}
              className={cn(
                "flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-2.5 py-1 text-xs text-foreground shadow-sm hover:border-border cursor-pointer",
                isActive && "border-foreground/50 bg-foreground/10"
              )}
            >
              <span className="text-sm leading-none">{group.emoji}</span>
              <span className="text-[11px] font-semibold">{group.reactions.length}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => openModal("all")}
          className="rounded-full border border-transparent px-1.5 text-[11px] text-muted-foreground hover:text-foreground"
        >
          View all
        </button>
      </div>

      {canUsePortal && modalOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/40 p-4 py-8 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <div
              className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-4 shadow-elevated max-h-[85vh] overflow-hidden"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Reactions</h3>
                  <p className="text-xs text-muted-foreground">
                    {reactions.length} total
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted/60 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs cursor-pointer",
                    activeTab === "all"
                      ? "border-foreground bg-foreground text-background"
                      : "border-border/60 text-muted-foreground"
                  )}
                >
                  All
                </button>
                {grouped.map((group) => (
                  <button
                    key={group.emoji}
                    type="button"
                    onClick={() => setActiveTab(group.emoji)}
                    className={cn(
                      "flex items-center gap-1 rounded-full border px-3 py-1 text-xs cursor-pointer",
                      activeTab === group.emoji
                        ? "border-foreground bg-foreground text-background"
                        : "border-border/60 text-muted-foreground"
                    )}
                  >
                    <span>{group.emoji}</span>
                    <span>{group.reactions.length}</span>
                  </button>
                ))}
              </div>

              <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
                {(activeTab === "all"
                  ? reactions
                  : grouped.find((group) => group.emoji === activeTab)?.reactions ?? [])
                  .slice()
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((reaction) => {
                    const isCurrentUser = reaction.userId === user?.id;
                    const displayName = resolveName(reaction.userId);
                    const profileImage = userMetaById?.[reaction.userId]?.profileImage ?? null;
                    const targetAnonimiId = resolveAnonimiId(reaction.userId);
                    const canLinkProfile = !!targetAnonimiId && !isCurrentUser;

                    return (
                      <div
                        key={reaction.id}
                        className={cn(
                          "flex items-center gap-3 rounded-xl border border-border/40 bg-background/70 p-2",
                          isCurrentUser && "border-foreground/40 bg-foreground/5"
                        )}
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted/60 text-lg">
                          {reaction.emoji}
                        </div>
                        {canLinkProfile ? (
                          <Link href={`/user/${targetAnonimiId}`}>
                            <UserAvatar
                              imageUrl={profileImage}
                              name={displayName}
                              alt={displayName}
                              className="h-8 w-8"
                              textClassName="text-xs"
                            />
                          </Link>
                        ) : (
                          <UserAvatar
                            imageUrl={profileImage}
                            name={displayName}
                            alt={displayName}
                            className="h-8 w-8"
                            textClassName="text-xs"
                          />
                        )}
                        <div className="flex-1">
                          {canLinkProfile ? (
                            <Link
                              href={`/user/${targetAnonimiId}`}
                              className="text-sm font-medium"
                            >
                              {displayName}
                            </Link>
                          ) : (
                            <div className="text-sm font-medium">
                              {displayName}
                            </div>
                          )}
                          <DateDisplay
                            date={reaction.createdAt}
                            format="time"
                            className="mt-0.5 block text-[11px] text-muted-foreground"
                          />
                        </div>
                        {isCurrentUser && (
                          <button
                            type="button"
                            onClick={() => removeReaction({ messageId: message.id, reactionId: reaction.id })}
                            className="rounded-full px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
