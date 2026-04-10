import { Types } from "mongoose";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { Contact } from "../models/contact.model";
import { MessageRequest } from "../models/messageRequest.model";
import { Block } from "../models/block.model";
import { ConversationArchive } from "../models/conversationArchive.model";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/apiError";
import { MessageType } from "../types/enums";
import { isReactionEmoji } from "../constants/reactions";
import {
  emitToUser,
  emitToConversation,
  createAndEmitNotification,
  decrementMessageNotificationOnUnsend,
} from "./notification.service";
import { decryptStealthContent, encryptStealthContent } from "../utils/stealthCrypto";

interface ConversationParticipant {
  id: string;
  anonimiId: string;
  username: string;
  nickname?: string;
  contactId?: string | null;
  blockId?: string | null;
  blockedByMe?: boolean;
  profileImage: string | null;
  onlineStatus: string;
  isTemporary?: boolean;
  isDeleted?: boolean;
}

interface LastMessage {
  content: string;
  senderId: string;
  type: string;
  timestamp: Date;
  senderUsername?: string;
}

export type ConversationListFilter = "active" | "archived";

const serializeReadByAt = (
  readByAt: unknown
): Record<string, string> => {
  const sourceEntries: Array<[string, unknown]> =
    readByAt instanceof Map
      ? Array.from(readByAt.entries())
      : Object.entries((readByAt ?? {}) as Record<string, unknown>);

  return sourceEntries.reduce<Record<string, string>>((acc, [userId, rawValue]) => {
    const timestamp = rawValue instanceof Date ? rawValue : new Date(rawValue as string);
    if (Number.isNaN(timestamp.getTime())) {
      return acc;
    }

    acc[userId] = timestamp.toISOString();
    return acc;
  }, {});
};

const serializeReaction = (reaction: { _id: Types.ObjectId; userId: Types.ObjectId; emoji: string; createdAt: Date }) => ({
  id: reaction._id.toString(),
  userId: reaction.userId.toString(),
  emoji: reaction.emoji,
  createdAt: reaction.createdAt,
});

const serializeReactions = (
  reactions: Array<{ _id: Types.ObjectId; userId: Types.ObjectId; emoji: string; createdAt: Date }> | undefined,
  isUnsent: boolean
) => (isUnsent ? [] : (reactions ?? []).map(serializeReaction));

const serializeEditHistory = (
  history: Array<{
    content?: string | null;
    isE2ee?: boolean;
    contentCipher?: string;
    contentIv?: string;
    contentTag?: string;
    contentKeyVersion?: number;
    editedAt: Date;
    editedBy: Types.ObjectId;
  }> | undefined
) =>
  (history ?? []).map((entry) => ({
    content: entry.content ?? null,
    isE2ee: entry.isE2ee ?? false,
    contentCipher: entry.contentCipher ?? null,
    contentIv: entry.contentIv ?? null,
    contentTag: entry.contentTag ?? null,
    contentKeyVersion: entry.contentKeyVersion ?? null,
    editedAt: entry.editedAt,
    editedBy: entry.editedBy?.toString(),
  }));

const serializeReplyPreview = (preview: any) => {
  if (!preview) return null;
  return {
    messageId: preview.messageId?.toString?.() ?? preview.messageId,
    senderId: preview.senderId?.toString?.() ?? null,
    senderUsername: preview.senderUsername ?? null,
    type: preview.type,
    content: preview.content ?? null,
    mediaUrl: preview.mediaUrl ?? null,
    fileName: preview.fileName ?? null,
    createdAt: preview.createdAt,
  };
};

