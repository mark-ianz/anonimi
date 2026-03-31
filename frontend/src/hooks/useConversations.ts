"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "@/lib/api";
import { useChatStore } from "@/stores/chatStore";
import type { Conversation } from "@/types/conversation";
import { CONVERSATIONS_PER_PAGE } from "@/lib/constants";

export type ConversationListFilter = "active" | "archived";

export function useConversations(filter: ConversationListFilter = "active") {
  const { setConversations, conversations } = useChatStore();

  const query = useInfiniteQuery({
    queryKey: ["conversations", filter],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = {
        limit: CONVERSATIONS_PER_PAGE,
        filter,
      };
      if (pageParam) params.cursor = pageParam as string;
      const res = await api.get("/conversations", { params });
      return res.data as {
        data: Conversation[];
        pagination?: { nextCursor: string | null; hasMore: boolean };
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasMore ? lastPage.pagination.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (query.data && filter === "active") {
      const all = query.data.pages.flatMap((p) => p.data);
      setConversations(all);
    }
  }, [filter, query.data, setConversations]);

  const resolvedConversations =
    filter === "active"
      ? conversations
      : query.data?.pages.flatMap((p) => p.data) ?? [];

  return {
    conversations: resolvedConversations,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    fetchMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}
