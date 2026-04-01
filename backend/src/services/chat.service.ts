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
  blockId?: string | null;
  blockedByMe?: boolean;
  profileImage: string | null;
  onlineStatus: string;
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
  history: Array<{ content: string; editedAt: Date; editedBy: Types.ObjectId }> | undefined
) =>
  (history ?? []).map((entry) => ({
    content: entry.content,
    editedAt: entry.editedAt,
    editedBy: entry.editedBy?.toString(),
  }));

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
    if (message.stealthContentCipher && message.stealthContentIv && message.stealthContentTag) {
      content = decryptStealthContent(
        message.stealthContentCipher,
        message.stealthContentIv,
        message.stealthContentTag
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
    stealthContentLength: message.stealthContentLength ?? (content ? content.length : 0),
  };
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
    .populate("fromUserId", "anonimiId username profileImage onlineStatus")
    .populate("conversationId", "_id updatedAt lastMessage")
    .sort({ createdAt: -1 })
    .lean();

  return (requests as any[]).map((r) => ({
    id: r.conversationId._id.toString(),
    type: "private" as const,
    participant: {
      id: r.fromUserId._id.toString(),
      anonimiId: r.fromUserId.anonimiId,
      username: r.fromUserId.username,
      nickname: null,
      profileImage: r.fromUserId.profileImage ?? null,
      onlineStatus: r.fromUserId.onlineStatus ?? "offline",
    },
    lastMessage: r.conversationId.lastMessage ?? null,
    requestStatus: "pending",
    requestId: r._id.toString(),
    unreadCount: 0,
    updatedAt: r.conversationId.updatedAt,
  }));
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
          "anonimiId username profileImage onlineStatus"
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

        const unreadCount = await Message.countDocuments({
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
          .select("senderId type content createdAt")
          .lean();

        const lastMessageSender = latestVisibleMessage?.senderId
          ? await User.findById(latestVisibleMessage.senderId).select("username").lean()
          : null;

        return {
          id: conv._id.toString(),
          type: conv.type,
          isArchived: archivedConvIdSet.has(conv._id.toString()),
          participant: {
            id: user?._id.toString(),
            anonimiId: user?.anonimiId,
            username: user?.username,
            nickname: contact?.nickname,
            contactId: contact?._id.toString() ?? null,
            blockId: myBlock?._id.toString() ?? null,
            blockedByMe: !!myBlock,
            profileImage: user?.profileImage,
            onlineStatus: user?.onlineStatus,
          },
          lastMessage: latestVisibleMessage
            ? {
                content: latestVisibleMessage.content,
                senderId: latestVisibleMessage.senderId?.toString(),
                type: latestVisibleMessage.type,
                timestamp: latestVisibleMessage.createdAt,
                senderUsername: lastMessageSender?.username,
              }
            : null,
          unreadCount,
          requestStatus: conv.requestStatus ?? null,
          updatedAt: conv.updatedAt,
        };
      } else {
        const group = await Group.findOne({ conversationId: conv._id });
        if (!group) {
          return null;
        }
        const memberCount = await GroupMember.countDocuments({
          groupId: group?._id,
        });
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

        const unreadCount = await Message.countDocuments({
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
          .select("senderId type content createdAt")
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
                content: latestVisibleMessage.content,
                senderId: latestVisibleMessage.senderId?.toString(),
                type: latestVisibleMessage.type,
                timestamp: latestVisibleMessage.createdAt,
                senderUsername: lastMessageSender?.username,
              }
            : null,
          unreadCount,
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
      "anonimiId username profileImage onlineStatus"
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

    return {
      id: conversation._id.toString(),
      type: conversation.type,
      isArchived: !!archivedRow,
      participant: {
        id: user?._id.toString(),
        anonimiId: user?.anonimiId,
        username: user?.username,
        nickname: contact?.nickname,
        contactId: contact?._id.toString() ?? null,
        blockId: myBlock?._id.toString() ?? null,
        blockedByMe: !!myBlock,
        profileImage: user?.profileImage,
        onlineStatus: user?.onlineStatus,
      },
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

    const lastMessageSender = conversation.lastMessage?.senderId
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
      group: {
        id: group?._id.toString(),
        name: group?.name,
        image: group?.image,
        memberCount,
        fallbackProfileImages,
        disbandedAt: group?.disbandedAt ?? null,
      },
      lastMessage: conversation.lastMessage
        ? {
            ...conversation.lastMessage,
            senderUsername: lastMessageSender?.username,
          }
        : null,
      requestStatus: conversation.requestStatus,
      createdAt: conversation.createdAt,
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
        mediaUrl: m.mediaUrl,
        fileName: m.fileName,
        fileSize: m.fileSize,
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
  query: string,
  limit: number = 20,
  cursor?: string
) => {
  const trimmed = query.trim();
  if (!trimmed) {
    return {
      messages: [],
      nextCursor: undefined,
      hasMore: false,
      limit,
    };
  }

  const userObjectId = new Types.ObjectId(userId);

  const conversations = await Conversation.find({ participants: userObjectId })
    .select("_id type participants")
    .lean();

  if (!conversations.length) {
    return {
      messages: [],
      nextCursor: undefined,
      hasMore: false,
      limit,
    };
  }

  const conversationIds = conversations.map((conv: any) => conv._id);
  const queryRegex = new RegExp(escapeRegex(trimmed), "i");

  const messageQuery: Record<string, unknown> = {
    conversationId: { $in: conversationIds },
    deletedFor: { $ne: userObjectId },
    unsent: false,
    isStealth: { $ne: true },
    type: "text",
    content: { $regex: queryRegex },
  };

  if (cursor) {
    messageQuery._id = { $lt: new Types.ObjectId(cursor) };
  }

  const messages = await Message.find(messageQuery)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;

  const conversationIdSet = new Set(
    data.map((message: any) => message.conversationId.toString())
  );
  const relevantConversations = conversations.filter((conv: any) =>
    conversationIdSet.has(conv._id.toString())
  );

  const privateConversations = relevantConversations.filter(
    (conv: any) => conv.type === "private"
  );
  const groupConversations = relevantConversations.filter(
    (conv: any) => conv.type === "group"
  );

  const otherUserIds = privateConversations
    .map((conv: any) =>
      conv.participants.find((p: Types.ObjectId) => p.toString() !== userId)
    )
    .filter(Boolean)
    .map((id: Types.ObjectId) => id.toString());

  const uniqueOtherUserIds = Array.from(new Set(otherUserIds));

  const [otherUsers, contacts, groups] = await Promise.all([
    uniqueOtherUserIds.length
      ? User.find({ _id: { $in: uniqueOtherUserIds } })
          .select("anonimiId username profileImage")
          .lean()
      : [],
    uniqueOtherUserIds.length
      ? Contact.find({
          userId: userObjectId,
          contactId: { $in: uniqueOtherUserIds },
          status: "accepted",
        })
          .select("contactId nickname")
          .lean()
      : [],
    groupConversations.length
      ? Group.find({
          conversationId: { $in: groupConversations.map((conv: any) => conv._id) },
        })
          .select("conversationId name image")
          .lean()
      : [],
  ]);

  const otherUsersById = new Map(
    (otherUsers as any[]).map((user) => [user._id.toString(), user])
  );
  const contactsByUserId = new Map(
    (contacts as any[]).map((contact) => [contact.contactId.toString(), contact])
  );
  const groupByConversationId = new Map(
    (groups as any[]).map((group) => [group.conversationId.toString(), group])
  );

  const groupFallbackImagesByConversationId = new Map<string, Array<string | null>>();
  await Promise.all(
    (groups as any[]).map(async (group) => {
      const members = await GroupMember.find({ groupId: group._id })
        .sort({ joinedAt: 1 })
        .limit(3)
        .populate("userId", "profileImage")
        .lean();
      const images = members.map((member: any) => member.userId?.profileImage ?? null);
      groupFallbackImagesByConversationId.set(group.conversationId.toString(), images);
    })
  );

  const senderIds = Array.from(
    new Set(
      data
        .map((message: any) => message.senderId?.toString())
        .filter(Boolean)
    )
  ) as string[];

  const senders = senderIds.length
    ? await User.find({ _id: { $in: senderIds } })
        .select("anonimiId username profileImage")
        .lean()
    : [];
  const sendersById = new Map(
    (senders as any[]).map((sender) => [sender._id.toString(), sender])
  );

  const conversationMetaById = new Map(
    relevantConversations.map((conv: any) => {
      if (conv.type === "private") {
        const otherId = conv.participants.find(
          (p: Types.ObjectId) => p.toString() !== userId
        );
        const otherUser = otherId ? otherUsersById.get(otherId.toString()) : null;
        const contact = otherId ? contactsByUserId.get(otherId.toString()) : null;
        const name = contact?.nickname?.trim() || otherUser?.username || otherUser?.anonimiId || "Conversation";
        return [
          conv._id.toString(),
          {
            id: conv._id.toString(),
            type: "private",
            name,
            image: otherUser?.profileImage ?? null,
            fallbackProfileImages: [],
          },
        ];
      }

      const group = groupByConversationId.get(conv._id.toString());
      return [
        conv._id.toString(),
        {
          id: conv._id.toString(),
          type: "group",
          name: group?.name ?? "Group",
          image: group?.image ?? null,
          fallbackProfileImages:
            groupFallbackImagesByConversationId.get(conv._id.toString()) ?? [],
        },
      ];
    })
  );

  const formatted = data.map((message: any) => {
    const conversationMeta = conversationMetaById.get(
      message.conversationId.toString()
    );
    const sender = message.senderId
      ? sendersById.get(message.senderId.toString())
      : null;

    return {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId?.toString() ?? null,
      senderUsername: sender?.username ?? null,
      senderAnonimiId: sender?.anonimiId ?? null,
      senderProfileImage: sender?.profileImage ?? null,
      type: message.type,
      content: message.content ?? null,
      createdAt: message.createdAt,
      conversationType: conversationMeta?.type ?? "private",
      conversationName: conversationMeta?.name ?? "Conversation",
      conversationImage: conversationMeta?.image ?? null,
      conversationFallbackImages: conversationMeta?.fallbackProfileImages ?? [],
    };
  });

  return {
    messages: formatted,
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
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
      (p) => p.toString() !== senderId
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

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: new Types.ObjectId(senderId),
      type,
      content: isStealth ? undefined : content,
      isStealth,
      stealthExpiresAt,
      stealthContentCipher: stealthPayload?.cipherText,
      stealthContentIv: stealthPayload?.iv,
      stealthContentTag: stealthPayload?.tag,
      stealthContentLength: isStealth ? trimmedContent.length : undefined,
      mediaUrl,
      fileName,
      fileSize,
      readBy: [new Types.ObjectId(senderId)],
      readByAt: { [senderId]: new Date() },
      deletedFor: isShadowDelivery ? [recipientId] : [],
      unsent: false,
    });

    if (!isShadowDelivery) {
      conversation.lastMessage = {
        content: isStealth ? "[Stealth]" : (content || (mediaUrl ? "[Media]" : "[Message]")),
        senderId: new Types.ObjectId(senderId),
        type,
        timestamp: message.createdAt,
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
    const deliveredRecipientIds = isShadowDelivery
      ? []
      : recipientIds;
    const suppressedRecipients = new Set([
      ...(options?.suppressNotificationUserIds ?? []),
      ...Array.from(archivedRecipientIds),
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

    const responseContent = isStealth ? trimmedContent : content;

    return {
      message: {
        id: message._id.toString(),
        conversationId: message.conversationId.toString(),
        senderId: message.senderId?.toString(),
        type: message.type,
        content: responseContent,
        isStealth,
        stealthExpiresAt: stealthExpiresAt ?? null,
        stealthExpiredAt: null,
        stealthContentLength: isStealth ? trimmedContent.length : null,
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
      },
      sender: {
        username: sender?.username,
        profileImage: sender?.profileImage,
      },
      deliveredRecipientIds,
      suppressedUnreadRecipientIds: Array.from(archivedRecipientIds),
    };
  }

  const groupForConversation = await Group.findOne({ conversationId: conversation._id }).select(
    "disbandedAt image name"
  );
  if (groupForConversation?.disbandedAt) {
    throw new ForbiddenError("This group has been disbanded. Messaging is disabled.");
  }

  const stealthExpiresAt = isStealth ? new Date(Date.now() + stealthDurationMs!) : undefined;
  const stealthPayload = isStealth ? encryptStealthContent(trimmedContent) : null;

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: new Types.ObjectId(senderId),
    type,
    content: isStealth ? undefined : content,
    isStealth,
    stealthExpiresAt,
    stealthContentCipher: stealthPayload?.cipherText,
    stealthContentIv: stealthPayload?.iv,
    stealthContentTag: stealthPayload?.tag,
    stealthContentLength: isStealth ? trimmedContent.length : undefined,
    mediaUrl,
    fileName,
    fileSize,
    readBy: [new Types.ObjectId(senderId)],
    readByAt: { [senderId]: new Date() },
    unsent: false,
  });

  conversation.lastMessage = {
    content: isStealth ? "[Stealth]" : (content || (mediaUrl ? "[Media]" : "[Message]")),
    senderId: new Types.ObjectId(senderId),
    type,
    timestamp: message.createdAt,
  };
  conversation.updatedAt = new Date();
  await conversation.save();

  const sender = await User.findById(senderId).select("anonimiId username profileImage");

  const recipientIds = conversation.participants
    .map((participant) => participant.toString())
    .filter((participantId) => participantId !== senderId);
  const archivedRecipientIds = await getArchivedRecipientIds(
    conversation._id.toString(),
    recipientIds
  );
  const suppressedRecipients = new Set([
    ...(options?.suppressNotificationUserIds ?? []),
    ...Array.from(archivedRecipientIds),
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

  const responseContent = isStealth ? trimmedContent : content;

  return {
    message: {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId?.toString(),
      type: message.type,
      content: responseContent,
      isStealth,
      stealthExpiresAt: stealthExpiresAt ?? null,
      stealthExpiredAt: null,
      stealthContentLength: isStealth ? trimmedContent.length : null,
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
    },
    sender: {
      username: sender?.username,
      profileImage: sender?.profileImage,
    },
    deliveredRecipientIds: recipientIds,
    suppressedUnreadRecipientIds: Array.from(archivedRecipientIds),
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
    message.reactions.pull(existing._id);
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
  });
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

  const reaction = message.reactions.id(reactionId);
  if (!reaction) {
    throw new NotFoundError("Reaction not found");
  }

  if (reaction.userId.toString() !== userId) {
    throw new ForbiddenError("Not the owner of this reaction");
  }

  message.reactions.pull(reactionId);
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
  content: string
) => {
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

  const trimmed = content.trim();
  if (trimmed === (message.content ?? "")) {
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
    content: message.content ?? "",
    editedAt,
    editedBy: new Types.ObjectId(editorId),
  };

  message.editHistory = [...(message.editHistory ?? []), historyEntry];
  message.content = trimmed;
  message.editedAt = editedAt;
  message.editedBy = new Types.ObjectId(editorId);
  await message.save();

  await Conversation.collection.updateOne(
    {
      _id: message.conversationId,
      "lastMessage.senderId": message.senderId,
      "lastMessage.timestamp": message.createdAt,
    },
    {
      $set: {
        "lastMessage.content": trimmed,
      },
    }
  );

  emitToConversation(message.conversationId.toString(), "message:edited", {
    messageId: message._id.toString(),
    conversationId: message.conversationId.toString(),
    content: trimmed,
    editedAt: editedAt.toISOString(),
    editedBy: editorId,
    editHistory: serializeEditHistory(message.editHistory),
    createdAt: message.createdAt.toISOString(),
  });

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