const STEALTH_DURATION_MS: Record<string, number> = {
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

const getStealthDurationMs = (value?: string) => {
  if (!value) return null;
  return STEALTH_DURATION_MS[value] ?? null;
};

const serializeStealth = (message: any) => {
  if (!message.isStealth) {
    return {
      isStealth: false,
      content: message.unsent ? null : message.content,
      stealthExpiresAt: null,
      stealthExpiredAt: null,
      stealthContentLength: null,
    };
  }

  if (message.isE2ee) {
    return {
      isStealth: true,
      content: null,
      stealthExpiresAt: message.stealthExpiresAt ? new Date(message.stealthExpiresAt) : null,
      stealthExpiredAt: message.stealthExpiredAt ?? null,
      stealthContentLength: message.contentLength ?? 0,
    };
  }

  const expiresAt = message.stealthExpiresAt ? new Date(message.stealthExpiresAt) : null;
  const expired = !!message.stealthExpiredAt || (expiresAt ? expiresAt.getTime() <= Date.now() : true);

  if (expired) {
    return {
      isStealth: true,
      content: null,
      stealthExpiresAt: expiresAt,
      stealthExpiredAt: message.stealthExpiredAt ?? expiresAt,
      stealthContentLength: message.stealthContentLength ?? 0,
    };
  }

  let content: string | null = null;
  try {
    if (message.contentCipher && message.contentIv && message.contentTag) {
      content = decryptStealthContent(
        message.contentCipher,
        message.contentIv,
        message.contentTag
      );
    }
  } catch {
    content = null;
  }

  return {
    isStealth: true,
    content,
    stealthExpiresAt: expiresAt,
    stealthExpiredAt: message.stealthExpiredAt ?? null,
    stealthContentLength: message.contentLength ?? (content ? content.length : 0),
  };
};

const clampPreview = (value: string, maxLength: number = 120) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const resolveReplyPreviewContent = (message: any, stealthContent: string | null) => {
  if (message.unsent) return "Message removed";
  if (message.isStealth) return "[Stealth]";
  if (message.type === "image") return "Photo";
  if (message.type === "video") return "Video";
  if (message.type === "audio") return "Audio";
  if (message.type === "file") return message.fileName || "File";
  return stealthContent ?? message.content ?? "";
};

const buildReplyPreview = async (replyToId: string, conversationId: string) => {
  const replyMessage = await Message.findById(replyToId).lean();
  if (!replyMessage) {
    throw new NotFoundError("Reply message not found");
  }
  if (replyMessage.conversationId.toString() !== conversationId) {
    throw new ForbiddenError("Reply message does not belong to this conversation");
  }

  const replySender = replyMessage.senderId
    ? await User.findById(replyMessage.senderId).select("username").lean()
    : null;
  const stealth = serializeStealth(replyMessage);
  const previewText = replyMessage.isE2ee
    ? null
    : resolveReplyPreviewContent(replyMessage, stealth.content);

  return {
    messageId: replyMessage._id,
    senderId: replyMessage.senderId,
    senderUsername: replySender?.username ?? null,
    type: replyMessage.type,
    content: previewText ? clampPreview(previewText) : null,
    mediaUrl: replyMessage.mediaUrl ?? null,
    fileName: replyMessage.fileName ?? null,
    createdAt: replyMessage.createdAt,
  };
};

const getConversationMuteUntil = (conversation: any, userId: string) => {
  const entry = (conversation.mutedUsers ?? []).find(
    (row: any) => row.userId?.toString?.() === userId
  );
  if (!entry) return null;
  if (!entry.mutedUntil) return null;
  const mutedUntil = new Date(entry.mutedUntil);
  if (Number.isNaN(mutedUntil.getTime())) return null;
  return mutedUntil;
};

const isConversationMuted = (conversation: any, userId: string) => {
  const entry = (conversation.mutedUsers ?? []).find(
    (row: any) => row.userId?.toString?.() === userId
  );
  if (!entry) return false;
  if (!entry.mutedUntil) return true;
  return new Date(entry.mutedUntil).getTime() > Date.now();
};

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getArchivedRecipientIds = async (
  conversationId: string,
  recipientIds: string[]
) => {
  if (recipientIds.length === 0) return new Set<string>();

  const archivedRows = await ConversationArchive.find({
    conversationId: new Types.ObjectId(conversationId),
    userId: { $in: recipientIds.map((id) => new Types.ObjectId(id)) },
  })
    .select("userId")
    .lean();

  return new Set(archivedRows.map((row: any) => row.userId.toString()));
};

const clearConversationArchiveForUser = async (
  conversationId: string,
  userId: string
) => {
  await ConversationArchive.findOneAndDelete({
    conversationId: new Types.ObjectId(conversationId),
    userId: new Types.ObjectId(userId),
  });
};

export const createOrGetConversation = async (
  userId: string,
  participantAnonimiId: string
) => {
  const participant = await User.findOne({ anonimiId: participantAnonimiId }).select(
    "_id anonimiId username profileImage"
  );
  if (!participant) throw new NotFoundError("User not found");

  if (participant._id.toString() === userId) {
    throw new ForbiddenError("Cannot create a conversation with yourself");
  }

  const blockedByMe = await Block.findOne({
    blockerId: new Types.ObjectId(userId),
    blockedId: participant._id,
    active: true,
  });
  if (blockedByMe) {
    throw new ForbiddenError("You blocked this user. Unblock to start or continue messaging.");
  }

  const existing = await Conversation.findOne({
    type: "private",
    participants: { $all: [new Types.ObjectId(userId), participant._id] },
  });

  if (existing) {
    await clearConversationArchiveForUser(existing._id.toString(), userId);
    return {
      conversationId: existing._id.toString(),
      created: false,
      requestStatus: existing.requestStatus ?? null,
    };
  }

  const isContact = await Contact.findOne({
    $or: [
      { userId: new Types.ObjectId(userId), contactId: participant._id, status: "accepted" },
      { userId: participant._id, contactId: new Types.ObjectId(userId), status: "accepted" },
    ],
  });

  const requestStatus = isContact ? null : "pending";

  const conversation = await Conversation.create({
    type: "private",
    participants: [new Types.ObjectId(userId), participant._id],
    requestStatus,
  });

  return {
    conversationId: conversation._id.toString(),
    created: true,
    requestStatus,
  };
};

export const getConversationRequests = async (userId: string) => {
  const requests = await MessageRequest.find({
    toUserId: new Types.ObjectId(userId),
    status: "pending",
  })
    .populate("fromUserId", "anonimiId username profileImage onlineStatus isTemporary")
    .populate("conversationId", "_id updatedAt lastMessage")
    .populate("groupId", "_id name image")
    .sort({ createdAt: -1 })
    .lean();

  return (requests as any[])
    .filter((r) => r.conversationId)
    .map((r) => {
    const fromUser = r.fromUserId ?? null;
    const fallbackFromUserId = r.fromUserId?.toString?.() ?? "";
    const group = r.groupId ?? null;

    const participant = fromUser
      ? {
          id: fromUser._id.toString(),
          anonimiId: fromUser.anonimiId,
          username: fromUser.username,
          nickname: null,
          profileImage: fromUser.profileImage ?? null,
          onlineStatus: fromUser.onlineStatus ?? "offline",
          isTemporary: !!fromUser.isTemporary,
          isDeleted: false,
        }
      : {
          id: fallbackFromUserId,
          anonimiId: "deleted",
          username: "Deleted temporary user",
          nickname: null,
          profileImage: null,
          onlineStatus: "offline",
          isTemporary: true,
          isDeleted: true,
        };

    return {
      id: r.conversationId._id.toString(),
      type: group ? ("group" as const) : ("private" as const),
      participant,
      group: group
        ? {
            id: group._id.toString(),
            name: group.name,
            image: group.image ?? null,
            memberCount: 0,
            fallbackProfileImages: [],
          }
        : undefined,
      lastMessage: r.conversationId.lastMessage ?? null,
      requestStatus: "pending",
      requestId: r._id.toString(),
      requestFromUserId: fromUser?._id?.toString?.() ?? fallbackFromUserId,
      unreadCount: 0,
      updatedAt: r.conversationId.updatedAt,
    };
  });
};

export const getConversations = async (
  userId: string,
  limit: number = 20,
  cursor?: string,
  filter: ConversationListFilter = "active"
) => {
  const userObjectId = new Types.ObjectId(userId);
  const archivedRows = await ConversationArchive.find({
    userId: userObjectId,
  })
    .select("conversationId deletedAt")
    .lean();

  const archivedConvIds = archivedRows
    .filter((row: any) => !row.deletedAt)
    .map((row: any) => row.conversationId);
  const archivedConvIdSet = new Set(archivedConvIds.map((id: any) => id.toString()));

  if (filter === "archived" && archivedConvIds.length === 0) {
    return {
      conversations: [],
      nextCursor: undefined,
    };
  }

  // Include conversations where user is the sender of an outgoing pending request.
  // The base filter excludes all "pending" convs (receiver inbox), but the sender
  // should still see their own pending outgoing requests in their chat list.
  const outgoingPendingConvIds = await MessageRequest.find({
    fromUserId: userObjectId,
    status: "pending",
  }).distinct("conversationId");

  const query: Record<string, unknown> = {
    participants: userObjectId,
  };

  query._id =
    filter === "archived"
      ? { $in: archivedConvIds }
      : { $nin: archivedConvIds };

  if (outgoingPendingConvIds.length > 0) {
    query.$or = [
      { requestStatus: { $in: [null, "accepted"] } },
      { _id: { $in: outgoingPendingConvIds } },
    ];
  } else {
    query.requestStatus = { $in: [null, "accepted"] };
  }

  if (cursor) {
    query.updatedAt = { $lt: new Date(cursor) };
  }

  const conversations = await Conversation.find(query)
    .sort({ updatedAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = conversations.length > limit;
  const data = hasMore ? conversations.slice(0, limit) : conversations;

  const enriched = await Promise.all(
    data.map(async (conv: any) => {
      const otherParticipants = conv.participants.filter(
        (p: Types.ObjectId) => p.toString() !== userId
      );

      if (conv.type === "private") {
        const otherUserId = otherParticipants[0];
        const user = await User.findById(otherUserId).select(
          "anonimiId username profileImage onlineStatus isTemporary"
        );

        const contact = await Contact.findOne({
          userId: new Types.ObjectId(userId),
          contactId: otherUserId,
          status: "accepted",
        });

        const myBlock = await Block.findOne({
          blockerId: new Types.ObjectId(userId),
          blockedId: otherUserId,
          active: true,
        }).select("_id");

        const isMuted = isConversationMuted(conv, userId);
        const mutedUntil = getConversationMuteUntil(conv, userId);
        const unreadCount = isMuted
          ? 0
          : await Message.countDocuments({
              conversationId: conv._id,
              senderId: { $ne: userObjectId },
              readBy: { $ne: userObjectId },
              deletedFor: { $ne: userObjectId },
            });

        const latestVisibleMessage = await Message.findOne({
          conversationId: conv._id,
          deletedFor: { $ne: userObjectId },
        })
          .sort({ createdAt: -1 })
          .select("senderId type content createdAt isStealth isE2ee contentCipher contentIv contentTag contentKeyVersion")
          .lean();

        const lastMessageSender = latestVisibleMessage?.senderId
          ? await User.findById(latestVisibleMessage.senderId).select("username").lean()
          : null;

        const participant: ConversationParticipant = user
          ? {
              id: user._id.toString(),
              anonimiId: user.anonimiId,
              username: user.username,
              nickname: contact?.nickname,
              contactId: contact?._id.toString() ?? null,
              blockId: myBlock?._id.toString() ?? null,
              blockedByMe: !!myBlock,
              profileImage: user.profileImage,
              onlineStatus: user.onlineStatus,
              isTemporary: !!user.isTemporary,
              isDeleted: false,
            }
          : {
              id: otherUserId?.toString?.() ?? "",
              anonimiId: "deleted",
              username: "Deleted temporary user",
              nickname: null,
              contactId: null,
              blockId: null,
              blockedByMe: false,
              profileImage: null,
              onlineStatus: "offline",
              isTemporary: true,
              isDeleted: true,
            };

        return {
          id: conv._id.toString(),
          type: conv.type,
          isArchived: archivedConvIdSet.has(conv._id.toString()),
          participant,
          lastMessage: latestVisibleMessage
            ? {
                content: latestVisibleMessage.isE2ee ? null : latestVisibleMessage.content,
                senderId: latestVisibleMessage.senderId?.toString(),
                type: latestVisibleMessage.type,
                timestamp: latestVisibleMessage.createdAt,
                senderUsername: lastMessageSender?.username,
                isStealth: latestVisibleMessage.isStealth ?? false,
                isE2ee: latestVisibleMessage.isE2ee ?? false,
                contentCipher: latestVisibleMessage.contentCipher ?? null,
                contentIv: latestVisibleMessage.contentIv ?? null,
                contentTag: latestVisibleMessage.contentTag ?? null,
                contentKeyVersion: latestVisibleMessage.contentKeyVersion ?? null,
              }
            : null,
          unreadCount,
          isMuted,
          mutedUntil,
          requestStatus: conv.requestStatus ?? null,
          updatedAt: conv.updatedAt,
        };
      } else {
        const group = await Group.findOne({ conversationId: conv._id });
        if (!group) {
          return null;
        }

        const membership = await GroupMember.findOne({
          groupId: group._id,
          userId: userObjectId,
        }).select("joinedAt").lean();
        const joinedAt = membership?.joinedAt || new Date(0);

        const memberCount = await GroupMember.countDocuments({
          groupId: group?._id,
        });
        const fallbackMembers = await GroupMember.find({ groupId: group._id })
          .sort({ joinedAt: 1 })
          .limit(3)
          .populate("userId", "profileImage")
          .lean();
        const fallbackProfileImages = fallbackMembers.map(
          (m: any) => m.userId?.profileImage ?? null
        );

        const isMuted = isConversationMuted(conv, userId);
        const mutedUntil = getConversationMuteUntil(conv, userId);
        const unreadCount = isMuted
          ? 0
          : await Message.countDocuments({
              conversationId: conv._id,
              senderId: { $ne: userObjectId },
              readBy: { $ne: userObjectId },
              deletedFor: { $ne: userObjectId },
              createdAt: { $gte: joinedAt },
            });

        const latestVisibleMessage = await Message.findOne({
          conversationId: conv._id,
          deletedFor: { $ne: userObjectId },
          createdAt: { $gte: joinedAt },
        })
          .sort({ createdAt: -1 })
          .select("senderId type content createdAt isStealth isE2ee contentCipher contentIv contentTag contentKeyVersion")
          .lean();

        const lastMessageSender = latestVisibleMessage?.senderId
          ? await User.findById(latestVisibleMessage.senderId).select("username").lean()
          : null;

        return {
          id: conv._id.toString(),
          type: conv.type,
          isArchived: archivedConvIdSet.has(conv._id.toString()),
          group: {
            id: group?._id.toString(),
            name: group?.name,
            image: group?.image,
            memberCount,
            fallbackProfileImages,
            disbandedAt: group?.disbandedAt ?? null,
          },
          lastMessage: latestVisibleMessage
            ? {
                content: latestVisibleMessage.isE2ee ? null : latestVisibleMessage.content,
                senderId: latestVisibleMessage.senderId?.toString(),
                type: latestVisibleMessage.type,
                timestamp: latestVisibleMessage.createdAt,
                senderUsername: lastMessageSender?.username,
                isStealth: latestVisibleMessage.isStealth ?? false,
                isE2ee: latestVisibleMessage.isE2ee ?? false,
                contentCipher: latestVisibleMessage.contentCipher ?? null,
                contentIv: latestVisibleMessage.contentIv ?? null,
                contentTag: latestVisibleMessage.contentTag ?? null,
                contentKeyVersion: latestVisibleMessage.contentKeyVersion ?? null,
              }
            : null,
          unreadCount,
          isMuted,
          mutedUntil,
          requestStatus: null,
          updatedAt: conv.updatedAt,
        };
      }
    })
  );

  const visibleConversations = enriched.filter(
    (conversation): conversation is NonNullable<typeof conversation> =>
      Boolean(conversation) && (filter !== "active" || conversation.lastMessage !== null)
  );

  return {
    conversations: visibleConversations,
    nextCursor: hasMore ? data[data.length - 1].updatedAt.toISOString() : undefined,
  };
};

export const getConversation = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId
  );

  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  if (conversation.type === "private") {
    const otherParticipant = conversation.participants.find(
      (p) => p.toString() !== userId
    );
    const user = await User.findById(otherParticipant).select(
      "anonimiId username profileImage onlineStatus isTemporary"
    );

    const contact = await Contact.findOne({
      userId: new Types.ObjectId(userId),
      contactId: otherParticipant,
      status: "accepted",
    });

    const myBlock = await Block.findOne({
      blockerId: new Types.ObjectId(userId),
      blockedId: otherParticipant,
      active: true,
    }).select("_id");

    const messageRequest = await MessageRequest.findOne({
      conversationId: conversation._id,
    }).select("_id fromUserId toUserId status");
    const archivedRow = await ConversationArchive.findOne({
      conversationId: conversation._id,
      userId: new Types.ObjectId(userId),
    }).select("_id");

    const participant: ConversationParticipant = user
      ? {
          id: user._id.toString(),
          anonimiId: user.anonimiId,
          username: user.username,
          nickname: contact?.nickname,
          contactId: contact?._id.toString() ?? null,
          blockId: myBlock?._id.toString() ?? null,
          blockedByMe: !!myBlock,
          profileImage: user.profileImage,
          onlineStatus: user.onlineStatus,
          isTemporary: !!user.isTemporary,
          isDeleted: false,
        }
      : {
          id: otherParticipant?.toString?.() ?? "",
          anonimiId: "deleted",
          username: "Deleted temporary user",
          nickname: null,
          contactId: null,
          blockId: null,
          blockedByMe: false,
          profileImage: null,
          onlineStatus: "offline",
          isTemporary: true,
          isDeleted: true,
        };

    return {
      id: conversation._id.toString(),
      type: conversation.type,
      isArchived: !!archivedRow,
      isMuted: isConversationMuted(conversation, userId),
      mutedUntil: getConversationMuteUntil(conversation, userId),
      participant,
      requestStatus: conversation.requestStatus ?? null,
      requestId: messageRequest?._id.toString() ?? null,
      requestFromUserId: messageRequest?.fromUserId.toString() ?? null,
      createdAt: conversation.createdAt,
    };
  } else {
    const group = await Group.findOne({ conversationId: conversation._id });
    if (!group) {
      throw new NotFoundError("Conversation not found");
    }
    const membership = await GroupMember.findOne({
      groupId: group._id,
      userId: new Types.ObjectId(userId),
    }).select("joinedAt").lean();
    const joinedAt = membership?.joinedAt || new Date(0);

    const memberCount = group
      ? await GroupMember.countDocuments({ groupId: group._id })
      : 0;
    const fallbackMembers = group
      ? await GroupMember.find({ groupId: group._id })
          .sort({ joinedAt: 1 })
          .limit(3)
          .populate("userId", "profileImage")
          .lean()
      : [];
    const fallbackProfileImages = fallbackMembers.map(
      (m: any) => m.userId?.profileImage ?? null
    );

    const isLastMessageVisible = conversation.lastMessage?.timestamp && 
                                  new Date(conversation.lastMessage.timestamp) >= joinedAt;

    const lastMessageSender = isLastMessageVisible && conversation.lastMessage?.senderId
      ? await User.findById(conversation.lastMessage.senderId).select("username").lean()
      : null;
    const archivedRow = await ConversationArchive.findOne({
      conversationId: conversation._id,
      userId: new Types.ObjectId(userId),
    }).select("_id");

    return {
      id: conversation._id.toString(),
      type: conversation.type,
      isArchived: !!archivedRow,
      isMuted: isConversationMuted(conversation, userId),
      mutedUntil: getConversationMuteUntil(conversation, userId),
      group: {
        id: group?._id.toString(),
        name: group?.name,
        image: group?.image,
        memberCount,
        fallbackProfileImages,
        disbandedAt: group?.disbandedAt ?? null,
      },
      lastMessage: isLastMessageVisible && conversation.lastMessage
        ? {
            content: conversation.lastMessage.isE2ee ? null : conversation.lastMessage.content,
            senderId: conversation.lastMessage.senderId?.toString(),
            type: conversation.lastMessage.type,
            timestamp: conversation.lastMessage.timestamp,
            senderUsername: lastMessageSender?.username,
            isStealth: (conversation.lastMessage as any).isStealth ?? false,
            isE2ee: conversation.lastMessage.isE2ee ?? false,
            contentCipher: conversation.lastMessage.contentCipher ?? null,
            contentIv: conversation.lastMessage.contentIv ?? null,
            contentTag: conversation.lastMessage.contentTag ?? null,
            contentKeyVersion: (conversation.lastMessage as any).contentKeyVersion ?? null,
          }
        : null,
    };
  }
};

export const getMessages = async (
  conversationId: string,
  userId: string,
  limit: number = 30,
  cursor?: string
) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === userId
  );

  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  const query: Record<string, unknown> = {
    conversationId: new Types.ObjectId(conversationId),
    deletedFor: { $ne: new Types.ObjectId(userId) },
  };

  if (conversation.type === "group") {
    const group = await Group.findOne({ conversationId: conversation._id });
    if (group) {
      const membership = await GroupMember.findOne({
        groupId: group._id,
        userId: new Types.ObjectId(userId),
      })
        .select("joinedAt")
        .lean();
      if (membership) {
        query.createdAt = { $gte: membership.joinedAt };
      }
    }
  }

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: data.map((m: any) => {
      const stealth = serializeStealth(m);
      return {
        id: m._id.toString(),
        conversationId: m.conversationId.toString(),
        senderId: m.senderId?.toString(),
        type: m.type,
        content: stealth.content,
        isStealth: stealth.isStealth,
        stealthExpiresAt: stealth.stealthExpiresAt,
        stealthExpiredAt: stealth.stealthExpiredAt,
        stealthContentLength: stealth.stealthContentLength,
        isE2ee: m.isE2ee ?? false,
        contentCipher: m.contentCipher ?? null,
        contentIv: m.contentIv ?? null,
        contentTag: m.contentTag ?? null,
        mediaUrl: m.mediaUrl,
        fileName: m.fileName,
        fileSize: m.fileSize,
        replyToId: m.replyTo?.toString() ?? null,
        replyPreview: serializeReplyPreview(m.replyPreview),
        readBy: m.readBy.map((r: Types.ObjectId) => r.toString()),
        readByAt: serializeReadByAt(m.readByAt),
        reactions: serializeReactions(m.reactions, m.unsent),
        editHistory: serializeEditHistory(m.editHistory),
        editedAt: m.editedAt ?? null,
        editedBy: m.editedBy?.toString() ?? null,
        unsent: m.unsent,
        unsentAt: m.unsent ? m.updatedAt : null,
        createdAt: m.createdAt,
      };
    }),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
    hasMore,
    limit,
  };
};

