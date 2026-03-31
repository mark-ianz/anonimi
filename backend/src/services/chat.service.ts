import { Types } from "mongoose";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { Contact } from "../models/contact.model";
import { MessageRequest } from "../models/messageRequest.model";
import { Block } from "../models/block.model";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/apiError";
import { MessageType } from "../types/enums";
import {
  emitToUser,
  emitToConversation,
  createAndEmitNotification,
  decrementMessageNotificationOnUnsend,
} from "./notification.service";

interface ConversationParticipant {
  id: string;
  echoId: string;
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
}

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

export const createOrGetConversation = async (
  userId: string,
  participantEchoId: string
) => {
  const participant = await User.findOne({ echoId: participantEchoId }).select(
    "_id echoId username profileImage"
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
    .populate("fromUserId", "echoId username profileImage onlineStatus")
    .populate("conversationId", "_id updatedAt lastMessage")
    .sort({ createdAt: -1 })
    .lean();

  return (requests as any[]).map((r) => ({
    id: r.conversationId._id.toString(),
    type: "private" as const,
    participant: {
      id: r.fromUserId._id.toString(),
      echoId: r.fromUserId.echoId,
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
  cursor?: string
) => {
  // Include conversations where user is the sender of an outgoing pending request.
  // The base filter excludes all "pending" convs (receiver inbox), but the sender
  // should still see their own pending outgoing requests in their chat list.
  const outgoingPendingConvIds = await MessageRequest.find({
    fromUserId: new Types.ObjectId(userId),
    status: "pending",
  }).distinct("conversationId");

  const query: Record<string, unknown> = {
    participants: new Types.ObjectId(userId),
  };

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
          "echoId username profileImage onlineStatus"
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
          senderId: { $ne: new Types.ObjectId(userId) },
          readBy: { $ne: new Types.ObjectId(userId) },
        });

        return {
          id: conv._id.toString(),
          type: conv.type,
          participant: {
            id: user?._id.toString(),
            echoId: user?.echoId,
            username: user?.username,
            nickname: contact?.nickname,
            contactId: contact?._id.toString() ?? null,
            blockId: myBlock?._id.toString() ?? null,
            blockedByMe: !!myBlock,
            profileImage: user?.profileImage,
            onlineStatus: user?.onlineStatus,
          },
          lastMessage: conv.lastMessage,
          unreadCount,
          requestStatus: conv.requestStatus ?? null,
          updatedAt: conv.updatedAt,
        };
      } else {
        const group = await Group.findOne({ conversationId: conv._id });
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
          senderId: { $ne: new Types.ObjectId(userId) },
          readBy: { $ne: new Types.ObjectId(userId) },
        });

        return {
          id: conv._id.toString(),
          type: conv.type,
          group: {
            id: group?._id.toString(),
            name: group?.name,
            image: group?.image,
            memberCount,
            fallbackProfileImages,
          },
          lastMessage: conv.lastMessage,
          unreadCount,
          requestStatus: null,
          updatedAt: conv.updatedAt,
        };
      }
    })
  );

  return {
    conversations: enriched,
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
      "echoId username profileImage onlineStatus"
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

    return {
      id: conversation._id.toString(),
      type: conversation.type,
      participant: {
        id: user?._id.toString(),
        echoId: user?.echoId,
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

    return {
      id: conversation._id.toString(),
      type: conversation.type,
      group: {
        id: group?._id.toString(),
        name: group?.name,
        image: group?.image,
        memberCount,
        fallbackProfileImages,
      },
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
    messages: data.map((m: any) => ({
      id: m._id.toString(),
      conversationId: m.conversationId.toString(),
      senderId: m.senderId?.toString(),
      type: m.type,
      content: m.unsent ? null : m.content,
      mediaUrl: m.mediaUrl,
      fileName: m.fileName,
      fileSize: m.fileSize,
      readBy: m.readBy.map((r: Types.ObjectId) => r.toString()),
      readByAt: serializeReadByAt(m.readByAt),
      unsent: m.unsent,
      unsentAt: m.unsent ? m.updatedAt : null,
      createdAt: m.createdAt,
    })),
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
          "echoId username profileImage"
        );
        emitToUser(recipientId!.toString(), "message-request:new", {
          requestId: newRequest._id.toString(),
          conversationId: conversation._id.toString(),
          from: {
            id: senderId,
            echoId: senderForNotif?.echoId,
            username: senderForNotif?.username,
            profileImage: senderForNotif?.profileImage ?? null,
          },
          preview: {
            content,
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
          "echoId username profileImage"
        );
        emitToUser(existingRequest.fromUserId.toString(), "message-request:accepted", {
          requestId: existingRequest._id.toString(),
          conversationId: conversation._id.toString(),
          acceptedBy: {
            id: senderId,
            echoId: senderForAccept?.echoId,
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

    const message = await Message.create({
      conversationId: conversation._id,
      senderId: new Types.ObjectId(senderId),
      type,
      content,
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
        content: content || (mediaUrl ? "[Media]" : "[Message]"),
        senderId: new Types.ObjectId(senderId),
        type,
        timestamp: message.createdAt,
      };
      conversation.updatedAt = new Date();
      await conversation.save();
    }
    const sender = await User.findById(senderId).select("echoId username profileImage");

    const recipientIds = conversation.participants
      .map((participant) => participant.toString())
      .filter((participantId) => participantId !== senderId);
    const deliveredRecipientIds = isShadowDelivery ? [] : recipientIds;
    const suppressedRecipients = new Set(options?.suppressNotificationUserIds ?? []);

    for (const recipientIdStr of deliveredRecipientIds) {
      if (suppressedRecipients.has(recipientIdStr)) continue;

      await createAndEmitNotification({
        userId: recipientIdStr,
        type: "message_received",
        title: `New message from ${sender?.username ?? "a contact"}`,
        body: content?.trim() ? content.slice(0, 140) : "Sent you a message.",
        data: {
          conversationId: conversation._id.toString(),
          senderId,
          senderUsername: sender?.username ?? "Someone",
          href: `/chat/${conversation._id.toString()}`,
        },
      });
    }

    return {
      message: {
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
        unsent: message.unsent,
        unsentAt: message.unsent ? message.updatedAt : null,
        createdAt: message.createdAt,
      },
      sender: {
        username: sender?.username,
        profileImage: sender?.profileImage,
      },
      deliveredRecipientIds,
    };
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: new Types.ObjectId(senderId),
    type,
    content,
    mediaUrl,
    fileName,
    fileSize,
    readBy: [new Types.ObjectId(senderId)],
    readByAt: { [senderId]: new Date() },
    unsent: false,
  });

  conversation.lastMessage = {
    content: content || (mediaUrl ? "[Media]" : "[Message]"),
    senderId: new Types.ObjectId(senderId),
    type,
    timestamp: message.createdAt,
  };
  conversation.updatedAt = new Date();
  await conversation.save();

  const sender = await User.findById(senderId).select("echoId username profileImage");

  const recipientIds = conversation.participants
    .map((participant) => participant.toString())
    .filter((participantId) => participantId !== senderId);
  const suppressedRecipients = new Set(options?.suppressNotificationUserIds ?? []);

  for (const recipientIdStr of recipientIds) {
    if (suppressedRecipients.has(recipientIdStr)) continue;

    await createAndEmitNotification({
      userId: recipientIdStr,
      type: "message_received",
      title: `New message from ${sender?.username ?? "a contact"}`,
      body: content?.trim() ? content.slice(0, 140) : "Sent you a message.",
      data: {
        conversationId: conversation._id.toString(),
        senderId,
        senderUsername: sender?.username ?? "Someone",
        href: `/chat/${conversation._id.toString()}`,
      },
    });
  }

  return {
    message: {
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
      unsent: message.unsent,
      unsentAt: message.unsent ? message.updatedAt : null,
      createdAt: message.createdAt,
    },
    sender: {
      username: sender?.username,
      profileImage: sender?.profileImage,
    },
    deliveredRecipientIds: recipientIds,
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

  const hoursSinceSent = (Date.now() - message.createdAt.getTime()) / (1000 * 60 * 60);
  if (hoursSinceSent > 24) {
    throw new ForbiddenError("Unsend time window expired (24 hours)");
  }

  message.unsent = true;
  message.content = undefined;
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
