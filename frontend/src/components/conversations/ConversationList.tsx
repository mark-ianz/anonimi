"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useConversations } from "@/hooks/useConversations";
import ConversationItem from "./ConversationItem";
import LoadingSkeleton from "@/components/shared/LoadingSkeleton";
import EmptyState from "@/components/shared/EmptyState";
import InfiniteScrollSentinel from "@/components/shared/InfiniteScroll";
import api from "@/lib/api";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ConversationListProps {
  activeConversationId?: string;
  searchQuery?: string;
}

export default function ConversationList({
  activeConversationId,
  searchQuery = "",
}: ConversationListProps) {
  const { conversations, isLoading, isFetchingMore, hasMore, fetchMore } = useConversations();

  const { data: messageRequests } = useQuery({
    queryKey: ["message-requests"],
    queryFn: async () => {
      const res = await api.get("/conversations/requests");
      return res.data.data as unknown[];
    },
    staleTime: 1000 * 60,
  });
  const requestCount = messageRequests?.length ?? 0;

  const filtered = searchQuery
    ? conversations.filter((c) => {
        const name =
          c.type === "group"
            ? c.group?.name ?? ""
            : c.participant?.nickname ?? c.participant?.username ?? "";
        return name.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : conversations;

  const banner = requestCount > 0 && (
    <Link
      href="/message-requests"
      className="flex items-center justify-between px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 hover:bg-amber-500/15 transition-colors shrink-0"
    >
      <div className="flex items-center gap-2 text-sm font-medium text-amber-600 dark:text-amber-400">
        <Inbox className="w-4 h-4" />
        Message Requests
      </div>
      <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-amber-500 text-white text-[10px] font-semibold flex items-center justify-center">
        {requestCount}
      </span>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {banner}
        <LoadingSkeleton variant="conversation" rows={8} />
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {banner}
        <EmptyState
          variant={searchQuery ? "search" : "conversations"}
          description={
            searchQuery
              ? `No conversations matching "${searchQuery}"`
              : "Start a conversation with a contact."
          }
        />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      {banner}
      <ScrollArea className="h-full min-h-0 flex-1">
        <div className="pr-1">
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
      </ScrollArea>
    </div>
  );
}