export const searchMessages = async (
  userId: string,
  filters: {
    tokens?: string[];
    conversationId?: string;
    senderId?: string;
    before?: string;
    after?: string;
  },
  limit: number,
  cursor?: string
) => {
  if (!filters.tokens?.length) {
    return {
      messages: [],
      nextCursor: null,
      hasMore: false,
      limit,
    };
  }

  const conversationFilter: any = { participants: userId };
  if (filters.conversationId) conversationFilter._id = filters.conversationId;

  const conversations = await Conversation.find(conversationFilter)
    .select("_id")
    .lean();
  const conversationIds = conversations.map((c) => c._id);

  const query: any = {
    conversationId: { $in: conversationIds },
    unsent: false,
    deletedFor: { $ne: userId },
  };

  if (filters.senderId) query.senderId = filters.senderId;

  if (filters.before || filters.after) {
    query.createdAt = {};
    if (filters.before) query.createdAt.$lt = new Date(filters.before);
    if (filters.after) query.createdAt.$gt = new Date(filters.after);
  }

  if (filters.tokens?.length) {
    query.searchTokens = { $in: filters.tokens };
  }

  if (cursor) query._id = { $lt: cursor };

  const messages = await Message.find(query)
    .sort({ _id: -1 })
    .limit(limit + 1)
    .select(
      [
        "conversationId",
        "senderId",
        "type",
        "contentCipher",
        "contentIv",
        "contentTag",
        "contentKeyVersion",
        "isE2ee",
        "mediaUrl",
        "fileName",
        "fileSize",
        "replyPreview",
        "reactions",
        "readBy",
        "readByAt",
        "createdAt",
        "updatedAt",
      ].join(" ")
    )
    .lean();

  const hasMore = messages.length > limit;
  if (hasMore) messages.pop();

  const conversationIdsInResults = Array.from(
    new Set(messages.map((message: any) => message.conversationId.toString()))
  );
  const senderIdsInResults = Array.from(
    new Set(
      messages
        .map((message: any) => message.senderId?.toString?.())
        .filter((senderId): senderId is string => !!senderId)
    )
  );

  const [conversationsForResults, senders] = await Promise.all([
    Conversation.find({ _id: { $in: conversationIdsInResults } })
      .select("_id type")
      .lean(),
    User.find({ _id: { $in: senderIdsInResults } })
      .select("_id username")
      .lean(),
  ]);

  const senderMap = new Map(
    senders.map((sender: any) => [sender._id.toString(), sender.username ?? null])
  );

  const groupConversationIds = conversationsForResults
    .filter((conversation: any) => conversation.type === "group")
    .map((conversation: any) => conversation._id);

  const groups = groupConversationIds.length
    ? await Group.find({ conversationId: { $in: groupConversationIds } })
        .select("_id conversationId")
        .lean()
    : [];

  const groupIdByConversationId = new Map(
    groups.map((group: any) => [group.conversationId.toString(), group._id.toString()])
  );

  const groupMembers = groups.length
    ? await GroupMember.find({
        groupId: { $in: groups.map((group: any) => group._id) },
        userId: { $in: senderIdsInResults },
      })
        .select("groupId userId nickname")
        .lean()
    : [];

  const groupNicknameMap = new Map(
    groupMembers.map((member: any) => [
      `${member.groupId.toString()}:${member.userId.toString()}`,
      member.nickname ?? null,
    ])
  );

  return {
    messages: messages.map((message: any) => ({
      ...(message.senderId
        ? {
            senderUsername: senderMap.get(message.senderId.toString()) ?? null,
            senderNickname:
              groupNicknameMap.get(
                `${groupIdByConversationId.get(message.conversationId.toString()) ?? ""}:${message.senderId.toString()}`
              ) ?? null,
          }
        : {
            senderUsername: null,
            senderNickname: null,
          }),
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId?.toString() ?? null,
      type: message.type,
      content: message.isE2ee ? null : (message.content ?? null),
      isE2ee: message.isE2ee ?? false,
      contentCipher: message.contentCipher ?? null,
      contentIv: message.contentIv ?? null,
      contentTag: message.contentTag ?? null,
      contentKeyVersion: message.contentKeyVersion ?? null,
      mediaUrl: message.mediaUrl ?? null,
      fileName: message.fileName ?? null,
      fileSize: message.fileSize ?? null,
      replyToId: message.replyTo?.toString?.() ?? null,
      replyPreview: serializeReplyPreview(message.replyPreview),
      readBy: (message.readBy ?? []).map((reader: Types.ObjectId) => reader.toString()),
      readByAt: serializeReadByAt(message.readByAt),
      reactions: serializeReactions(message.reactions, message.unsent ?? false),
      unsent: message.unsent ?? false,
      unsentAt: message.unsent ? message.updatedAt : null,
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
    })),
    nextCursor: hasMore ? messages[messages.length - 1]._id.toString() : null,
    hasMore,
    limit,
  };
};

