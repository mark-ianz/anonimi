"use client";

import { useState, useCallback } from "react";
import { useConversations } from "@/hooks/useConversations";
import ConversationItem from "./ConversationItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import InfiniteScrollSentinel from "@/components/shared/InfiniteScroll";

interface ConversationListProps {
  activeConversationId?: string;
  searchQuery?: string;
}

export default function ConversationList({
  activeConversationId,
  searchQuery = "",
}: ConversationListProps) {
  const { conversations, isLoading, isFetchingMore, hasMore, fetchMore } = useConversations();

  const filtered = searchQuery
    ? conversations.filter((c) => {
        const name =
          c.type === "group"
            ? c.group?.name ?? ""
            : c.participant?.nickname ?? c.participant?.username ?? "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  if (isLoading) {
    return <LoadingSkeleton variant="conversation" rows={8} />;
  }

  if (!isLoading && filtered.length === 0) {
    return (
      <EmptyState
        variant={searchQuery ? "search" : "conversations"}
        description={
          searchQuery
            ? `No conversations matching "${searchQuery}"`
            : "Start a conversation with a contact."
        }
      />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {filtered.map((conv, i) => (
        <ConversationItem
          key={conv.id}
          conversation={conv}
          isActive={conv.id === activeConversationId}
          style={{ animationDelay: `${i * 30}ms` }}
        />
      ))}
      <InfiniteScrollSentinel
        onLoadMore={() => fetchMore()}
        hasMore={hasMore ?? false}
        isLoading={isFetchingMore}
      />
    </div>
  );
}
