"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import type { Message } from "@/types/message";
import type { Conversation } from "@/types/conversation";
import { toast } from "sonner";
import { getChatSocket, disconnectSockets } from "@/lib/socket";
import api from "@/lib/api";
import { decryptKeyWithSharedSecret, deriveSharedSecretFromBase64, exportKeyAsBase64 } from "@/lib/e2eeCrypto";
import { decryptConversationPayload } from "@/lib/e2eeMessageCrypto";
import { getConversationKeyByVersion, getConversationKeys, saveConversationKey } from "@/lib/e2eeKeyStore";
import { ensureLocalE2EEKeyPair } from "@/lib/e2eeRecovery";
import { ensureConversationKeyForConversation } from "@/lib/e2eeConversationRecovery";
import { useAuthStore } from "@/stores/authStore";
import { useSocketStore } from "@/stores/socketStore";
import { useChatStore } from "@/stores/chatStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { useTypingStore } from "@/stores/typingStore";
import { useE2EEKeyRegistration } from "@/hooks/useE2EEKeyRegistration";
import type {
  MessageAckPayload,
  MessageReceivePayload,
  MessageReadReceiptPayload,
  MessageReactionAddedPayload,
  MessageReactionRemovedPayload,
  MessageUnsentPayload,
  MessageEditedPayload,
  MessageStealthExpiredPayload,
  TypingUpdatePayload,
  PresenceUpdatePayload,
  ContactRequestPayload,
  ContactRequestCancelledPayload,
  ContactAcceptedPayload,
  MessageRequestNewPayload,
  MessageRequestAcceptedPayload,
  NotificationPayload,
  ContactNicknameUpdatedPayload,
  E2EEReceivePayload,
} from "@/types/socket";
interface SocketContextValue {
  chatSocket: Socket | null;
}

const SocketContext = createContext<SocketContextValue>({ chatSocket: null });