export const sendMessage = async (
  senderId: string,
  conversationId: string,
  type: MessageType,
  content?: string,
  mediaUrl?: string,
  fileName?: string,
  fileSize?: number,
  options?: {
    suppressNotificationUserIds?: string[];
    stealthDuration?: string;
    replyToId?: string;
    contentCipher?: string;
    contentIv?: string;
    contentTag?: string;
    contentKeyVersion?: number;
    searchTokens?: string[];
  }
) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === senderId
  );

  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  // Outgoing messages from archived threads auto-unarchive for the sender.
  await clearConversationArchiveForUser(conversationId, senderId);

  const stealthDurationMs = getStealthDurationMs(options?.stealthDuration);
  const isStealth = !!stealthDurationMs;
  const trimmedContent = (content ?? "").trim();
  const replyPreview = options?.replyToId
    ? await buildReplyPreview(options.replyToId, conversation._id.toString())
    : null;

  if (isStealth) {
    if (type !== "text") {
      throw new ForbiddenError("Stealth mode is only supported for text messages");
    }
    if (!trimmedContent) {
      throw new ForbiddenError("Stealth messages require text content");
    }
    if (mediaUrl || fileName || fileSize) {
      throw new ForbiddenError("Stealth messages cannot include attachments");
    }
  }

  const previewContent = isStealth ? "[Stealth]" : content;

  if (conversation.type === "private") {
    const recipientId = conversation.participants.find(
      (p: Types.ObjectId) => p.toString() !== senderId
    );

    if (!recipientId) {
      throw new NotFoundError("Recipient not found");
    }

    const blockedBySender = await Block.findOne({
      blockerId: new Types.ObjectId(senderId),
      blockedId: recipientId,
      active: true,
    }).select("_id");

    if (blockedBySender) {
      throw new ForbiddenError("You blocked this user. Unblock to send messages.");
    }

    const blockedByRecipient = await Block.findOne({
      blockerId: recipientId,
      blockedId: new Types.ObjectId(senderId),
      active: true,
    }).select("_id");

    const isShadowDelivery = !!blockedByRecipient;

    if (!isShadowDelivery) {
      const isContact = await Contact.findOne({
        $or: [
          { userId: senderId, contactId: recipientId, status: "accepted" },
          { userId: recipientId, contactId: senderId, status: "accepted" },
        ],
      });

      if (!isContact) {
      const existingRequest = await MessageRequest.findOne({
        conversationId: conversation._id,
      });

      if (!existingRequest) {
        // First message from a non-contact — create the request
        const newRequest = await MessageRequest.create({
          conversationId: conversation._id,
          fromUserId: new Types.ObjectId(senderId),
          toUserId: recipientId,
          status: "pending",
        });

        if (!conversation.requestStatus) {
          conversation.requestStatus = "pending";
        }

        // Notify recipient of the new message request
        const senderForNotif = await User.findById(senderId).select(
          "anonimiId username profileImage"
        );
        emitToUser(recipientId!.toString(), "message-request:new", {
          requestId: newRequest._id.toString(),
          conversationId: conversation._id.toString(),
          from: {
            id: senderId,
            anonimiId: senderForNotif?.anonimiId,
            username: senderForNotif?.username,
            profileImage: senderForNotif?.profileImage ?? null,
          },
          preview: {
            content: previewContent,
            type,
            timestamp: new Date().toISOString(),
          },
        });

        await createAndEmitNotification({
          userId: recipientId!.toString(),
          type: "message_request",
          title: "New message request",
          body: `${senderForNotif?.username ?? "Someone"} sent you a message request.`,
          data: {
            conversationId: conversation._id.toString(),
            fromUserId: senderId,
            href: "/message-requests",
          },
        });
      } else if (
        conversation.requestStatus === "pending" &&
        existingRequest.fromUserId.toString() !== senderId
      ) {
        // Recipient is replying — auto-accept the request
        existingRequest.status = "accepted";
        await existingRequest.save();
        conversation.requestStatus = "accepted";

        const senderForAccept = await User.findById(senderId).select(
          "anonimiId username profileImage"
        );
        emitToUser(existingRequest.fromUserId.toString(), "message-request:accepted", {
          requestId: existingRequest._id.toString(),
          conversationId: conversation._id.toString(),
          acceptedBy: {
            id: senderId,
            anonimiId: senderForAccept?.anonimiId,
            username: senderForAccept?.username,
            profileImage: senderForAccept?.profileImage ?? null,
          },
          requestStatus: "accepted",
        });

        await createAndEmitNotification({
          userId: existingRequest.fromUserId.toString(),
          type: "message_request_accepted",
          title: "Message request accepted",
          body: `${senderForAccept?.username ?? "A user"} accepted your request.`,
          data: {
            conversationId: conversation._id.toString(),
            href: `/chat/${conversation._id.toString()}`,
          },
        });
      }
      }
    }

    const stealthExpiresAt = isStealth ? new Date(Date.now() + stealthDurationMs!) : undefined;
    const stealthPayload = isStealth ? encryptStealthContent(trimmedContent) : null;
    const isE2ee = !!options?.contentCipher;

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: new Types.ObjectId(senderId),
      type,
      content: isStealth || isE2ee ? undefined : content,
      isStealth,
      isE2ee,
      contentCipher: options?.contentCipher || stealthPayload?.cipherText,
      contentIv: options?.contentIv || stealthPayload?.iv,
      contentTag: options?.contentTag || stealthPayload?.tag,
      contentKeyVersion: options?.contentKeyVersion,
      searchTokens: isE2ee && options?.searchTokens?.length ? options.searchTokens : undefined,
      stealthExpiresAt,
      contentLength: isStealth ? trimmedContent.length : undefined,
      mediaUrl,
      fileName,
      fileSize,
      replyTo: replyPreview?.messageId,
      replyPreview: replyPreview ?? undefined,
      readBy: [new Types.ObjectId(senderId)],
      readByAt: { [senderId]: new Date() },
      deletedFor: isShadowDelivery ? [recipientId] : [],
      unsent: false,
    } as any);

    if (!isShadowDelivery) {
      if (message) {
        conversation.lastMessage = {
          content: isE2ee ? undefined : isStealth ? null : (content || (mediaUrl ? "[Media]" : "[Message]")),
          senderId: new Types.ObjectId(senderId),
          type,
          timestamp: message.createdAt,
          isStealth,
          isE2ee,
          contentCipher: isE2ee || isStealth ? (options?.contentCipher || stealthPayload?.cipherText) : undefined,
          contentIv: isE2ee || isStealth ? (options?.contentIv || stealthPayload?.iv) : undefined,
          contentTag: isE2ee || isStealth ? (options?.contentTag || stealthPayload?.tag) : undefined,
          contentKeyVersion: options?.contentKeyVersion,
        };
      }
      conversation.updatedAt = new Date();
      await conversation.save();
    }
    const sender = await User.findById(senderId).select("anonimiId username profileImage");

    const recipientIds = conversation.participants
      .map((participant) => participant.toString())
      .filter((participantId) => participantId !== senderId);
    const archivedRecipientIds = await getArchivedRecipientIds(
      conversation._id.toString(),
      recipientIds
    );
    const mutedRecipientIds = recipientIds.filter((recipientId) =>
      isConversationMuted(conversation, recipientId)
    );
    const deliveredRecipientIds = isShadowDelivery
      ? []
      : recipientIds;
    const suppressedRecipients = new Set([
      ...(options?.suppressNotificationUserIds ?? []),
      ...Array.from(archivedRecipientIds),
      ...mutedRecipientIds,
    ]);

    for (const recipientIdStr of deliveredRecipientIds) {
      if (suppressedRecipients.has(recipientIdStr)) continue;

      await createAndEmitNotification({
        userId: recipientIdStr,
        type: "message_received",
        title: `New message from ${sender?.username ?? "a contact"}`,
        body: previewContent?.trim() ? previewContent.slice(0, 140) : "Sent you a message.",
        data: {
          conversationId: conversation._id.toString(),
          senderId,
          senderUsername: sender?.username ?? "Someone",
          senderProfileImage: sender?.profileImage ?? null,
          href: `/chat/${conversation._id.toString()}`,
        },
      });
    }

    const responseContent = isE2ee ? null : (isStealth ? trimmedContent : content);

    return {
      message: {
        id: message._id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.senderId?.toString(),
        type: message.type,
        content: responseContent,
        isStealth,
        isE2ee,
        contentCipher: message.contentCipher ?? null,
        contentIv: message.contentIv ?? null,
        contentTag: message.contentTag ?? null,
        contentKeyVersion: message.contentKeyVersion ?? null,
        stealthExpiresAt: stealthExpiresAt ?? null,
        stealthExpiredAt: null,
        contentLength: isStealth ? trimmedContent.length : null,
        mediaUrl: message.mediaUrl,
        fileName: message.fileName,
        fileSize: message.fileSize,
        replyToId: message.replyTo?.toString() ?? null,
        replyPreview: serializeReplyPreview(replyPreview),
        readBy: message.readBy.map((r: Types.ObjectId) => r.toString()),
        readByAt: serializeReadByAt(message.readByAt),
        reactions: serializeReactions(message.reactions, message.unsent),
        editHistory: serializeEditHistory(message.editHistory),
        editedAt: message.editedAt ?? null,
        editedBy: message.editedBy?.toString() ?? null,
        unsent: message.unsent,
        unsentAt: message.unsent ? message.updatedAt : null,
        createdAt: message.createdAt,
      },
      sender: {
        username: sender?.username,
        profileImage: sender?.profileImage,
      },
      deliveredRecipientIds,
      suppressedUnreadRecipientIds: Array.from(
        new Set([...Array.from(archivedRecipientIds), ...mutedRecipientIds])
      ),
    };
  }

  const groupForConversation = await Group.findOne({ conversationId: conversation._id }).select(
    "disbandedAt image name _id"
  );
  if (groupForConversation?.disbandedAt) {
    throw new ForbiddenError("This group has been disbanded. Messaging is disabled.");
  }

  if (groupForConversation?._id) {
    const membership = await GroupMember.findOne({
      groupId: groupForConversation._id,
      userId: new Types.ObjectId(senderId),
    }).select("mutedUntil");

    if (!membership) {
      throw new ForbiddenError("Not a member of this group");
    }

    if (membership?.mutedUntil && new Date(membership.mutedUntil).getTime() > Date.now()) {
      throw new ForbiddenError(
        `You are muted in this group until ${new Date(membership.mutedUntil).toLocaleString()}.`
      );
    }
  }

  const stealthExpiresAt = isStealth ? new Date(Date.now() + stealthDurationMs!) : undefined;
  const stealthPayload = isStealth ? encryptStealthContent(trimmedContent) : null;
  const isE2ee = !!options?.contentCipher;

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: new Types.ObjectId(senderId),
    type,
    content: isStealth || isE2ee ? undefined : content,
    isStealth,
    isE2ee,
    contentCipher: options?.contentCipher || stealthPayload?.cipherText,
    contentIv: options?.contentIv || stealthPayload?.iv,
    contentTag: options?.contentTag || stealthPayload?.tag,
    contentKeyVersion: options?.contentKeyVersion,
    searchTokens: isE2ee && options?.searchTokens?.length ? options.searchTokens : undefined,
    stealthExpiresAt,
    contentLength: isStealth ? trimmedContent.length : undefined,
    mediaUrl,
    fileName,
    fileSize,
    replyTo: replyPreview?.messageId,
    replyPreview: replyPreview ?? undefined,
    readBy: [new Types.ObjectId(senderId)],
    readByAt: { [senderId]: new Date() },
    unsent: false,
  } as any);

  if (message) {
    conversation.lastMessage = {
      content: isE2ee ? undefined : isStealth ? null : (content || (mediaUrl ? "[Media]" : "[Message]")),
      senderId: new Types.ObjectId(senderId),
      type,
      timestamp: message.createdAt,
      isStealth,
      isE2ee,
      contentCipher: isE2ee || isStealth ? (options?.contentCipher || stealthPayload?.cipherText) : undefined,
      contentIv: isE2ee || isStealth ? (options?.contentIv || stealthPayload?.iv) : undefined,
      contentTag: isE2ee || isStealth ? (options?.contentTag || stealthPayload?.tag) : undefined,
      contentKeyVersion: options?.contentKeyVersion,
    };
    conversation.updatedAt = new Date();
    await conversation.save();
  }

  const sender = await User.findById(senderId).select("anonimiId username profileImage");

  const recipientIds = conversation.participants
    .map((participant) => participant.toString())
    .filter((participantId) => participantId !== senderId);
  const archivedRecipientIds = await getArchivedRecipientIds(
    conversation._id.toString(),
    recipientIds
  );
  const mutedRecipientIds = recipientIds.filter((recipientId) =>
    isConversationMuted(conversation, recipientId)
  );
  const suppressedRecipients = new Set([
    ...(options?.suppressNotificationUserIds ?? []),
    ...Array.from(archivedRecipientIds),
    ...mutedRecipientIds,
  ]);

  for (const recipientIdStr of recipientIds) {
    if (suppressedRecipients.has(recipientIdStr)) continue;

    await createAndEmitNotification({
      userId: recipientIdStr,
      type: "message_received",
      title: `New message from ${sender?.username ?? "a contact"}`,
      body: previewContent?.trim() ? previewContent.slice(0, 140) : "Sent you a message.",
      data: {
        conversationId: conversation._id.toString(),
        senderId,
        senderUsername: sender?.username ?? "Someone",
        senderProfileImage: sender?.profileImage ?? null,
        groupImage: groupForConversation?.image ?? null,
        groupName: groupForConversation?.name ?? null,
        href: `/chat/${conversation._id.toString()}`,
      },
    });
  }

  const responseContent = isE2ee ? null : (isStealth ? trimmedContent : content);

  return {
    message: {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId?.toString(),
      type: message.type,
      content: responseContent,
      isStealth,
      isE2ee,
      contentCipher: (message as any).contentCipher ?? null,
      contentIv: (message as any).contentIv ?? null,
      contentTag: (message as any).contentTag ?? null,
      contentKeyVersion: (message as any).contentKeyVersion ?? null,
      stealthExpiresAt: (message as any).stealthExpiresAt?.toISOString() ?? null,
      stealthExpiredAt: null,
      contentLength: isStealth ? (trimmedContent?.length || 0) : null,
      mediaUrl: message.mediaUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      replyToId: message.replyTo?.toString() ?? null,
      replyPreview: serializeReplyPreview(replyPreview),
      readBy: message.readBy.map((r: Types.ObjectId) => r.toString()),
      readByAt: serializeReadByAt(message.readByAt),
      reactions: serializeReactions(message.reactions, message.unsent),
      editHistory: serializeEditHistory(message.editHistory),
      editedAt: message.editedAt ?? null,
      editedBy: message.editedBy?.toString() ?? null,
      unsent: message.unsent,
      unsentAt: message.unsent ? message.updatedAt : null,
      createdAt: message.createdAt,
    },
    sender: {
      username: sender?.username,
      profileImage: sender?.profileImage,
    },
    deliveredRecipientIds: recipientIds,
    suppressedUnreadRecipientIds: Array.from(
      new Set([...Array.from(archivedRecipientIds), ...mutedRecipientIds])
    ),
  };

};

