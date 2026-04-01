"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { getChatSocket } from "@/lib/socket";
import api from "@/lib/api";
import type { Conversation } from "@/types/conversation";
import type { GroupMember } from "@/types/group";
import type { Message } from "@/types/message";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import InfiniteScrollSentinel from "@/components/shared/InfiniteScroll";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import DateDisplay from "@/components/shared/DateDisplay";
import { ScrollArea } from "@/components/ui/scroll-area";

type TimestampBubblePosition = "single" | "first" | "middle" | "last";

interface MessageListProps {
  conversation: Conversation;
  onEditStart?: (message: Message) => void;
}

function shouldShowDateDivider(prev: string | undefined, curr: string): boolean {
  if (!prev) return true;
  const a = new Date(prev).toDateString();
  const b = new Date(curr).toDateString();
  return a !== b;
}

function shouldShowTimeDivider(prev: string | undefined, curr: string): boolean {
  if (!prev) return true;
  const prevDate = new Date(prev);
  const currDate = new Date(curr);
  if (prevDate.toDateString() !== currDate.toDateString()) return true;

  const diffMs = Math.abs(currDate.getTime() - prevDate.getTime());
  return diffMs >= 15 * 60 * 1000;
}

function getTimeBucketKey(value: string): number {
  const time = new Date(value).getTime();
  return Math.floor(time / (15 * 60 * 1000));
}

