import { Server, Socket } from "socket.io";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import { MessageType } from "../types/enums";
import { emitToConversation, emitToUser } from "../services/notification.service";
import * as chatService from "../services/chat.service";

interface MessageSendPayload {
  conversationId: string;
  type: "text" | "image" | "video" | "audio" | "file";
  content?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  stealthDuration?: "1m" | "5m" | "15m" | "30m" | "1h" | "3h" | "6h" | "12h" | "24h";
  replyToId?: string;
  tempId: string;
  contentCipher?: string;
  contentIv?: string;
  contentTag?: string;
}

export const setupChatHandler = (io: Server, socket: Socket): void => {
  socket.data.activeConversationId = null;

  socket.on("message:send", async (payload: MessageSendPayload) => {
    const { conversationId, type, content, mediaUrl, fileName, fileSize, stealthDuration, replyToId, tempId, contentCipher, contentIv, contentTag } = payload;
    try {
      const userId = socket.data.user?.userId;

      if (!userId) {
        socket.emit("error", { code: "AUTH_FAILED", message: "Not authenticated" });
        return;
      }

      const conversation = await Conversation.findById(conversationId).select("participants");
      if (!conversation) {
        socket.emit("error", { code: "NOT_FOUND", message: "Conversation not found" });
        return;
      }

      const recipientIds = conversation.participants
        .map((participant) => participant.toString())
        .filter((participantId) => participantId !== userId);

      const suppressNotificationUserIds: string[] = [];
      for (const recipientId of recipientIds) {
        const sockets = await io.of("/chat").in(`user:${recipientId}`).fetchSockets();
        const isViewingConversation = sockets.some(
          (recipientSocket) => recipientSocket.data.activeConversationId === conversationId
        );

        if (isViewingConversation) {
          suppressNotificationUserIds.push(recipientId);
        }
      }

      const result = await chatService.sendMessage(
        userId,
        conversationId,
        type as MessageType,
        content,
        mediaUrl,
        fileName,
        fileSize,
        { suppressNotificationUserIds, stealthDuration, replyToId, contentCipher, contentIv, contentTag }
      );

      socket.emit("message:ack", {
        tempId,
        messageId: result.message.id,
        conversationId: result.message.conversationId,
        timestamp: result.message.createdAt,
        replyToId: result.message.replyToId ?? null,
        replyPreview: result.message.replyPreview ?? null,
      });

      const deliveredRecipientIds = result.deliveredRecipientIds ?? recipientIds;
      const suppressedUnreadRecipientIds = new Set(
        result.suppressedUnreadRecipientIds ?? []
      );

      for (const recipientId of deliveredRecipientIds) {
        emitToUser(recipientId, "message:receive", {
          messageId: result.message.id,
          conversationId: result.message.conversationId,
          senderId: userId,
          senderUsername: result.sender.username,
          senderProfileImage: result.sender.profileImage,
          type: result.message.type,
          content: result.message.content,
          replyToId: result.message.replyToId ?? null,
          replyPreview: result.message.replyPreview ?? null,
          isStealth: result.message.isStealth,
          stealthExpiresAt: result.message.stealthExpiresAt,
          stealthExpiredAt: result.message.stealthExpiredAt,
          contentLength: result.message.contentLength,
          isE2ee: result.message.isE2ee,
          contentCipher: result.message.contentCipher,
          contentIv: result.message.contentIv,
          contentTag: result.message.contentTag,
          mediaUrl: result.message.mediaUrl,
          fileName: result.message.fileName,
          fileSize: result.message.fileSize,
          timestamp: result.message.createdAt,
          suppressUnread: suppressedUnreadRecipientIds.has(recipientId),
        });
      }
    } catch (error: any) {
      console.error("Error in message:send:", error);
      const code =
        error.statusCode === 403 ? "PERMISSION_DENIED" :
        error.statusCode === 404 ? "NOT_FOUND" : "SERVER_ERROR";
      socket.emit("error", {
        code,
        message: error.message ?? "Failed to send message",
        tempId,
        conversationId,
      });
    }
  });

  socket.on("message:typing", async (payload: { conversationId: string; isTyping: boolean }) => {
    try {
      const { conversationId, isTyping } = payload;
      const userId = socket.data.user?.userId;
      const anonimiId = socket.data.user?.anonimiId;

      if (!userId) return;

      const user = await User.findById(userId).select("username");

      socket.to(`conversation:${conversationId}`).emit("typing:update", {
        conversationId,
        userId,
        username: user?.username || anonimiId,
        isTyping,
      });
    } catch (error) {
      console.error("Error in message:typing:", error);
    }
  });

  socket.on("message:read", async (payload: { conversationId: string; messageIds: string[] }) => {
    try {
      const { conversationId, messageIds } = payload;
      const userId = socket.data.user?.userId;

      if (!userId) return;

      const readAt = new Date();

      await Message.updateMany(
        {
          _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
          conversationId: new Types.ObjectId(conversationId),
        },
        {
          $addToSet: { readBy: new Types.ObjectId(userId) },
          $set: { [`readByAt.${userId}`]: readAt },
        }
      );

      const user = await User.findById(userId).select("username");

      const readPayload = {
        conversationId,
        messageIds,
        readBy: {
          userId,
          username: user?.username,
          readAt: readAt.toISOString(),
        },
      };

      // Primary broadcast for sockets that joined the conversation room.
      socket.to(`conversation:${conversationId}`).emit("message:read", readPayload);

      // Fallback direct delivery for participants that may not have joined the room yet.
      const conversation = await Conversation.findById(conversationId).select("participants");
      if (conversation) {
        const participantIds = conversation.participants
          .map((participant) => participant.toString())
          .filter((participantId) => participantId !== userId);

        participantIds.forEach((participantId) => {
          emitToUser(participantId, "message:read", readPayload);
        });
      }
    } catch (error) {
      console.error("Error in message:read:", error);
    }
  });

  socket.on("conversation:join", async (payload: { conversationId: string }) => {
    try {
      const { conversationId } = payload;
      const userId = socket.data.user?.userId;

      if (!userId) return;

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) return;

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );

      if (!isParticipant) {
        socket.emit("error", { code: "PERMISSION_DENIED", message: "Not a participant" });
        return;
      }

      socket.join(`conversation:${conversationId}`);
      socket.emit("conversation:joined", { conversationId });
    } catch (error) {
      console.error("Error in conversation:join:", error);
    }
  });

  socket.on("conversation:leave", async (payload: { conversationId: string }) => {
    try {
      const { conversationId } = payload;
      socket.leave(`conversation:${conversationId}`);
    } catch (error) {
      console.error("Error in conversation:leave:", error);
    }
  });

  socket.on("conversation:active", async (payload: { conversationId: string | null }) => {
    try {
      const { conversationId } = payload;
      const userId = socket.data.user?.userId;
      if (!userId) return;

      if (!conversationId) {
        socket.data.activeConversationId = null;
        return;
      }

      const conversation = await Conversation.findById(conversationId).select("participants");
      if (!conversation) return;

      const isParticipant = conversation.participants.some(
        (participant) => participant.toString() === userId
      );

      if (!isParticipant) return;
      socket.data.activeConversationId = conversationId;
    } catch (error) {
      console.error("Error in conversation:active:", error);
    }
  });

  socket.on("presence:heartbeat", async () => {
    try {
      const userId = socket.data.user?.userId;

      if (!userId) return;

      await User.findByIdAndUpdate(userId, {
        lastSeen: new Date(),
      });
    } catch (error) {
      console.error("Error in presence:heartbeat:", error);
    }
  });
};