export const archiveConversation = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await Conversation.findById(conversationId).select("participants");
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === userId
  );
  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  const archived = await ConversationArchive.findOneAndUpdate(
    {
      conversationId: conversation._id,
      userId: new Types.ObjectId(userId),
    },
    {
      $set: { archivedAt: new Date() },
      $unset: { deletedAt: "" },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  return {
    conversationId: conversation._id.toString(),
    archivedAt: archived?.archivedAt,
  };
};

export const unarchiveConversation = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await Conversation.findById(conversationId).select("participants");
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === userId
  );
  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  await clearConversationArchiveForUser(conversationId, userId);

  return {
    conversationId: conversation._id.toString(),
    unarchived: true,
  };
};

export const muteConversation = async (
  conversationId: string,
  userId: string,
  durationMinutes?: number
) => {
  const conversation = await Conversation.findById(conversationId).select(
    "participants mutedUsers"
  );
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === userId
  );
  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  const mutedUntil =
    typeof durationMinutes === "number" && durationMinutes > 0
      ? new Date(Date.now() + durationMinutes * 60 * 1000)
      : null;

  const existing = (conversation.mutedUsers ?? []).find(
    (entry: any) => entry.userId?.toString?.() === userId
  );

  if (existing) {
    existing.mutedUntil = mutedUntil ?? undefined;
  } else {
    conversation.mutedUsers = [
      ...(conversation.mutedUsers ?? []),
      { userId: new Types.ObjectId(userId), mutedUntil },
    ];
  }

  await conversation.save();

  emitToUser(userId, "conversation:unmuted", {
    conversationId: conversation._id.toString(),
  });

  return {
    conversationId: conversation._id.toString(),
    mutedUntil,
  };
};

