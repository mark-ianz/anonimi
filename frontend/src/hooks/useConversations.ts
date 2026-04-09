"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import api from "@/lib/api";
import { useChatStore } from "@/stores/chatStore";
import { usePresenceStore } from "@/stores/presenceStore";
import type { Conversation } from "@/types/conversation";
import type { OnlineStatus } from "@/types/user";
import { CONVERSATIONS_PER_PAGE } from "@/lib/constants";

export type ConversationListFilter = "active" | "archived";

export function useConversations(filter: ConversationListFilter = "active") {
  const { conversations, setConversations } = useChatStore();
  const { bulkSetPresence } = usePresenceStore();

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
    if (query.data) {
      const all = query.data.pages.flatMap((p) => p.data);
      setConversations(all);

      const presenceEntries = all.reduce<Record<string, { status: OnlineStatus; lastSeen: string | null }>>(
        (acc, conversation) => {
          const participant = conversation.participant;
          if (!participant?.id || conversation.type !== "private") return acc;
          acc[participant.id] = {
            status: participant.onlineStatus ?? "offline",
            lastSeen: null,
          };
          return acc;
        },
        {}
      );

      if (Object.keys(presenceEntries).length > 0) {
        bulkSetPresence(presenceEntries);
      }
    }
  }, [filter, query.data, setConversations, bulkSetPresence]);

  return {
    conversations: query.data?.pages.flatMap((p) => p.data) ?? conversations,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    fetchMore: query.fetchNextPage,
    refetch: query.refetch,
  };
}
