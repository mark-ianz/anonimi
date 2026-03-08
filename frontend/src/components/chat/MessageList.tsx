"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { useAuthStore } from "@/stores/authStore";
import type { Conversation } from "@/types/conversation";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import InfiniteScrollSentinel from "@/components/shared/InfiniteScroll";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import DateDisplay from "@/components/shared/DateDisplay";

interface MessageListProps {
  conversation: Conversation;
}

function shouldShowDateDivider(prev: string | undefined, curr: string): boolean {
  if (!prev) return true;
  const a = new Date(prev).toDateString();
  const b = new Date(curr).toDateString();
  return a !== b;
}

export default function MessageList({ conversation }: MessageListProps) {
  const { user } = useAuthStore();
  const { messages, isLoading, isFetchingMore, hasMore, fetchMore } = useMessages(conversation.id);
  const { typingUsers } = useTyping(conversation.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isFirstLoad = useRef(true);

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
    if (last.senderId === user?.id) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, user?.id]);

  // Participant lookup for group conversations
  const participantCount =
    conversation.type === "group"
      ? (conversation.group?.memberCount ?? 2)
      : 2;

  if (isLoading) {
    return <LoadingSkeleton variant="message" rows={8} className="flex-1" />;
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col">
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
        const showDivider = shouldShowDateDivider(prev?.createdAt, message.createdAt);
        const isFirst = !prev || prev.senderId !== message.senderId || showDivider;
        const showAvatar = isFirst;

        // Find sender info for group
        let senderName: string | undefined;
        let senderImage: string | null = null;

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
            <MessageBubble
              message={message}
              isFirst={isFirst}
              showAvatar={showAvatar}
              senderName={senderName}
              senderImage={senderImage}
              participantCount={participantCount}
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