export const unmuteConversation = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await Conversation.findById(conversationId).select(
    "participants mutedUsers"
  );
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === userId
  );
  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  conversation.mutedUsers = (conversation.mutedUsers ?? []).filter(
    (entry: any) => entry.userId?.toString?.() !== userId
  );
  await conversation.save();

  return {
    conversationId: conversation._id.toString(),
    muted: false,
  };
};

export const deleteMessageForMe = async (
  messageId: string,
  userId: string
) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  if (!message.deletedFor.includes(new Types.ObjectId(userId))) {
    message.deletedFor.push(new Types.ObjectId(userId));
    await message.save();
  }

  return { message: "Message deleted for you." };
};

export const deleteConversationForMe = async (
  conversationId: string,
  userId: string
) => {
  const conversation = await Conversation.findById(conversationId).select("participants");
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === userId
  );
  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  const userObjectId = new Types.ObjectId(userId);

  await Message.updateMany(
    { conversationId: conversation._id },
    { $addToSet: { deletedFor: userObjectId } }
  );

  // Keep delete-for-me scoped to message history only; do not persist
  // conversation-level hidden state so new activity can re-surface naturally.
  await clearConversationArchiveForUser(conversationId, userId);

  return {
    conversationId: conversation._id.toString(),
    deletedAt: new Date(),
  };
};

