"use client";

import { useEffect, useRef, createContext, useContext } from "react";
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
  MessageUnsentPayload,
  MessageReadReceiptPayload,
  TypingUpdatePayload,
  PresenceUpdatePayload,
  ContactRequestPayload,
  ContactAcceptedPayload,
  MessageRequestNewPayload,
  MessageRequestAcceptedPayload,
  NotificationPayload,
} from "@/types/socket";
import type { Message } from "@/types/message";

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
  } = useChatStore();
  const { setPresence } = usePresenceStore();
  const { setTyping } = useTypingStore();
  const socketRef = useRef<Socket | null>(null);

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
        unsent: false,
        createdAt: payload.timestamp,
      };
      addMessage(payload.conversationId, msg);
      updateConversationLastMessage(payload.conversationId, {
        content: payload.content,
        senderId: payload.senderId,
        type: payload.type,
        timestamp: payload.timestamp,
      });
      const { activeConversationId: currentActiveConversationId } = useChatStore.getState();
      if (currentActiveConversationId !== payload.conversationId) {
        incrementUnread(payload.conversationId);
      } else {
        // Auto-mark as read
        socket.emit("message:read", {
          conversationId: payload.conversationId,
          messageIds: [payload.messageId],
        });
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
                  ? { ...message, unsent: true, unsentAt, content: null, mediaUrl: null }
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
      });

      qc.invalidateQueries({ queryKey: ["conversations"] });
    });

    // Read receipts
    socket.on("message:read", (payload: MessageReadReceiptPayload) => {
      const readerId = payload.readBy.userId;

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
                if (message.readBy.includes(readerId)) return message;
                return {
                  ...message,
                  readBy: [...message.readBy, readerId],
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
        const nextReadBy = existingReadBy.includes(readerId)
          ? existingReadBy
          : [...existingReadBy, readerId];

        updateMessage(payload.conversationId, msgId, {
          readBy: nextReadBy,
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
      qc.invalidateQueries({ queryKey: ["contacts", "requests"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("contact:accepted", (_payload: ContactAcceptedPayload) => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("message-request:new", (_payload: MessageRequestNewPayload) => {
      qc.invalidateQueries({ queryKey: ["message-requests"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("message-request:accepted", (_payload: MessageRequestAcceptedPayload) => {
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    });

    socket.on("notification:new", (payload: NotificationPayload) => {
      const payloadConversationId =
        typeof payload.data?.conversationId === "string"
          ? payload.data.conversationId
          : null;
      const isActiveMessageNotification =
        payload.type === "message_received" &&
        !!payloadConversationId &&
        payloadConversationId === useChatStore.getState().activeConversationId;

      if (isActiveMessageNotification) {
        api.patch(`/notifications/${payload.id}/read`).catch(() => undefined);
      }

      qc.invalidateQueries({ queryKey: ["notifications"] });
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
      socket.off("message:read");
      socket.off("typing:update");
      socket.off("presence:update");
      socket.off("contact:request");
      socket.off("contact:accepted");
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
