"use client";

import { useCallback, useMemo } from "react";
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
  ReplyPreview,
} from "@/types/message";
import { MESSAGES_PER_PAGE } from "@/lib/constants";
import { encryptMessage, importKeyFromBase64 } from "@/lib/e2eeCrypto";
import { getConversationKey as getConvKeyFromStore } from "@/lib/e2eeKeyStore";
import { ensureConversationKeyForConversation } from "@/lib/e2eeConversationRecovery";

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
  const queryMessages = useMemo(
    () => {
      const pages = query.data?.pages;
      if (!pages) return [];
      return pages.flatMap((p) => p.data).reverse();
    },
    [query.data]
  );

  const liveMessages = useMemo(
    () => storeMessages[conversationId ?? ""] ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [conversationId, storeMessages[conversationId ?? ""]]
  );
  const queryIds = useMemo(
    () => new Set(queryMessages.map((m) => m.id)),
    [queryMessages]
  );
  const extraMessages = useMemo(
    () => liveMessages.filter((m) => !queryIds.has(m.id)),
    [liveMessages, queryIds]
  );
  const messages = useMemo(
    () => [...queryMessages, ...extraMessages],
    [queryMessages, extraMessages]
  );

  const sendMessage = useCallback(
    async (payload: Omit<SendMessagePayload, "tempId"> & { replyPreview?: ReplyPreview | null }) => {
      if (!user) return;
      const tempId = uuidv4();
      const isStealth = !!payload.stealthDuration;
      const stealthExpiresAt = getStealthExpiresAt(payload.stealthDuration);

      let contentCipher: string | undefined;
      let contentIv: string | undefined;
      let contentTag: string | undefined;
      let contentKeyVersion: number | undefined;
      let contentToSend = payload.content;

      if (payload.content && !isStealth) {
        try {
          let convKeyData = await getConvKeyFromStore(payload.conversationId);
          if (!convKeyData) {
            const currentConversation =
              useChatStore.getState().conversations.find((conv) => conv.id === payload.conversationId) ??
              ((await api.get(`/conversations/${payload.conversationId}`).catch(() => null))?.data?.data ?? null);

            if (currentConversation) {
              const recovered = await ensureConversationKeyForConversation(currentConversation);
              if (recovered) {
                convKeyData = await getConvKeyFromStore(payload.conversationId);
              }
            }
          }

          if (convKeyData) {
            console.log("[E2EE] Encrypting message for conversation", payload.conversationId);
            const aesKey = await importKeyFromBase64(convKeyData.key);
            const encrypted = await encryptMessage(payload.content, aesKey);
            contentCipher = encrypted.cipherText;
            contentIv = encrypted.iv;
            contentTag = encrypted.tag;
            contentKeyVersion = convKeyData.keyVersion;
            contentToSend = null;
          } else {
            console.warn("[E2EE] No conversation key found for", payload.conversationId, "- sending plaintext");
          }
        } catch (err) {
          console.error("[E2EE] Encryption failed, falling back to plaintext:", err);
          contentToSend = payload.content;
        }
      }

      const optimistic: Message = {
        id: tempId,
        conversationId: payload.conversationId,
        senderId: user.id,
        type: payload.type,
        content: payload.content,
        isStealth,
        stealthExpiresAt,
        stealthExpiredAt: null,
        contentLength: isStealth ? (payload.content ?? "").length : null,
        isE2ee: !!contentCipher,
        contentCipher: contentCipher ?? null,
        contentIv: contentIv ?? null,
        contentTag: contentTag ?? null,
        contentKeyVersion: contentKeyVersion ?? null,
        mediaUrl: payload.mediaUrl ?? null,
        fileName: payload.fileName ?? null,
        fileSize: payload.fileSize ?? null,
        readBy: [],
        readByAt: {},
        reactions: [],
        unsent: false,
        createdAt: new Date().toISOString(),
        replyToId: payload.replyToId ?? null,
        replyPreview: payload.replyPreview ?? null,
        tempId,
        pending: true,
      };

      addMessage(payload.conversationId, optimistic);
      updateConversationLastMessage(payload.conversationId, {
        content: isStealth ? "[Stealth]" : (contentCipher ? null : payload.content),
        senderId: user.id,
        type: payload.type,
        timestamp: optimistic.createdAt,
        isE2ee: !!contentCipher,
        contentCipher: contentCipher ?? null,
        contentIv: contentIv ?? null,
        contentTag: contentTag ?? null,
        contentKeyVersion: contentKeyVersion ?? null,
      });

      qc.invalidateQueries({ queryKey: ["conversations"] });

      const { replyPreview, ...payloadToSend } = payload;
      const socketPayload: Record<string, unknown> = {
        ...payloadToSend,
        tempId,
        content: contentToSend,
      };

      if (contentCipher) {
        socketPayload.contentCipher = contentCipher;
        socketPayload.contentIv = contentIv;
        socketPayload.contentTag = contentTag;
        socketPayload.contentKeyVersion = contentKeyVersion;
      }

      const socket = getChatSocket();
      if (socket.connected) {
        socket.emit("message:send", socketPayload);
      } else {
        // Fallback to REST
        api
          .post("/messages", socketPayload)
          .then((res) => {
            replaceTempMessage(
              payload.conversationId,
              tempId,
              res.data.data as Message
            );
          })
          .catch((error) => {
            updateMessage(payload.conversationId, tempId, {
              failed: true,
              pending: false,
            });
            const message =
              error?.response?.data?.message ?? "Failed to send message.";
            toast.error(message);
          });
      }
    },
    [user, addMessage, replaceTempMessage, updateConversationLastMessage, updateMessage]
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
    mutationFn: async (payload: { messageId: string; content: string; conversationId: string }) => {
      let contentCipher: string | undefined;
      let contentIv: string | undefined;
      let contentTag: string | undefined;
      let contentKeyVersion: number | undefined;
      let contentToSend: string | null = payload.content;

      try {
        let convKeyData = await getConvKeyFromStore(payload.conversationId);
        if (!convKeyData) {
          const currentConversation =
            useChatStore.getState().conversations.find((conv) => conv.id === payload.conversationId) ??
            ((await api.get(`/conversations/${payload.conversationId}`).catch(() => null))?.data?.data ?? null);

          if (currentConversation) {
            const recovered = await ensureConversationKeyForConversation(currentConversation);
            if (recovered) {
              convKeyData = await getConvKeyFromStore(payload.conversationId);
            }
          }
        }

        if (convKeyData) {
          console.log("[E2EE] Encrypting edit for conversation", payload.conversationId);
          const aesKey = await importKeyFromBase64(convKeyData.key);
          const encrypted = await encryptMessage(payload.content, aesKey);
          contentCipher = encrypted.cipherText;
          contentIv = encrypted.iv;
          contentTag = encrypted.tag;
          contentKeyVersion = convKeyData.keyVersion;
          contentToSend = null;
        }
      } catch (err) {
        console.error("[E2EE] Encryption failed for edit:", err);
      }

      const res = await api.patch(`/messages/${payload.messageId}/edit`, {
        content: contentToSend,
        contentCipher,
        contentIv,
        contentTag,
        contentKeyVersion,
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
