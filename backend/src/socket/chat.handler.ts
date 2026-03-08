import { Server, Socket } from "socket.io";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import { MessageType } from "../types/enums";
import { emitToConversation, emitToUser } from "../services/notification.service";

interface MessageSendPayload {
  conversationId: string;
  type: "text" | "image" | "file";
  content?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  tempId: string;
}

export const setupChatHandler = (io: Server, socket: Socket): void => {
  socket.on("message:send", async (payload: MessageSendPayload) => {
    try {
      const { conversationId, type, content, mediaUrl, fileName, fileSize, tempId } = payload;
      const userId = socket.data.user?.userId;

      if (!userId) {
        socket.emit("error", { code: "AUTH_FAILED", message: "Not authenticated" });
        return;
      }

      const conversation = await Conversation.findById(conversationId);

      if (!conversation) {
        socket.emit("error", { code: "NOT_FOUND", message: "Conversation not found" });
        return;
      }

      const isParticipant = conversation.participants.some(
        (p) => p.toString() === userId
      );

      if (!isParticipant) {
        socket.emit("error", { code: "PERMISSION_DENIED", message: "Not a participant" });
        return;
      }

      const message = await Message.create({
        conversationId: conversation._id,
        senderId: new Types.ObjectId(userId),
        type,
        content,
        mediaUrl,
        fileName,
        fileSize,
        readBy: [new Types.ObjectId(userId)],
        unsent: false,
      });

      conversation.lastMessage = {
        content: content || "[Media]",
        senderId: new Types.ObjectId(userId),
        type,
        timestamp: message.createdAt,
      };
      conversation.updatedAt = new Date();
      await conversation.save();

      const sender = await User.findById(userId).select("username profileImage");

      socket.emit("message:ack", {
        tempId,
        messageId: message._id.toString(),
        conversationId: message.conversationId.toString(),
        timestamp: message.createdAt.toISOString(),
      });

      socket.to(`conversation:${conversationId}`).emit("message:receive", {
        messageId: message._id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: userId,
        senderUsername: sender?.username,
        senderProfileImage: sender?.profileImage,
        type,
        content,
        mediaUrl,
        fileName,
        fileSize,
        timestamp: message.createdAt.toISOString(),
      });
    } catch (error) {
      console.error("Error in message:send:", error);
      socket.emit("error", { code: "SERVER_ERROR", message: "Failed to send message" });
    }
  });

  socket.on("message:typing", async (payload: { conversationId: string; isTyping: boolean }) => {
    try {
      const { conversationId, isTyping } = payload;
      const userId = socket.data.user?.userId;
      const echoId = socket.data.user?.echoId;

      if (!userId) return;

      const user = await User.findById(userId).select("username");

      socket.to(`conversation:${conversationId}`).emit("typing:update", {
        conversationId,
        userId,
        username: user?.username || echoId,
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

      await Message.updateMany(
        {
          _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
          conversationId: new Types.ObjectId(conversationId),
        },
        { $addToSet: { readBy: new Types.ObjectId(userId) } }
      );

      const user = await User.findById(userId).select("username");

      socket.to(`conversation:${conversationId}`).emit("message:read", {
        conversationId,
        messageIds,
        readBy: {
          userId,
          username: user?.username,
          readAt: new Date().toISOString(),
        },
      });
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
