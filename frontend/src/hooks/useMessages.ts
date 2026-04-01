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
import type {
  Message,
  SendMessagePayload,
  ReactionEmoji,
  MessageReaction,
} from "@/types/message";
import { MESSAGES_PER_PAGE } from "@/lib/constants";

const STEALTH_DURATIONS_MS: Record<string, number> = {
  "1m": 60 * 1000,
  "5m": 5 * 60 * 1000,
  "15m": 15 * 60 * 1000,
  "30m": 30 * 60 * 1000,
  "1h": 60 * 60 * 1000,
  "3h": 3 * 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "12h": 12 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
};

const getStealthExpiresAt = (duration?: string | null) => {
  if (!duration) return null;
  const ms = STEALTH_DURATIONS_MS[duration];
  if (!ms) return null;
  return new Date(Date.now() + ms).toISOString();
};

export function useMessages(conversationId: string | null) {
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const {
    addMessage,
    replaceTempMessage,
    messages: storeMessages,
    removeMessage,
    updateMessage,
    updateConversationLastMessage,
  } = useChatStore();

  const shouldUpdateLastMessage = useCallback(
    (message: Pick<Message, "conversationId" | "senderId" | "createdAt">) => {
      const { conversations } = useChatStore.getState();
      const conv = conversations.find((c) => c.id === message.conversationId);
      if (!conv?.lastMessage) return false;
      return (
        conv.lastMessage.senderId === message.senderId &&
        conv.lastMessage.timestamp === message.createdAt
      );
    },
    []
  );

  const applyReactionUpdate = useCallback(
    (
      targetConversationId: string,
      messageId: string,
      updater: (current: MessageReaction[]) => MessageReaction[]
    ) => {
      qc.setQueryData(
        ["messages", targetConversationId],
        (old: { pages: { data: Message[] }[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              data: p.data.map((m) => {
                if (m.id !== messageId) return m;
                const nextReactions = updater(m.reactions ?? []);
                return { ...m, reactions: nextReactions };
              }),
            })),
          };
        }
      );

      const currentMessage = (storeMessages[targetConversationId] ?? []).find(
        (m) => m.id === messageId
      );
      if (currentMessage) {
        updateMessage(targetConversationId, messageId, {
          reactions: updater(currentMessage.reactions ?? []),
        });
      }
    },
    [qc, storeMessages, updateMessage]
  );

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

  // Merge server-loaded messages (TanStack Query) with live/optimistic messages
  // from chatStore (added by sendMessage optimistically or socket:receive events).
  // chatStore is the source of truth for in-flight messages; TanStack Query is the
  // source of truth for persisted history loaded from the server.
  const queryMessages =
    query.data?.pages
      .flatMap((p) => p.data)
      .reverse() ?? [];

  const liveMessages = storeMessages[conversationId ?? ""] ?? [];
  // Only include store messages whose real id isn't already in the query cache.
  // This prevents duplicates once TanStack Query is refetched.
  const queryIds = new Set(queryMessages.map((m) => m.id));
  const extraMessages = liveMessages.filter((m) => !queryIds.has(m.id));
  const messages = [...queryMessages, ...extraMessages];

  const sendMessage = useCallback(
    (payload: Omit<SendMessagePayload, "tempId">) => {
      if (!user) return;
      const tempId = uuidv4();
      const isStealth = !!payload.stealthDuration;
      const stealthExpiresAt = getStealthExpiresAt(payload.stealthDuration);
      const optimistic: Message = {
        id: tempId,
        conversationId: payload.conversationId,
        senderId: user.id,
        type: payload.type,
        content: payload.content,
        isStealth,
        stealthExpiresAt,
        stealthExpiredAt: null,
        stealthContentLength: isStealth ? (payload.content ?? "").length : null,
        mediaUrl: payload.mediaUrl ?? null,
        fileName: payload.fileName ?? null,
        fileSize: payload.fileSize ?? null,
        readBy: [],
        readByAt: {},
        reactions: [],
        unsent: false,
        createdAt: new Date().toISOString(),
        tempId,
        pending: true,
      };

      addMessage(payload.conversationId, optimistic);
      updateConversationLastMessage(payload.conversationId, {
        content: isStealth ? "[Stealth]" : payload.content,
        senderId: user.id,
        type: payload.type,
        timestamp: optimistic.createdAt,
      });

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
    [user, addMessage, replaceTempMessage, updateConversationLastMessage]
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
      removeMessage(conversationId, messageId);
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: () => toast.error("Failed to delete message."),
  });

  const unsendMutation = useMutation({
    mutationFn: async (messageId: string) => {
      await api.post(`/messages/${messageId}/unsend`);
      return messageId;
    },
    onSuccess: (messageId) => {
      if (!conversationId) return;
      const unsentAt = new Date().toISOString();
      // Update TanStack Query cache so the sender sees the change immediately
      qc.setQueryData(
        ["messages", conversationId],
        (old: { pages: { data: Message[] }[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              data: p.data.map((m) =>
                m.id === messageId
                  ? {
                      ...m,
                      unsent: true,
                      unsentAt,
                      content: null,
                      mediaUrl: null,
                      reactions: [],
                    }
                  : m
              ),
            })),
          };
        }
      );
      // Also patch any in-flight copy in the chatStore
      updateMessage(conversationId, messageId, {
        unsent: true,
        unsentAt,
        content: undefined,
        mediaUrl: null,
        reactions: [],
      });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Cannot unsend this message.";
      toast.error(msg);
    },
  });

  const editMessageMutation = useMutation({
    mutationFn: async (payload: { messageId: string; content: string }) => {
      const res = await api.patch(`/messages/${payload.messageId}/edit`, {
        content: payload.content,
      });
      return res.data.data as Message;
    },
    onSuccess: (updated) => {
      if (!conversationId) return;
      qc.setQueryData(
        ["messages", conversationId],
        (old: { pages: { data: Message[] }[] } | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              data: p.data.map((m) => (m.id === updated.id ? updated : m)),
            })),
          };
        }
      );

      updateMessage(conversationId, updated.id, updated);

      if (shouldUpdateLastMessage(updated)) {
        updateConversationLastMessage(conversationId, {
          content: updated.content,
          senderId: updated.senderId,
          type: updated.type,
          timestamp: updated.createdAt,
        });
      }
    },
    onError: (err: unknown) => {
      const msg =
        (err as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message ?? "Failed to edit message.";
      toast.error(msg);
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async (payload: { messageId: string; emoji: ReactionEmoji }) => {
      const res = await api.post(`/messages/${payload.messageId}/reactions`, {
        emoji: payload.emoji,
      });
      return res.data.data as
        | {
            action: "added";
            conversationId: string;
            messageId: string;
            reaction: MessageReaction;
          }
        | {
            action: "removed";
            conversationId: string;
            messageId: string;
            reactionId: string;
          };
    },
    onSuccess: (payload) => {
      if (payload.action === "added") {
        applyReactionUpdate(payload.conversationId, payload.messageId, (current) => {
          if (current.some((reaction) => reaction.id === payload.reaction.id)) {
            return current;
          }
          return [...current, payload.reaction];
        });
        return;
      }
      applyReactionUpdate(payload.conversationId, payload.messageId, (current) =>
        current.filter((reaction) => reaction.id !== payload.reactionId)
      );
    },
    onError: () => toast.error("Failed to add reaction."),
  });

  const removeReactionMutation = useMutation({
    mutationFn: async (payload: { messageId: string; reactionId: string }) => {
      const res = await api.delete(
        `/messages/${payload.messageId}/reactions/${payload.reactionId}`
      );
      return res.data.data as {
        conversationId: string;
        messageId: string;
        reactionId: string;
      };
    },
    onSuccess: (payload) => {
      applyReactionUpdate(payload.conversationId, payload.messageId, (current) =>
        current.filter((reaction) => reaction.id !== payload.reactionId)
      );
    },
    onError: () => toast.error("Failed to remove reaction."),
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
    editMessage: editMessageMutation.mutate,
    editMessageAsync: editMessageMutation.mutateAsync,
    isEditingMessage: editMessageMutation.isPending,
    addReaction: addReactionMutation.mutate,
    removeReaction: removeReactionMutation.mutate,
  };
}
