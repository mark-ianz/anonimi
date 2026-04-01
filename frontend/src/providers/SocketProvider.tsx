"use client";

import { useEffect, useRef, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { Socket } from "socket.io-client";
import { toast } from "sonner";
import { getChatSocket, disconnectSockets } from "@/lib/socket";
import api from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { useSocketStore } from "@/stores/socketStore";
import { useChatStore } from "@/stores/chatStore";
import { usePresenceStore } from "@/stores/presenceStore";
import { useTypingStore } from "@/stores/typingStore";
import type {
  MessageAckPayload,
  MessageReceivePayload,
  MessageReadEventPayload,
  MessageReactionAddedPayload,
  MessageReactionRemovedPayload,
  MessageUnsentPayload,
  MessageEditedPayload,
  TypingUpdatePayload,
  PresenceUpdatePayload,
  ContactRequestPayload,
  ContactRequestCancelledPayload,
  ContactAcceptedPayload,
  MessageRequestNewPayload,
  MessageRequestAcceptedPayload,
  NotificationPayload,
  GroupMemberJoinedPayload,
  GroupMemberLeftPayload,
  GroupUpdatedPayload,
  GroupRoleChangedPayload,
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
  const { isAuthenticated } = useAuthStore();
  const { setChatStatus } = useSocketStore();
  const qc = useQueryClient();
  const {
    replaceTempMessage,
    addMessage,
    updateMessage,
    updateConversationLastMessage,
    incrementUnread,
    unreadCounts,
  } = useChatStore();
  const { setPresence } = usePresenceStore();
  const { setTyping } = useTypingStore();
  const socketRef = useRef<Socket | null>(null);

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

    socket.on("connect", () => setChatStatus("connected"));
    socket.on("disconnect", () => setChatStatus("disconnected"));
    socket.on("connect_error", () => setChatStatus("error"));

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
      } as Message);

      // If this conversation is not yet in the sidebar list (new pending conversation),
      // invalidate so getConversations refetches and shows it.
      if (!conversations.some((c) => c.id === payload.conversationId)) {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
    });

    // New message from another user
    socket.on("message:receive", (payload: MessageReceivePayload) => {
      const { conversations } = useChatStore.getState();
      const suppressUnread = !!payload.suppressUnread;
      const msg: Message = {
        id: payload.messageId,
        conversationId: payload.conversationId,
        senderId: payload.senderId,
        type: payload.type,
        content: payload.content,
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
      updateConversationLastMessage(payload.conversationId, {
        content: payload.content,
        senderId: payload.senderId,
        senderUsername: payload.senderUsername,
        type: payload.type,
        timestamp: payload.timestamp,
      });

      if (!conversations.some((conv) => conv.id === payload.conversationId)) {
        qc.invalidateQueries({ queryKey: ["conversations"] });
      }
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

    socket.on("message:edited", (payload: MessageEditedPayload) => {
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
                      content: payload.content,
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
        content: payload.content,
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
          content: payload.content,
          senderId: conv.lastMessage.senderId,
          type: conv.lastMessage.type,
          timestamp: conv.lastMessage.timestamp,
        });
      }

      qc.invalidateQueries({ queryKey: ["conversations"] });
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
        toast.info(payload.title, {
          description,
          duration: 4500,
          action: {
            label: "View message",
            onClick: () => router.push(href),
          },
        });
      }
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("connect_error");
      socket.off("message:ack");
      socket.off("message:receive");
      socket.off("message:unsent");
      socket.off("message:edited");
      socket.off("message:reaction:add");
      socket.off("message:reaction:remove");
      socket.off("message:read");
      socket.off("typing:update");
      socket.off("presence:update");
      socket.off("contact:request");
      socket.off("contact:request-cancelled");
      socket.off("contact:accepted");
      socket.off("contact:nickname-updated");
      socket.off("message-request:new");
      socket.off("message-request:accepted");
      socket.off("notification:new");
    };
  }, [
    isAuthenticated,
    setChatStatus,
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
