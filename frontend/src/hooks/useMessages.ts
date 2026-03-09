"use client";

import { useCallback } from "react";
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import api from "@/lib/api";
import { getChatSocket } from "@/lib/socket";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import type { Message, SendMessagePayload } from "@/types/message";
import { MESSAGES_PER_PAGE } from "@/lib/constants";

export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const { addMessage, replaceTempMessage } = useChatStore();

  const query = useInfiniteQuery({
    queryKey: ["messages", conversationId],
    queryFn: async ({ pageParam }) => {
      const params: Record<string, string | number> = {
        conversationId: conversationId!,
        limit: MESSAGES_PER_PAGE,
      };
      if (pageParam) params.cursor = pageParam as string;
      const res = await api.get("/messages", { params });
      return res.data as {
        data: Message[];
        pagination?: { nextCursor: string | null; hasMore: boolean };
      };
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination?.hasMore ? lastPage.pagination.nextCursor : undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!conversationId,
    staleTime: 1000 * 60,
  });

  // Flatten pages — API returns newest-first, display oldest-first
  const messages =
    query.data?.pages
      .flatMap((p) => p.data)
      .reverse() ?? [];

  const sendMessage = useCallback(
    (payload: Omit<SendMessagePayload, "tempId">) => {
      if (!user) return;
      const tempId = uuidv4();
      const optimistic: Message = {
        id: tempId,
        conversationId: payload.conversationId,
        senderId: user.id,
        type: payload.type,
        content: payload.content,
        mediaUrl: payload.mediaUrl ?? null,
        fileName: payload.fileName ?? null,
        fileSize: payload.fileSize ?? null,
        readBy: [],
        unsent: false,
        createdAt: new Date().toISOString(),
        tempId,
        pending: true,
      };

      addMessage(payload.conversationId, optimistic);

      const socket = getChatSocket();
      if (socket.connected) {
        socket.emit("message:send", { ...payload, tempId });
      } else {
        // Fallback to REST
        api
          .post("/messages", { ...payload })
          .then((res) => {
            replaceTempMessage(
              payload.conversationId,
              tempId,
              res.data.data as Message
            );
          })
          .catch(() => {
            toast.error("Failed to send message.");
          });
      }
    },
    [user, addMessage, replaceTempMessage]
  );

  const deleteForMeMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await api.delete(`/messages/${messageId}/for-me`);
    },
    onSuccess: (_, messageId) => {
      if (!conversationId) return;
      qc.setQueryData(
        ["messages", conversationId],
        (old: { pages: { data: Message[] }[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              data: p.data.filter((m) => m.id !== messageId),
            })),
          };
        }
      );
    },
    onError: () => toast.error("Failed to delete message."),
  });

  const unsendMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await api.post(`/messages/${messageId}/unsend`);
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Cannot unsend this message.";
      toast.error(msg);
    },
  });

  return {
    messages,
    isLoading: query.isLoading,
    isFetchingMore: query.isFetchingNextPage,
    hasMore: query.hasNextPage,
    fetchMore: query.fetchNextPage,
    sendMessage,
    deleteForMe: deleteForMeMutation.mutate,
    unsend: unsendMutation.mutate,
  };
}