export default function MessageList({ conversation, onEditStart }: MessageListProps) {
  const { user } = useAuthStore();
  const { clearUnread } = useChatStore();
  const { messages, isLoading, isFetchingMore, hasMore, fetchMore } = useMessages(conversation.id);
  const { typingUsers } = useTyping(conversation.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();
  const targetMessageId = searchParams.get("messageId");
  const isFirstLoad = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const emittedReadIdsRef = useRef<Set<string>>(new Set());
  const [canMarkRead, setCanMarkRead] = useState(true);
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null);
  const scrollTargetHandledRef = useRef<string | null>(null);
  const groupId = conversation.type === "group" ? conversation.group?.id ?? null : null;

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["groups", groupId, "members"],
    queryFn: async () => {
      const res = await api.get(`/groups/${groupId}/members`);
      return res.data.data as GroupMember[];
    },
    enabled: !!groupId,
    staleTime: 1000 * 30,
  });

  const groupMemberMetaById = useMemo(() => {
    const map: Record<string, { name: string; anonimiId: string; profileImage: string | null }> = {};
    groupMembers.forEach((member) => {
      map[member.userId] = {
        name: member.nickname?.trim() || member.username,
        anonimiId: member.anonimiId,
        profileImage: member.profileImage ?? null,
      };
    });
    return map;
  }, [groupMembers]);

  const reactionUserMetaById = useMemo(() => {
    const map: Record<string, { name?: string; profileImage?: string | null; anonimiId?: string }> = {};

    if (user?.id) {
      map[user.id] = {
        name: user.username ?? user.anonimiId ?? "You",
        profileImage: user.profileImage ?? null,
        anonimiId: user.anonimiId,
      };
    }

    if (conversation.type === "private" && conversation.participant) {
      map[conversation.participant.id] = {
        name: conversation.participant.nickname ?? conversation.participant.username,
        profileImage: conversation.participant.profileImage ?? null,
        anonimiId: conversation.participant.anonimiId,
      };
    }

    if (conversation.type === "group") {
      Object.entries(groupMemberMetaById).forEach(([userId, meta]) => {
        map[userId] = {
          name: meta.name,
          profileImage: meta.profileImage ?? null,
          anonimiId: meta.anonimiId,
        };
      });
    }

    return map;
  }, [user?.id, user?.username, user?.anonimiId, user?.profileImage, conversation, groupMemberMetaById]);

  const displayTypingUsers = useMemo(() => {
    const filtered = typingUsers.filter((typingUser) => typingUser.userId !== user?.id);
    const sorted = [...filtered].sort(
      (a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0)
    );

    return sorted.map((typingUser) => {
      let name = typingUser.username;

      if (conversation.type === "private" && typingUser.userId === conversation.participant?.id) {
        name = conversation.participant.nickname ?? conversation.participant.username ?? name;
      } else if (conversation.type === "group") {
        const meta = groupMemberMetaById[typingUser.userId];
        name = meta?.name ?? name;
      }

      return {
        userId: typingUser.userId,
        username: name?.trim() || "User",
      };
    });
  }, [typingUsers, user?.id, conversation, groupMemberMetaById]);

  useEffect(() => {
    const computeCanMarkRead = () =>
      typeof document !== "undefined" &&
      document.visibilityState === "visible" &&
      document.hasFocus();

    const syncCanMarkRead = () => {
      setCanMarkRead(computeCanMarkRead());
    };

    syncCanMarkRead();
    window.addEventListener("focus", syncCanMarkRead);
    window.addEventListener("blur", syncCanMarkRead);
    document.addEventListener("visibilitychange", syncCanMarkRead);

    return () => {
      window.removeEventListener("focus", syncCanMarkRead);
      window.removeEventListener("blur", syncCanMarkRead);
      document.removeEventListener("visibilitychange", syncCanMarkRead);
    };
  }, []);

  useEffect(() => {
    emittedReadIdsRef.current.clear();
  }, [conversation.id]);

  useEffect(() => {
    setHighlightMessageId(null);
    scrollTargetHandledRef.current = null;
  }, [conversation.id, targetMessageId]);

  // Scroll to bottom on first load and when new messages arrive from me
  useEffect(() => {
    if (!isLoading && isFirstLoad.current && !targetMessageId) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
    }
  }, [isLoading, targetMessageId]);

  useEffect(() => {
    if (!messages.length) return;
    const last = messages[messages.length - 1];
    const newestChanged = lastMessageIdRef.current !== last.id;
    lastMessageIdRef.current = last.id;

    // Older history pages are prepended and should never pull viewport to bottom.
    if (!isFetchingMore && newestChanged && last.senderId === user?.id) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, user?.id, isFetchingMore]);

  useEffect(() => {
    if (!targetMessageId) return;

    const targetMessage = messages.find((message) => message.id === targetMessageId);
    if (targetMessage) {
      if (scrollTargetHandledRef.current === targetMessageId) return;

      scrollTargetHandledRef.current = targetMessageId;
      setHighlightMessageId(targetMessageId);

      const rafId = window.requestAnimationFrame(() => {
        const node = document.getElementById(`message-${targetMessageId}`);
        node?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      const timeoutId = window.setTimeout(() => {
        setHighlightMessageId((current) =>
          current === targetMessageId ? null : current
        );
      }, 4000);

      return () => {
        window.cancelAnimationFrame(rafId);
        window.clearTimeout(timeoutId);
      };
    }

    if (hasMore && !isFetchingMore) {
      fetchMore();
    }
  }, [
    targetMessageId,
    messages,
    hasMore,
    isFetchingMore,
    fetchMore,
  ]);

  // When opening a conversation, immediately mark all unread incoming messages as read.
  useEffect(() => {
    if (!user?.id || !messages.length || !canMarkRead) return;

    // As soon as this visible, focused tab is viewing the conversation,
    // clear its local unread badge in the left conversation list.
    clearUnread(conversation.id);

    const unreadIncomingIds = messages
      .filter((message) => {
        if (message.senderId === user.id) return false;
        if (message.unsent) return false;
        if (message.readBy.includes(user.id)) return false;
        return !emittedReadIdsRef.current.has(message.id);
      })
      .map((message) => message.id);

    if (!unreadIncomingIds.length) return;

    unreadIncomingIds.forEach((id) => emittedReadIdsRef.current.add(id));

    const socket = getChatSocket();
    socket.emit("message:read", {
      conversationId: conversation.id,
      messageIds: unreadIncomingIds,
    });
  }, [messages, conversation.id, user?.id, canMarkRead, clearUnread]);

  // Participant lookup for group conversations
  const participantCount =
    conversation.type === "group"
      ? (conversation.group?.memberCount ?? 2)
      : 2;

  const latestReadOutgoingIndex = messages.reduce((latest, msg, idx) => {
    if (msg.senderId !== user?.id) return latest;
    if (msg.pending || msg.failed || msg.unsent) return latest;
    const isReadByOther = (msg.readBy ?? []).some((readerId) => readerId !== user?.id);
    if (!isReadByOther) return latest;
    return idx;
  }, -1);

  const latestSentOutgoingIndex = messages.reduce((latest, msg, idx) => {
    if (msg.senderId !== user?.id) return latest;
    if (msg.pending || msg.failed || msg.unsent) return latest;
    const isReadByOther = (msg.readBy ?? []).some((readerId) => readerId !== user?.id);
    if (isReadByOther) return latest;
    // If we already have a newer read anchor, avoid showing an older unread "Sent"
    // marker that can reveal hidden delivery windows (e.g. block period messages).
    if (latestReadOutgoingIndex >= 0 && idx <= latestReadOutgoingIndex) return latest;
    return idx;
  }, -1);

  if (isLoading) {
    return <LoadingSkeleton variant="message" rows={8} className="flex-1" />;
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="flex min-h-full flex-col overflow-x-visible pr-1">
        {/* Load more sentinel at top */}
        <InfiniteScrollSentinel
          onLoadMore={() => fetchMore()}
          hasMore={hasMore ?? false}
          isLoading={isFetchingMore}
          className="pt-2"
        />

        <div className="flex-1" />

        {/* Messages */}
        {messages.map((message, index) => {
        const prev = messages[index - 1];
        const next = messages[index + 1];
        const showDivider = shouldShowDateDivider(prev?.createdAt, message.createdAt);
        const showTimeCluster = shouldShowTimeDivider(prev?.createdAt, message.createdAt);
        const isFirst = !prev || prev.senderId !== message.senderId || showDivider;
        const bucketKey = getTimeBucketKey(message.createdAt);

        const sameTimestampSenderAsPrev =
          !!prev &&
          prev.senderId === message.senderId &&
          getTimeBucketKey(prev.createdAt) === bucketKey;

        const sameTimestampSenderAsNext =
          !!next &&
          next.senderId === message.senderId &&
          getTimeBucketKey(next.createdAt) === bucketKey;

        const showAvatar = !sameTimestampSenderAsNext;

        let timestampBubblePosition: TimestampBubblePosition = "single";
        if (!sameTimestampSenderAsPrev && sameTimestampSenderAsNext) {
          timestampBubblePosition = "first";
        } else if (sameTimestampSenderAsPrev && sameTimestampSenderAsNext) {
          timestampBubblePosition = "middle";
        } else if (sameTimestampSenderAsPrev && !sameTimestampSenderAsNext) {
          timestampBubblePosition = "last";
        }

          let showReadReceipt = true;
          if (message.senderId === user?.id) {
            if (conversation.type === "private") {
              // Private chat: show at most two status markers:
              // 1) latest message read by the other person
              // 2) latest message sent but not yet read
              showReadReceipt =
                index === latestReadOutgoingIndex ||
                index === latestSentOutgoingIndex;
            } else {
              let nextMineIndex = -1;
              for (let i = index + 1; i < messages.length; i += 1) {
                const candidate = messages[i];
                if (candidate.senderId !== user?.id) continue;
                if (getTimeBucketKey(candidate.createdAt) !== bucketKey) continue;
                nextMineIndex = i;
                break;
              }

              if (nextMineIndex !== -1) {
                // Group chat: one status per 15-minute timestamp cluster.
                showReadReceipt = false;
              }
            }
          }

          // Resolve sender info for group messages.
          let senderName: string | undefined;
          let senderImage: string | null = null;
          let senderAnonimiId: string | undefined;

          if (conversation.type === "group") {
            if (message.senderId !== user?.id) {
              const senderMeta = groupMemberMetaById[message.senderId];
              senderName = senderMeta?.name ?? "User";
              senderImage = senderMeta?.profileImage ?? null;
              senderAnonimiId = senderMeta?.anonimiId;
            }
          } else if (conversation.type === "private" && message.senderId !== user?.id) {
            senderName = conversation.participant?.nickname ?? conversation.participant?.username ?? "User";
            senderImage = conversation.participant?.profileImage ?? null;
            senderAnonimiId = conversation.participant?.anonimiId;
          }

          return (
            <div key={message.id} id={`message-${message.id}`}>
              {showDivider && (
                <div className="flex items-center justify-center py-3">
                  <div className="px-3 py-1 rounded-full bg-muted/60 text-xs text-muted-foreground">
                    <DateDisplay date={message.createdAt} format="date" className="text-xs text-muted-foreground" />
                  </div>
                </div>
              )}

              {showTimeCluster && (
                <div className="flex items-center justify-center py-1.5">
                  <div className="rounded-full border border-border/50 bg-background/75 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    <DateDisplay date={message.createdAt} format="time" className="text-[11px] text-muted-foreground" />
                  </div>
                </div>
              )}

              <MessageBubble
                message={message}
                isFirst={isFirst}
                showAvatar={showAvatar}
                senderName={senderName}
                senderImage={senderImage}
                senderAnonimiId={senderAnonimiId}
                participantCount={participantCount}
                conversationType={conversation.type}
                readByUsersById={reactionUserMetaById}
                showReadReceipt={showReadReceipt}
                timestampBubblePosition={timestampBubblePosition}
                isHighlighted={highlightMessageId === message.id}
                onEditStart={onEditStart}
              />
            </div>
          );
        })}

        {/* Typing indicator */}
        <TypingIndicator users={displayTypingUsers} />

        <div ref={bottomRef} className="h-1" />
      </div>
    </ScrollArea>
  );
}