export const addMessageReaction = async (
  messageId: string,
  userId: string,
  emoji: string
) => {
  if (!isReactionEmoji(emoji)) {
    throw new ConflictError("Invalid reaction emoji");
  }

  const message = await Message.findById(messageId);
  if (!message) {
    throw new NotFoundError("Message not found");
  }

  if (message.unsent) {
    throw new ForbiddenError("Cannot react to an unsent message");
  }

  const conversation = await Conversation.findById(message.conversationId).select(
    "participants"
  );
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === userId
  );

  if (!isParticipant) {
    throw new ForbiddenError("Not a participant in this conversation");
  }

  const existing = message.reactions.find(
    (reaction) =>
      reaction.userId.toString() === userId && reaction.emoji === emoji
  );

  if (existing) {
    (message.reactions as any).pull(existing._id);
    await message.save();

    const payload = {
      action: "removed" as const,
      conversationId: message.conversationId.toString(),
      messageId: message._id.toString(),
      reactionId: existing._id.toString(),
    };

    emitToConversation(message.conversationId.toString(), "message:reaction:remove", {
      conversationId: payload.conversationId,
      messageId: payload.messageId,
      reactionId: payload.reactionId,
    });

    return payload;
  }

  message.reactions.push({
    emoji,
    userId: new Types.ObjectId(userId),
    createdAt: new Date(),
  } as any);
  await message.save();

  const added = message.reactions[message.reactions.length - 1];
  const reaction = serializeReaction(added as any);

  const payload = {
    action: "added" as const,
    conversationId: message.conversationId.toString(),
    messageId: message._id.toString(),
    reaction,
  };

  emitToConversation(message.conversationId.toString(), "message:reaction:add", payload);

  return payload;
};

export const removeMessageReaction = async (
  messageId: string,
  reactionId: string,
  userId: string
) => {
  const message = await Message.findById(messageId);
  if (!message) {
    throw new NotFoundError("Message not found");
  }

  const reaction = (message.reactions as any).id(reactionId);
  if (!reaction) {
    throw new NotFoundError("Reaction not found");
  }

  if (reaction.userId.toString() !== userId) {
    throw new ForbiddenError("Not the owner of this reaction");
  }

  (message.reactions as any).pull(reactionId);
  await message.save();

  const payload = {
    conversationId: message.conversationId.toString(),
    messageId: message._id.toString(),
    reactionId,
  };

  emitToConversation(message.conversationId.toString(), "message:reaction:remove", payload);

  return payload;
};

