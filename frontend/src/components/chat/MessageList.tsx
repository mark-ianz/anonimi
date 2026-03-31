"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { useAuthStore } from "@/stores/authStore";
import { getChatSocket } from "@/lib/socket";
import type { Conversation } from "@/types/conversation";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import InfiniteScrollSentinel from "@/components/shared/InfiniteScroll";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import DateDisplay from "@/components/shared/DateDisplay";

type TimestampBubblePosition = "single" | "first" | "middle" | "last";

interface MessageListProps {
  conversation: Conversation;
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

export default function MessageList({ conversation }: MessageListProps) {
  const { user } = useAuthStore();
  const { messages, isLoading, isFetchingMore, hasMore, fetchMore } = useMessages(conversation.id);
  const { typingUsers } = useTyping(conversation.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);
  const lastMessageIdRef = useRef<string | null>(null);
  const emittedReadIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    emittedReadIdsRef.current.clear();
  }, [conversation.id]);

  // Scroll to bottom on first load and when new messages arrive from me
  useEffect(() => {
    if (!isLoading && isFirstLoad.current) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
      isFirstLoad.current = false;
    }
  }, [isLoading]);

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

  // When opening a conversation, immediately mark all unread incoming messages as read.
  useEffect(() => {
    if (!user?.id || !messages.length) return;

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
  }, [messages, conversation.id, user?.id]);

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
    return idx;
  }, -1);

  if (isLoading) {
    return <LoadingSkeleton variant="message" rows={8} className="flex-1" />;
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-visible flex flex-col">
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

        // Find sender info for group
        let senderName: string | undefined;
        const senderImage: string | null = null;

        if (conversation.type === "group") {
          // We don't have individual member info here; show senderId shortened
          senderName = message.senderId === user?.id ? undefined : `User`;
        }

        return (
          <div key={message.id}>
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
              participantCount={participantCount}
              conversationType={conversation.type}
              showReadReceipt={showReadReceipt}
              timestampBubblePosition={timestampBubblePosition}
            />
          </div>
        );
      })}

      {/* Typing indicator */}
      <TypingIndicator users={typingUsers} />

      <div ref={bottomRef} className="h-1" />
    </div>
  );
}