export function useSocketContext() {
  return useContext(SocketContext);
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const { setChatStatus, setConnectedFeedbackUntil } = useSocketStore();
  const qc = useQueryClient();
  const {
    replaceTempMessage,
    addMessage,
    updateMessage,
    updateConversationLastMessage,
    incrementUnread,
    setUnreadCount,
    unreadCounts,
  } = useChatStore();
  const { setPresence } = usePresenceStore();
  const { setTyping } = useTypingStore();
  const { registerKeys } = useE2EEKeyRegistration();
  const socketRef = useRef<Socket | null>(null);
  const hadOfflineRef = useRef(false);
  const pendingDecryptRetryRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const recoverConversationKey = async (conversationId: string, senderId: string) => {
    try {
      const currentConversation =
        useChatStore.getState().conversations.find((conv) => conv.id === conversationId) ??
        (qc.getQueryData(["conversation", conversationId]) as Conversation | undefined) ??
        ((await api.get(`/conversations/${conversationId}`).catch(() => null))?.data?.data as Conversation | undefined);

      if (!currentConversation) return;

      const recovered = await ensureConversationKeyForConversation(currentConversation);
      if (recovered) {
        return;
      }

      if (currentConversation.type === "group" && currentConversation.group?.id && user?.id) {
        getChatSocket().emit("e2ee:group:key:request", {
          groupId: currentConversation.group.id,
          conversationId,
          requesterId: user.id,
        });
        return;
      }

      if (currentConversation.type === "private") {
        const userKeys = await ensureLocalE2EEKeyPair();
        if (!userKeys?.encryptedPrivateKey) return;

        const peerKeyRes = await api.get(`/e2ee/keys/${senderId}`).catch(() => null);
        if (!peerKeyRes?.data?.data?.publicKey) return;

        const sharedSecretKey = await deriveSharedSecretFromBase64(
          userKeys.encryptedPrivateKey,
          peerKeyRes.data.data.publicKey
        );
        const sharedSecret = await exportKeyAsBase64(sharedSecretKey);

        await saveConversationKey({
          conversationId,
          key: sharedSecret,
          keyVersion: 1,
        });
      }
    } catch (error) {
      console.error("[E2EE] Conversation key recovery failed:", error);
    }
  };

  const clearPendingDecryptRetry = (retryKey: string) => {
    const timeout = pendingDecryptRetryRef.current[retryKey];
    if (timeout) {
      clearTimeout(timeout);
      delete pendingDecryptRetryRef.current[retryKey];
    }
  };

  const schedulePendingDecryptRetry = (
    payload: {
      conversationId: string;
      messageId: string;
      senderId: string;
      senderUsername?: string;
      type: Message["type"];
      timestamp: string;
      contentCipher: string;
      contentIv: string;
      contentTag: string;
      contentKeyVersion?: number | null;
      isStealth?: boolean;
    },
    attempt: number = 0
  ) => {
    const retryKey = `${payload.conversationId}:${payload.messageId}`;
    clearPendingDecryptRetry(retryKey);

    if (attempt >= 8) return;

    pendingDecryptRetryRef.current[retryKey] = setTimeout(async () => {
      if (attempt === 0) {
        await recoverConversationKey(payload.conversationId, payload.senderId);
      }

      const decryptedContent = await decryptConversationPayload({
        conversationId: payload.conversationId,
        cipherText: payload.contentCipher,
        iv: payload.contentIv,
        tag: payload.contentTag,
        contentKeyVersion: payload.contentKeyVersion ?? null,
      });

      if (decryptedContent == null) {
        schedulePendingDecryptRetry(payload, attempt + 1);
        return;
      }

      clearPendingDecryptRetry(retryKey);
      updateMessage(payload.conversationId, payload.messageId, { content: decryptedContent });

      const { conversations } = useChatStore.getState();
      const conversation = conversations.find((conv) => conv.id === payload.conversationId);
      if (conversation?.lastMessage?.timestamp === payload.timestamp) {
        updateConversationLastMessage(payload.conversationId, {
          content: payload.isStealth ? "[Stealth]" : decryptedContent,
          senderId: payload.senderId,
          senderUsername: payload.senderUsername,
          type: payload.type,
          timestamp: payload.timestamp,
          isE2ee: true,
          contentCipher: payload.contentCipher,
          contentIv: payload.contentIv,
          contentTag: payload.contentTag,
          contentKeyVersion: payload.contentKeyVersion ?? null,
        });
      }
    }, 800 * (attempt + 1));
  };

  const baseTitleRef = useRef("anonimi - Real-time Chat");
  const [contactRequestUnread, setContactRequestUnread] = useState(0);

  const getMemberCountDeltaFromSystem = (content: string | null | undefined): number => {
    const text = (content ?? "").toLowerCase();
    if (!text) return 0;
    if (text.includes(" left the group") || text.includes(" was removed by ")) return -1;
    if (text.includes(" was added by ") || text.includes(" joined via ")) return 1;
    return 0;
  };

  useEffect(() => {
    if (typeof document === "undefined") return;

    if (!baseTitleRef.current || baseTitleRef.current.startsWith("(")) {
      baseTitleRef.current = "anonimi - Real-time Chat";
    }

    const messageUnread = Object.values(unreadCounts).reduce(
      (sum, count) => sum + (Number.isFinite(count) ? count : 0),
      0
    );
    const totalUnread = messageUnread + contactRequestUnread;

    document.title = totalUnread > 0
      ? `(${totalUnread > 99 ? "99+" : totalUnread}) New activity - ${baseTitleRef.current}`
      : baseTitleRef.current;

    return () => {
      document.title = baseTitleRef.current;
    };
  }, [unreadCounts, contactRequestUnread]);
  const resolveNotificationHref = (data: Record<string, unknown>) => {
    const href = data.href;
    if (typeof href === "string") {
      if (href === "/contacts/requests") return "/contacts?tab=requests";
      return href;
    }

    const conversationId = data.conversationId;
    if (typeof conversationId === "string") {
      return `/chat/${conversationId}`;
    }

    return "/chat";
  };

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSockets();
      setChatStatus("disconnected");
      if (typeof document !== "undefined") {
        document.title = baseTitleRef.current;
      }
      return;
    }

    const socket = getChatSocket();
    socketRef.current = socket;

    setChatStatus("connecting");
    socket.connect();

    const handleConnect = () => {
      setChatStatus("connected");
      if (hadOfflineRef.current) {
        setConnectedFeedbackUntil(Date.now() + 3500);
        hadOfflineRef.current = false;
      }
      // Ensure E2EE keys are registered on every connect
      void registerKeys();
    };

    const handleDisconnect = () => {
      hadOfflineRef.current = true;
      setChatStatus("disconnected");
    };

    const handleConnectError = () => setChatStatus("error");
    const handleReconnectAttempt = () => setChatStatus("reconnecting");
    const handleReconnect = () => setChatStatus("connected");
    const handleReconnectError = () => setChatStatus("error");
    const handleReconnectFailed = () => setChatStatus("error");

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.io.on("reconnect_attempt", handleReconnectAttempt);
    socket.io.on("reconnect", handleReconnect);
    socket.io.on("reconnect_error", handleReconnectError);
    socket.io.on("reconnect_failed", handleReconnectFailed);

    const handleOnline = () => {
      if (!socket.connected) {
        setChatStatus("reconnecting");
        socket.connect();
      }
    };

    const handleOffline = () => {
      setChatStatus("disconnected");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Message ack — replace optimistic message, preserving its original content/type/senderId
    socket.on("message:ack", (payload: MessageAckPayload) => {
      // Read the current store state at event time (not from a stale React closure)
      // to find the original temp message and preserve its content fields.
      const { messages: storeMessages, conversations } = useChatStore.getState();
      const tempMsg = (storeMessages[payload.conversationId] ?? []).find(
        (m) => m.tempId === payload.tempId
      );
      replaceTempMessage(payload.conversationId, payload.tempId, {
        ...(tempMsg ?? {
          conversationId: payload.conversationId,
          senderId: "",
          type: "text" as const,
          content: null,
          mediaUrl: null,
          fileName: null,
          fileSize: null,
          readBy: [],
          readByAt: {},
          reactions: [],
          unsent: false,
        }),
        id: payload.messageId,
        createdAt: payload.timestamp,
        pending: false,
        replyToId: payload.replyToId ?? tempMsg?.replyToId ?? null,
        replyPreview: payload.replyPreview ?? tempMsg?.replyPreview ?? null,
      } as Message);

      // If this conversation is not yet in the sidebar list (new pending conversation),
      // invalidate so getConversations refetches and shows it.
      if (!conversations.some((c) => c.id === payload.conversationId)) {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    });

    // New message from another user
    socket.on("message:receive", async (payload: MessageReceivePayload) => {
      const suppressUnread = !!payload.suppressUnread;

      let decryptedContent: string | null = payload.content;
      if (payload.isE2ee && payload.contentCipher && payload.contentIv && payload.contentTag) {
        try {
          console.log("[E2EE] Decrypting incoming message for", payload.conversationId);
          decryptedContent = await decryptConversationPayload({
            conversationId: payload.conversationId,
            cipherText: payload.contentCipher,
            iv: payload.contentIv,
            tag: payload.contentTag,
            contentKeyVersion: payload.contentKeyVersion ?? null,
          });
          if (decryptedContent) {
            console.log("[E2EE] Decrypted successfully, content length:", decryptedContent.length);
          } else {
            console.warn("[E2EE] No conversation key for", payload.conversationId, "- cannot decrypt");
          }
        } catch (err) {
          console.error("[E2EE] Decryption failed:", err);
          decryptedContent = null;
        }
      }

      const msg: Message = {
        id: payload.messageId,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        type: payload.type,
        content: decryptedContent,
        replyToId: payload.replyToId ?? null,
        replyPreview: payload.replyPreview ?? null,
        isStealth: payload.isStealth ?? false,
        stealthExpiresAt: payload.stealthExpiresAt ?? null,
        stealthExpiredAt: payload.stealthExpiredAt ?? null,
        contentLength: payload.contentLength ?? null,
        isE2ee: payload.isE2ee ?? false,
        contentCipher: payload.contentCipher ?? null,
        contentIv: payload.contentIv ?? null,
        contentTag: payload.contentTag ?? null,
        contentKeyVersion: payload.contentKeyVersion ?? null,
        mediaUrl: payload.mediaUrl,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        readBy: [],
        readByAt: {},
        reactions: [],
        unsent: false,
        createdAt: payload.timestamp,
      };
      addMessage(payload.conversationId, msg);
      if (
        payload.isE2ee &&
        decryptedContent == null &&
        payload.contentCipher &&
        payload.contentIv &&
        payload.contentTag
      ) {
        schedulePendingDecryptRetry({
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          senderId: payload.senderId,
          senderUsername: payload.senderUsername,
          type: payload.type,
          timestamp: payload.timestamp,
          contentCipher: payload.contentCipher,
          contentIv: payload.contentIv,
          contentTag: payload.contentTag,
          contentKeyVersion: payload.contentKeyVersion ?? null,
          isStealth: payload.isStealth ?? false,
        });
      }
      updateConversationLastMessage(payload.conversationId, {
        content: payload.isStealth ? "[Stealth]" : decryptedContent,
        senderId: payload.senderId,
        senderUsername: payload.senderUsername,
        type: payload.type,
        timestamp: payload.timestamp,
        isE2ee: payload.isE2ee,
        contentCipher: payload.contentCipher,
        contentIv: payload.contentIv,
        contentTag: payload.contentTag,
        contentKeyVersion: payload.contentKeyVersion,
      });

      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversations", "archived"] });

      // Fallback sync: if message-request:new is missed, this ensures request list catches up.
      qc.invalidateQueries({ queryKey: ["message-requests"] });

      const { activeConversationId: currentActiveConversationId } = useChatStore.getState();
      const canAutoRead =
        currentActiveConversationId === payload.conversationId &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        document.hasFocus();

      if (!canAutoRead && !suppressUnread) {
        incrementUnread(payload.conversationId);
      } else {
        // Auto-mark as read
        if (!suppressUnread) {
          socket.emit("message:read", {
            conversationId: payload.conversationId,
            messageIds: [payload.messageId],
          });
        }
      }

      if (suppressUnread) {
        qc.invalidateQueries({ queryKey: ["conversation", payload.conversationId] });
      }

      if (payload.type === "system") {
        const delta = getMemberCountDeltaFromSystem(payload.content);

        if (delta !== 0) {
          qc.setQueryData(
            ["conversation", payload.conversationId],
            (old: Conversation | undefined) => {
              if (!old?.group) return old;
              const current = old.group.memberCount ?? 0;
              return {
                ...old,
                group: {
                  ...old.group,
                  memberCount: Math.max(0, current + delta),
                },
              };
            }
          );

          qc.setQueryData(
            ["conversations", "active"],
            (old:
              | {
                  pages: Array<{ data: Conversation[] }>;
                  pageParams: unknown[];
                }
              | undefined) => {
              if (!old) return old;

              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((conv) => {
                    if (conv.id !== payload.conversationId || !conv.group) return conv;
                    const current = conv.group.memberCount ?? 0;
                    return {
                      ...conv,
                      group: {
                        ...conv.group,
                        memberCount: Math.max(0, current + delta),
                      },
                    };
                  }),
                })),
              };
            }
          );

          qc.setQueryData(
            ["conversations", "archived"],
            (old:
              | {
                  pages: Array<{ data: Conversation[] }>;
                  pageParams: unknown[];
                }
              | undefined) => {
              if (!old) return old;

              return {
                ...old,
                pages: old.pages.map((page) => ({
                  ...page,
                  data: page.data.map((conv) => {
                    if (conv.id !== payload.conversationId || !conv.group) return conv;
                    const current = conv.group.memberCount ?? 0;
                    return {
                      ...conv,
                      group: {
                        ...conv.group,
                        memberCount: Math.max(0, current + delta),
                      },
                    };
                  }),
                })),
              };
            }
          );

          useChatStore.setState((state) => ({
            conversations: state.conversations.map((conv) => {
              if (conv.id !== payload.conversationId || !conv.group) return conv;
              const current = conv.group.memberCount ?? 0;
              return {
                ...conv,
                group: {
                  ...conv.group,
                  memberCount: Math.max(0, current + delta),
                },
              };
            }),
          }));

          // Keep group settings screens in sync (e.g. /groups/:id/settings?tab=members).
          qc.invalidateQueries({ queryKey: ["groups"] });
        }

        qc.invalidateQueries({ queryKey: ["conversations"] });
        qc.invalidateQueries({ queryKey: ["conversation", payload.conversationId] });
      }
    });

    // Message unsent
    socket.on("message:unsent", (payload: MessageUnsentPayload) => {
      const unsentAt = payload.unsentAt ?? new Date().toISOString();

      qc.setQueryData(
        ["messages", payload.conversationId],
        (old:
          | {
              pages: Array<{ data: Message[] }>;
              pageParams: unknown[];
            }
          | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((message) =>
                message.id === payload.messageId
                  ? {
                      ...message,
                      unsent: true,
                      unsentAt,
                      content: null,
                      mediaUrl: null,
                      reactions: [],
                    }
                  : message
              ),
            })),
          };
        }
      );

      updateMessage(payload.conversationId, payload.messageId, {
        unsent: true,
        unsentAt,
        content: null,
        mediaUrl: null,
        reactions: [],
      });

      qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("message:edited", async (payload: MessageEditedPayload) => {
      let nextContent = payload.content;

      if (payload.isE2ee && payload.contentCipher && payload.contentIv && payload.contentTag) {
        try {
          nextContent = await decryptConversationPayload({
            conversationId: payload.conversationId,
            cipherText: payload.contentCipher,
            iv: payload.contentIv,
            tag: payload.contentTag,
            contentKeyVersion: payload.contentKeyVersion ?? null,
          });
        } catch {
          nextContent = null;
        }
      }

      qc.setQueryData(
        ["messages", payload.conversationId],
        (old:
          | {
              pages: Array<{ data: Message[] }>;
              pageParams: unknown[];
            }
          | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((message) =>
                message.id === payload.messageId
                  ? {
                      ...message,
                      content: nextContent,
                      isE2ee: payload.isE2ee ?? message.isE2ee,
                      contentCipher: payload.contentCipher ?? message.contentCipher,
                      contentIv: payload.contentIv ?? message.contentIv,
                      contentTag: payload.contentTag ?? message.contentTag,
                      contentKeyVersion: payload.contentKeyVersion ?? message.contentKeyVersion,
                      editedAt: payload.editedAt,
                      editedBy: payload.editedBy,
                      editHistory: payload.editHistory,
                    }
                  : message
              ),
            })),
          };
        }
      );

      updateMessage(payload.conversationId, payload.messageId, {
        content: nextContent,
        isE2ee: payload.isE2ee,
        contentCipher: payload.contentCipher,
        contentIv: payload.contentIv,
        contentTag: payload.contentTag,
        contentKeyVersion: payload.contentKeyVersion,
        editedAt: payload.editedAt,
        editedBy: payload.editedBy,
        editHistory: payload.editHistory,
      });

      const { conversations } = useChatStore.getState();
      const conv = conversations.find((c) => c.id === payload.conversationId);
      if (
        conv?.lastMessage &&
        conv.lastMessage.senderId === payload.editedBy &&
        conv.lastMessage.timestamp === payload.createdAt
      ) {
        updateConversationLastMessage(payload.conversationId, {
          content: nextContent,
          senderId: conv.lastMessage.senderId,
          type: conv.lastMessage.type,
          timestamp: conv.lastMessage.timestamp,
          isE2ee: payload.isE2ee ?? conv.lastMessage.isE2ee,
          contentCipher: payload.contentCipher ?? conv.lastMessage.contentCipher,
          contentIv: payload.contentIv ?? conv.lastMessage.contentIv,
          contentTag: payload.contentTag ?? conv.lastMessage.contentTag,
          contentKeyVersion:
            payload.contentKeyVersion ?? conv.lastMessage.contentKeyVersion,
        });
      }

      qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("message:stealth:expired", (payload: MessageStealthExpiredPayload) => {
      qc.setQueryData(
        ["messages", payload.conversationId],
        (old:
          | {
              pages: Array<{ data: Message[] }>;
              pageParams: unknown[];
            }
          | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((message) =>
                message.id === payload.messageId
                  ? {
                      ...message,
                      content: null,
                      isStealth: true,
                      stealthExpiredAt: payload.stealthExpiredAt,
                      contentLength: payload.contentLength,
                    }
                  : message
              ),
            })),
          };
        }
      );

      updateMessage(payload.conversationId, payload.messageId, {
        content: null,
        isStealth: true,
        stealthExpiredAt: payload.stealthExpiredAt,
        contentLength: payload.contentLength,
      });
    });

    socket.on("error", (payload: { message?: string; tempId?: string; conversationId?: string }) => {
      if (payload?.tempId && payload?.conversationId) {
        updateMessage(payload.conversationId, payload.tempId, {
          failed: true,
          pending: false,
        });
      }
      if (payload?.message) {
        toast.error(payload.message);
      }
    });

    const applyReactionUpdate = (
      conversationId: string,
      messageId: string,
      updater: (current: Message["reactions"]) => Message["reactions"]
    ) => {
      qc.setQueryData(
        ["messages", conversationId],
        (old:
          | {
              pages: Array<{ data: Message[] }>;
              pageParams: unknown[];
            }
          | undefined) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((message) => {
                if (message.id !== messageId) return message;
                return {
                  ...message,
                  reactions: updater(message.reactions ?? []),
                };
              }),
            })),
          };
        }
      );

      const { messages } = useChatStore.getState();
      const current = (messages[conversationId] ?? []).find(
        (msg) => msg.id === messageId
      );
      if (current) {
        updateMessage(conversationId, messageId, {
          reactions: updater(current.reactions ?? []),
        });
      }
    };

    socket.on("message:reaction:add", (payload: MessageReactionAddedPayload) => {
      applyReactionUpdate(payload.conversationId, payload.messageId, (current) => [
        ...current.filter((reaction) => reaction.id !== payload.reaction.id),
        payload.reaction as Message["reactions"][number],
      ]);
    });

    socket.on("message:reaction:remove", (payload: MessageReactionRemovedPayload) => {
      applyReactionUpdate(payload.conversationId, payload.messageId, (current) =>
        current.filter((reaction) => reaction.id !== payload.reactionId)
      );
    });

    // Read receipts
    socket.on("message:read", (payload: MessageReadReceiptPayload) => {
      const readerId = payload.readBy.userId;
      const readAt = payload.readBy.readAt;

      qc.setQueryData(
        ["messages", payload.conversationId],
        (old:
          | {
              pages: Array<{ data: Message[] }>;
              pageParams: unknown[];
            }
          | undefined) => {
          if (!old) return old;

          return {
            ...old,
            pages: old.pages.map((page) => ({
              ...page,
              data: page.data.map((message) => {
                if (!payload.messageIds.includes(message.id)) return message;
                const alreadyRead = message.readBy.includes(readerId);
                return {
                  ...message,
                  readBy: alreadyRead ? message.readBy : [...message.readBy, readerId],
                  readByAt: {
                    ...(message.readByAt ?? {}),
                    [readerId]: readAt,
                  },
                };
              }),
            })),
          };
        }
      );

      const { messages } = useChatStore.getState();
      const conversationMessages = messages[payload.conversationId] ?? [];

      payload.messageIds.forEach((msgId) => {
        const currentMessage = conversationMessages.find((msg) => msg.id === msgId);
        const existingReadBy = currentMessage?.readBy ?? [];
        const existingReadByAt = currentMessage?.readByAt ?? {};
        const nextReadBy = existingReadBy.includes(readerId)
          ? existingReadBy
          : [...existingReadBy, readerId];

        updateMessage(payload.conversationId, msgId, {
          readBy: nextReadBy,
          readByAt: {
            ...existingReadByAt,
            [readerId]: readAt,
          },
        });
      });
    });

    // Typing
    socket.on("typing:update", (payload: TypingUpdatePayload) => {
      if (process.env.NODE_ENV !== "production") {
        console.debug("[typing] update", payload);
      }
      setTyping(
        payload.conversationId,
        payload.userId,
        payload.username,
        payload.isTyping
      );
    });

    // Presence
    socket.on("presence:update", (payload: PresenceUpdatePayload) => {
      setPresence(payload.userId, payload.status, payload.lastSeen);
    });

    // Notifications (contact request, message request, etc.)
    socket.on("contact:request", (_payload: ContactRequestPayload) => {
      setContactRequestUnread((value) => value + 1);
      qc.invalidateQueries({ queryKey: ["contacts", "requests"] });
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("contact:request-cancelled", (_payload: ContactRequestCancelledPayload) => {
      setContactRequestUnread((value) => (value > 0 ? value - 1 : 0));
      qc.invalidateQueries({ queryKey: ["contacts", "requests"] });
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("contact:accepted", (_payload: ContactAcceptedPayload) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("contact:nickname-updated", (payload: ContactNicknameUpdatedPayload) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["conversation", payload.conversationId] });
    });

    socket.on("group:member-muted", (payload: { groupId: string; userId: string }) => {
      qc.invalidateQueries({ queryKey: ["groups", payload.groupId, "members"] });
      qc.invalidateQueries({ queryKey: ["conversation"] });
    });

    socket.on("group:member-unmuted", (payload: { groupId: string; userId: string }) => {
      qc.invalidateQueries({ queryKey: ["groups", payload.groupId, "members"] });
      qc.invalidateQueries({ queryKey: ["conversation"] });
    });

    socket.on("message-request:new", (_payload: MessageRequestNewPayload) => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("message-request:accepted", (payload: MessageRequestAcceptedPayload) => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
      qc.invalidateQueries({ queryKey: ["conversation", payload.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contacts", "requests"] });
      qc.invalidateQueries({ queryKey: ["user-profile"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("notification:new", (payload: NotificationPayload) => {
      const payloadConversationId =
        typeof payload.data?.conversationId === "string"
          ? payload.data.conversationId
          : null;
      const canAutoReadFromNotification =
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        document.hasFocus();
      const isActiveMessageNotification =
        payload.type === "message_received" &&
        !!payloadConversationId &&
        payloadConversationId === useChatStore.getState().activeConversationId &&
        canAutoReadFromNotification;

      if (isActiveMessageNotification) {
        api.patch(`/notifications/${payload.id}/read`).catch(() => undefined);
      }

      qc.invalidateQueries({ queryKey: ["notifications"] });
      if (payload.type.toLowerCase().includes("warning")) {
        qc.invalidateQueries({ queryKey: ["support-overview"] });
      }
      if (payload.type === "message_request") {
        qc.invalidateQueries({ queryKey: ["message-requests"] });
      }
      const unreadMessages = Number(payload.data?.unreadMessages);
      const isAggregatedMessageUpdate =
        payload.type === "message_received" &&
        Number.isFinite(unreadMessages) &&
        unreadMessages > 1;

      if (!isAggregatedMessageUpdate && !isActiveMessageNotification) {
        const href = resolveNotificationHref(payload.data);
        const description = payload.body.replace(/\s*Click to view\.?\s*$/i, "").trim();
        const isMessageType = payload.type === "message_received" || payload.type === "message_request";
        const actionLabel = isMessageType ? "View message" : "Open";
        toast.info(payload.title, {
          description,
          duration: 4500,
          action: {
            label: actionLabel,
            onClick: () => router.push(href),
          },
        });
      }
    });

    socket.on("conversation:muted", (payload: { conversationId: string; mutedUntil?: string | null }) => {
      setUnreadCount(payload.conversationId, 0);
      useChatStore.setState((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === payload.conversationId
            ? { ...conv, isMuted: true, mutedUntil: payload.mutedUntil ?? null }
            : conv
        ),
      }));
      qc.invalidateQueries({ queryKey: ["conversation", payload.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("conversation:unmuted", (payload: { conversationId: string }) => {
      useChatStore.setState((state) => ({
        conversations: state.conversations.map((conv) =>
          conv.id === payload.conversationId
            ? { ...conv, isMuted: false, mutedUntil: null }
            : conv
        ),
      }));
      qc.invalidateQueries({ queryKey: ["conversation", payload.conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    socket.on("e2ee:message:receive", async (payload: E2EEReceivePayload) => {
      const decryptedContent = await decryptConversationPayload({
        conversationId: payload.conversationId,
        cipherText: payload.contentCipher,
        iv: payload.contentIv,
        tag: payload.contentTag,
        contentKeyVersion: payload.contentKeyVersion ?? null,
      });

      const msg: Message = {
        id: payload.messageId,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        type: payload.type as Message["type"],
        content: decryptedContent,
        isStealth: payload.isStealth ?? false,
        stealthExpiresAt: payload.stealthExpiresAt ?? null,
        stealthExpiredAt: null,
        contentLength: payload.contentLength ?? null,
        isE2ee: true,
        contentCipher: payload.contentCipher,
        contentIv: payload.contentIv,
        contentTag: payload.contentTag,
        contentKeyVersion: payload.contentKeyVersion ?? null,
        mediaUrl: payload.mediaUrl,
        fileName: payload.fileName,
        fileSize: payload.fileSize,
        readBy: [],
        readByAt: {},
        reactions: [],
        unsent: false,
        createdAt: payload.timestamp,
      };
      addMessage(payload.conversationId, msg);
      if (decryptedContent == null) {
        schedulePendingDecryptRetry({
          conversationId: payload.conversationId,
          messageId: payload.messageId,
          senderId: payload.senderId,
          senderUsername: payload.senderUsername,
          type: payload.type as Message["type"],
          timestamp: payload.timestamp,
          contentCipher: payload.contentCipher,
          contentIv: payload.contentIv,
          contentTag: payload.contentTag,
          contentKeyVersion: payload.contentKeyVersion ?? null,
          isStealth: payload.isStealth ?? false,
        });
      }
      updateConversationLastMessage(payload.conversationId, {
        content: payload.isStealth ? "[Stealth]" : decryptedContent,
        senderId: payload.senderId,
        senderUsername: payload.senderUsername,
        type: payload.type as Message["type"],
        timestamp: payload.timestamp,
        isE2ee: true,
        contentCipher: payload.contentCipher,
        contentIv: payload.contentIv,
        contentTag: payload.contentTag,
        contentKeyVersion: payload.contentKeyVersion ?? null,
      });

      const { activeConversationId: currentActiveConversationId } = useChatStore.getState();
      const canAutoRead =
        currentActiveConversationId === payload.conversationId &&
        typeof document !== "undefined" &&
        document.visibilityState === "visible" &&
        document.hasFocus();

      if (!canAutoRead) {
        incrementUnread(payload.conversationId);
      } else {
        socket.emit("message:read", {
          conversationId: payload.conversationId,
          messageIds: [payload.messageId],
        });
      }
    });

    socket.on("e2ee:group:key:distributed", async (payload: { groupId: string; conversationId: string; keyVersion: number; encryptedKey: string; senderId: string }) => {
      try {
        const existing = await getConversationKeyByVersion(
          payload.conversationId,
          payload.keyVersion
        );
        if (existing) return;

        const userKeys = await ensureLocalE2EEKeyPair();
        if (!userKeys?.encryptedPrivateKey) return;

        const senderKeyRes = await api.get(`/e2ee/keys/${payload.senderId}`).catch(() => null);
        if (!senderKeyRes?.data?.data) return;

        const senderPublicKey = senderKeyRes.data.data.publicKey;

        const decryptedKeyBase64 = await decryptKeyWithSharedSecret(
          payload.encryptedKey,
          userKeys.encryptedPrivateKey,
          senderPublicKey
        );

        await saveConversationKey({
          conversationId: payload.conversationId,
          key: decryptedKeyBase64,
          keyVersion: payload.keyVersion,
        });
      } catch (error) {
        console.error("Failed to process group key distribution:", error);
      }
    });

    socket.on("e2ee:group:key:rotated", async (payload: { groupId: string; conversationId: string; keyVersion: number; encryptedKey: string; senderId: string }) => {
      try {
        const existing = await getConversationKeyByVersion(
          payload.conversationId,
          payload.keyVersion
        );
        if (existing) return;

        const userKeys = await ensureLocalE2EEKeyPair();
        if (!userKeys?.encryptedPrivateKey) return;

        const senderKeyRes = await api.get(`/e2ee/keys/${payload.senderId}`).catch(() => null);
        if (!senderKeyRes?.data?.data) return;

        const senderPublicKey = senderKeyRes.data.data.publicKey;

        const decryptedKeyBase64 = await decryptKeyWithSharedSecret(
          payload.encryptedKey,
          userKeys.encryptedPrivateKey,
          senderPublicKey
        );

        await saveConversationKey({
          conversationId: payload.conversationId,
          key: decryptedKeyBase64,
          keyVersion: payload.keyVersion,
        });
      } catch (error) {
        console.error("Failed to process group key rotation:", error);
      }
    });

    socket.on("e2ee:group:key:request:received", async (payload: { groupId: string; conversationId: string; requesterId: string }) => {
      try {
        const existingKeys = await getConversationKeys(payload.conversationId);
        if (existingKeys.length === 0) return;

        const userKeys = await ensureLocalE2EEKeyPair();
        if (!userKeys?.encryptedPrivateKey) return;

        const requesterKeyRes = await api.get(`/e2ee/keys/${payload.requesterId}`).catch(() => null);
        if (!requesterKeyRes?.data?.data) return;

        const requesterPublicKey = requesterKeyRes.data.data.publicKey;
        const latestKey = existingKeys[0];

        const { encryptKeyWithSharedSecret } = await import("@/lib/e2eeCrypto");
        const encrypted = await encryptKeyWithSharedSecret(
          latestKey.key,
          userKeys.encryptedPrivateKey,
          requesterPublicKey
        );

        socket.emit("e2ee:group:key:response", {
          groupId: payload.groupId,
          conversationId: payload.conversationId,
          requesterId: payload.requesterId,
          keyVersion: latestKey.keyVersion,
          encryptedKey: encrypted,
        });

        console.log("[E2EE] Responded to group key request from", payload.requesterId);
      } catch (error) {
        console.error("Failed to respond to group key request:", error);
      }
    });

    socket.on("e2ee:group:key:response:received", async (payload: { groupId: string; conversationId: string; keyVersion: number; encryptedKey: string; senderId: string }) => {
      try {
        const existing = await getConversationKeyByVersion(
          payload.conversationId,
          payload.keyVersion
        );
        if (existing) return;

        const userKeys = await ensureLocalE2EEKeyPair();
        if (!userKeys?.encryptedPrivateKey) return;

        const senderKeyRes = await api.get(`/e2ee/keys/${payload.senderId}`).catch(() => null);
        if (!senderKeyRes?.data?.data) return;

        const senderPublicKey = senderKeyRes.data.data.publicKey;

        const decryptedKeyBase64 = await decryptKeyWithSharedSecret(
          payload.encryptedKey,
          userKeys.encryptedPrivateKey,
          senderPublicKey
        );

        await saveConversationKey({
          conversationId: payload.conversationId,
          key: decryptedKeyBase64,
          keyVersion: payload.keyVersion,
        });

        console.log("[E2EE] Received group key v", payload.keyVersion, "from", payload.senderId);
      } catch (error) {
        console.error("Failed to process group key response:", error);
      }
    });

    return () => {
      Object.keys(pendingDecryptRetryRef.current).forEach(clearPendingDecryptRetry);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.io.off("reconnect_attempt", handleReconnectAttempt);
      socket.io.off("reconnect", handleReconnect);
      socket.io.off("reconnect_error", handleReconnectError);
      socket.io.off("reconnect_failed", handleReconnectFailed);
      socket.off("message:ack");
      socket.off("message:receive");
      socket.off("message:unsent");
      socket.off("message:edited");
      socket.off("message:stealth:expired");
      socket.off("message:reaction:add");
      socket.off("message:reaction:remove");
      socket.off("message:read");
      socket.off("error");
      socket.off("typing:update");
      socket.off("presence:update");
      socket.off("contact:request");
      socket.off("contact:request-cancelled");
      socket.off("contact:accepted");
      socket.off("contact:nickname-updated");
      socket.off("group:member-muted");
      socket.off("group:member-unmuted");
      socket.off("message-request:new");
      socket.off("message-request:accepted");
      socket.off("notification:new");
      socket.off("conversation:muted");
      socket.off("conversation:unmuted");
      socket.off("support:ticket:new");
      socket.off("support:ticket:updated");
      socket.off("support:message:new");
      socket.off("support:report:new");
      socket.off("support:report:updated");
      socket.off("e2ee:message:receive");
      socket.off("e2ee:group:key:distributed");
      socket.off("e2ee:group:key:rotated");
      socket.off("e2ee:group:key:request:received");
      socket.off("e2ee:group:key:response:received");
    };
  }, [
    isAuthenticated,
    setChatStatus,
    setConnectedFeedbackUntil,
    replaceTempMessage,
    addMessage,
    updateMessage,
    updateConversationLastMessage,
    incrementUnread,
    setPresence,
    setTyping,
    router,
  ]);

  return (
    <SocketContext.Provider value={{ chatSocket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}
