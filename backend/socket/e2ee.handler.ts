import { Server, Socket } from "socket.io";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { ConversationKey } from "../models/conversationKey.model";
import { Types } from "mongoose";
import { emitToUser, emitToConversation } from "../services/notification.service";
import { encryptMessage } from "../utils/e2eeCrypto";

interface E2EESendPayload {
  conversationId: string;
  type: "text" | "image" | "video" | "audio" | "file";
  cipherText: string;
  iv: string;
  tag: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
  stealthDuration?: string;
  tempId: string;
}

export const setupE2EEHandler = (io: Server, socket: Socket): void => {
  socket.on("e2ee:message:send", async (payload: E2EESendPayload) => {
    const {
      conversationId,
      type,
      cipherText,
      iv,
      tag,
      mediaUrl,
      fileName,
      fileSize,
      replyToId,
      stealthDuration,
      tempId,
    } = payload;

    try {
      const userId = socket.data.user?.userId;
      if (!userId) {
        socket.emit("error", { code: "AUTH_FAILED", message: "Not authenticated" });
        return;
      }

      const conversation = await Conversation.findById(conversationId).select("participants type");
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

      const STEALTH_DURATION_MS: Record<string, number> = {
        "1m": 60 * 1000, "5m": 5 * 60 * 1000, "15m": 15 * 60 * 1000,
        "30m": 30 * 60 * 1000, "1h": 60 * 60 * 1000, "3h": 3 * 60 * 60 * 1000,
        "6h": 6 * 60 * 60 * 1000, "12h": 12 * 60 * 60 * 1000, "24h": 24 * 60 * 60 * 1000,
      };
      const stealthDurationMs = stealthDuration ? STEALTH_DURATION_MS[stealthDuration] : null;
      const isStealth = !!stealthDurationMs;
      const stealthExpiresAt = isStealth ? new Date(Date.now() + stealthDurationMs!) : undefined;

      const message = await Message.create({
        conversationId: new Types.ObjectId(conversationId),
        senderId: new Types.ObjectId(userId),
        type,
        content: undefined,
        isE2ee: true,
        contentCipher: cipherText,
        contentIv: iv,
        contentTag: tag,
        isStealth,
        stealthExpiresAt,
        contentLength: isStealth ? (cipherText.length) : undefined,
        mediaUrl,
        fileName,
        fileSize,
        replyTo: replyToId ? new Types.ObjectId(replyToId) : undefined,
        readBy: [new Types.ObjectId(userId)],
        readByAt: { [userId]: new Date() },
        unsent: false,
      });

      conversation.lastMessage = {
        content: isStealth ? "[Stealth]" : "[Encrypted]",
        senderId: new Types.ObjectId(userId),
        type,
        timestamp: message.createdAt,
      };
      conversation.updatedAt = new Date();
      await conversation.save();

      socket.emit("message:ack", {
        tempId,
        messageId: message._id.toString(),
        conversationId: message.conversationId.toString(),
        timestamp: message.createdAt.toISOString(),
        replyToId: replyToId ?? null,
        replyPreview: null,
      });

      const recipientIds = conversation.participants
        .map((p) => p.toString())
        .filter((p) => p !== userId);

      for (const recipientId of recipientIds) {
        emitToUser(recipientId, "e2ee:message:receive", {
          messageId: message._id.toString(),
          conversationId: message.conversationId.toString(),
          senderId: userId,
          senderUsername: socket.data.user?.username ?? "Unknown",
          senderProfileImage: socket.data.user?.profileImage ?? null,
          type: message.type,
          contentCipher: (message as any).contentCipher,
          contentIv: (message as any).contentIv,
          contentTag: (message as any).contentTag,
          isE2ee: message.isE2ee,
          isStealth: message.isStealth,
          stealthExpiresAt: message.stealthExpiresAt?.toISOString() ?? null,
          contentLength: message.contentLength,
          mediaUrl: message.mediaUrl,
          fileName: message.fileName,
          fileSize: message.fileSize,
          timestamp: message.createdAt.toISOString(),
        });
      }
    } catch (error: any) {
      console.error("Error in e2ee:message:send:", error);
      socket.emit("error", {
        code: "SERVER_ERROR",
        message: error.message ?? "Failed to send encrypted message",
        tempId,
        conversationId,
      });
    }
  });

  socket.on("e2ee:group:key:distribute", async (payload: { groupId: string; encryptedKeys: Record<string, string>; keyVersion: number }) => {
    try {
      const userId = socket.data.user?.userId;
      if (!userId) return;

      const { groupId, encryptedKeys, keyVersion } = payload;
      const group = await Group.findById(groupId).select("conversationId");
      if (!group) return;

      const encryptedKeysArray = Object.entries(encryptedKeys).map(([uid, key]) => ({
        userId: new Types.ObjectId(uid),
        encryptedKey: key,
      }));

      await ConversationKey.create({
        conversationId: group.conversationId,
        keyVersion,
        encryptedKeys: encryptedKeysArray,
        createdBy: new Types.ObjectId(userId),
      });

      for (const [uid, key] of Object.entries(encryptedKeys)) {
        emitToUser(uid, "e2ee:group:key:distributed", {
          groupId,
          conversationId: group.conversationId.toString(),
          keyVersion,
          encryptedKey: key,
          senderId: userId,
        });
      }
    } catch (error) {
      console.error("Error in e2ee:group:key:distribute:", error);
    }
  });

  socket.on("e2ee:group:key:rotate", async (payload: { groupId: string; encryptedKeys: Record<string, string>; keyVersion: number }) => {
    try {
      const userId = socket.data.user?.userId;
      if (!userId) return;

      const { groupId, encryptedKeys, keyVersion } = payload;
      const group = await Group.findById(groupId).select("conversationId");
      if (!group) return;

      const encryptedKeysArray = Object.entries(encryptedKeys).map(([uid, key]) => ({
        userId: new Types.ObjectId(uid),
        encryptedKey: key,
      }));

      await ConversationKey.create({
        conversationId: group.conversationId,
        keyVersion,
        encryptedKeys: encryptedKeysArray,
        createdBy: new Types.ObjectId(userId),
      });

      for (const [uid, key] of Object.entries(encryptedKeys)) {
        emitToUser(uid, "e2ee:group:key:rotated", {
          groupId,
          conversationId: group.conversationId.toString(),
          keyVersion,
          encryptedKey: key,
          senderId: userId,
        });
      }
    } catch (error) {
      console.error("Error in e2ee:group:key:rotate:", error);
    }
  });

  socket.on("e2ee:group:key:request", async (payload: { groupId: string; conversationId: string; requesterId: string }) => {
    try {
      const requesterId = payload.requesterId;
      const { groupId, conversationId } = payload;

      const group = await Group.findById(groupId).select("conversationId");
      if (!group) return;

      const groupMember = await GroupMember.findOne({ groupId, userId: new Types.ObjectId(requesterId) }).lean();
      if (!groupMember) return;

      const otherMembers = await GroupMember.find({
        groupId,
        userId: { $ne: new Types.ObjectId(requesterId) },
      }).select("userId").lean();

      const otherUserIds = otherMembers.map((m: any) => m.userId.toString());

      for (const memberId of otherUserIds) {
        emitToUser(memberId, "e2ee:group:key:request:received", {
          groupId,
          conversationId,
          requesterId,
        });
      }
    } catch (error) {
      console.error("Error in e2ee:group:key:request:", error);
    }
  });

  socket.on("e2ee:group:key:response", async (payload: { groupId: string; conversationId: string; requesterId: string; keyVersion: number; encryptedKey: string }) => {
    try {
      const { groupId, conversationId, requesterId, keyVersion, encryptedKey } = payload;

      emitToUser(requesterId, "e2ee:group:key:response:received", {
        groupId,
        conversationId,
        keyVersion,
        encryptedKey,
        senderId: socket.data.user?.userId,
      });
    } catch (error) {
      console.error("Error in e2ee:group:key:response:", error);
    }
  });
};