export const unsendMessage = async (
  messageId: string,
  senderId: string
) => {
  const message = await Message.findById(messageId);

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  if (message.senderId?.toString() !== senderId) {
    throw new ForbiddenError("Not the sender of this message");
  }

  if (message.isStealth) {
    throw new ForbiddenError("Cannot unsend a stealth message");
  }

  const hoursSinceSent = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceSent > 24) {
    throw new ForbiddenError("Unsend time window expired (24 hours)");
  }

  message.unsent = true;
  message.content = undefined;
  message.reactions = [];
  await message.save();

  // Broadcast to all conversation participants so every client updates in real-time
  emitToConversation(message.conversationId.toString(), "message:unsent", {
    conversationId: message.conversationId.toString(),
    messageId: message._id.toString(),
    unsentAt: message.updatedAt,
  });

  const conversation = await Conversation.findById(message.conversationId).select("participants");
  const recipientIds =
    conversation?.participants
      .map((participant) => participant.toString())
      .filter((participantId) => participantId !== senderId) ?? [];

  for (const recipientId of recipientIds) {
    await decrementMessageNotificationOnUnsend(recipientId, senderId);
  }

  return { message: "Message unsent." };
};

export const editMessage = async (
  messageId: string,
  editorId: string,
  content: string | null | undefined,
  options?: {
    contentCipher?: string;
    contentIv?: string;
    contentTag?: string;
    contentKeyVersion?: number;
  }
) => {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new NotFoundError("Message not found");
  }

  const message = await Message.findById(messageId);

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  if (message.senderId?.toString() !== editorId) {
    throw new ForbiddenError("Not the sender of this message");
  }

  if (message.isStealth) {
    throw new ForbiddenError("Cannot edit a stealth message");
  }

  if (message.unsent) {
    throw new ForbiddenError("Cannot edit an unsent message");
  }

  if (message.type !== "text") {
    throw new ForbiddenError("Only text messages can be edited");
  }

  const hoursSinceSent = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceSent > 24) {
    throw new ForbiddenError("Edit time window expired (24 hours)");
  }

  const isE2eeUpdate = !!options?.contentCipher;

  if (isE2eeUpdate && (!options?.contentIv || !options?.contentTag)) {
    throw new ForbiddenError("Encrypted edit payload is incomplete");
  }

  const trimmed = isE2eeUpdate ? "" : (content ?? "").trim();

  if (!isE2eeUpdate && !trimmed) {
    throw new ForbiddenError("Message content is required");
  }

  if (!isE2eeUpdate && trimmed === (message.content ?? "")) {
    return {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId?.toString(),
      type: message.type,
      content: message.content,
      mediaUrl: message.mediaUrl,
      fileName: message.fileName,
      fileSize: message.fileSize,
      readBy: message.readBy.map((r: Types.ObjectId) => r.toString()),
      readByAt: serializeReadByAt(message.readByAt),
      reactions: serializeReactions(message.reactions, message.unsent),
      editHistory: serializeEditHistory(message.editHistory),
      editedAt: message.editedAt ?? null,
      editedBy: message.editedBy?.toString() ?? null,
      unsent: message.unsent,
      unsentAt: message.unsent ? message.updatedAt : null,
      createdAt: message.createdAt,
    };
  }

  const editedAt = new Date();
  const historyEntry = {
    content: message.isE2ee ? null : (message.content ?? null),
    isE2ee: message.isE2ee ?? false,
    contentCipher: message.contentCipher ?? undefined,
    contentIv: message.contentIv ?? undefined,
    contentTag: message.contentTag ?? undefined,
    contentKeyVersion: message.contentKeyVersion ?? undefined,
    editedAt,
    editedBy: new Types.ObjectId(editorId),
  };

  message.editHistory = [...(message.editHistory ?? []), historyEntry];
  
  if (isE2eeUpdate) {
    message.content = undefined;
    message.isE2ee = true;
    message.contentCipher = options.contentCipher;
    message.contentIv = options?.contentIv;
    message.contentTag = options?.contentTag;
    message.contentKeyVersion = options?.contentKeyVersion;
  } else {
    message.content = trimmed;
    message.isE2ee = false;
    message.contentCipher = undefined;
    message.contentIv = undefined;
    message.contentTag = undefined;
    message.contentKeyVersion = undefined;
  }
  
  message.editedAt = editedAt;
  message.editedBy = new Types.ObjectId(editorId);
  await message.save();

  const lastMessageSet: Record<string, unknown> = {
    "lastMessage.content": isE2eeUpdate ? null : trimmed,
    "lastMessage.isE2ee": isE2eeUpdate,
  };
  const lastMessageUnset: Record<string, unknown> = {};

  if (isE2eeUpdate) {
    lastMessageSet["lastMessage.contentCipher"] = options?.contentCipher;
    lastMessageSet["lastMessage.contentIv"] = options?.contentIv;
    lastMessageSet["lastMessage.contentTag"] = options?.contentTag;
    lastMessageSet["lastMessage.contentKeyVersion"] =
      options?.contentKeyVersion ?? null;
  } else {
    lastMessageUnset["lastMessage.contentCipher"] = "";
    lastMessageUnset["lastMessage.contentIv"] = "";
    lastMessageUnset["lastMessage.contentTag"] = "";
    lastMessageUnset["lastMessage.contentKeyVersion"] = "";
  }

  await Conversation.collection.updateOne(
    {
      _id: message.conversationId,
      "lastMessage.senderId": message.senderId,
      "lastMessage.timestamp": message.createdAt,
    },
    Object.keys(lastMessageUnset).length
      ? {
          $set: lastMessageSet,
          $unset: lastMessageUnset,
        }
      : {
          $set: lastMessageSet,
        }
  );

  emitToConversation(message.conversationId.toString(), "message:edited", {
    messageId: message._id.toString(),
    conversationId: message.conversationId.toString(),
    content: isE2eeUpdate ? null : trimmed,
    editedAt: editedAt.toISOString(),
    editedBy: editorId,
    isE2ee: isE2eeUpdate,
    contentCipher: options?.contentCipher ?? null,
    contentIv: options?.contentIv ?? null,
    contentTag: options?.contentTag ?? null,
    contentKeyVersion: options?.contentKeyVersion ?? null,
    editHistory: serializeEditHistory(message.editHistory),
    createdAt: message.createdAt.toISOString(),
  });

  return {
    id: message._id.toString(),
    conversationId: message.conversationId.toString(),
    senderId: message.senderId?.toString(),
    type: message.type,
    content: message.content,
    isE2ee: message.isE2ee,
    contentCipher: message.contentCipher ?? null,
    contentIv: message.contentIv ?? null,
    contentTag: message.contentTag ?? null,
    contentKeyVersion: message.contentKeyVersion ?? null,
    mediaUrl: message.mediaUrl,
    fileName: message.fileName,
    fileSize: message.fileSize,
    readBy: message.readBy.map((r: Types.ObjectId) => r.toString()),
    readByAt: serializeReadByAt(message.readByAt),
    reactions: serializeReactions(message.reactions, message.unsent),
    editHistory: serializeEditHistory(message.editHistory),
    editedAt: message.editedAt ?? null,
    editedBy: message.editedBy?.toString() ?? null,
    unsent: message.unsent,
    unsentAt: message.unsent ? message.updatedAt : null,
    createdAt: message.createdAt,
  };
};

export const markMessagesAsRead = async (
  conversationId: string,
  messageIds: string[],
  userId: string
) => {
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
};
