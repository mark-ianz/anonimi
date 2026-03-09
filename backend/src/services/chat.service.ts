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
import { emitToUser, emitToConversation } from "./notification.service";

interface ConversationParticipant {
  id: string;
  echoId: string;
  username: string;
  nickname?: string;
  profileImage: string | null;
  onlineStatus: string;
}

interface LastMessage {
  content: string;
  senderId: string;
  type: string;
  timestamp: Date;
}

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

  const isBlocked = await Block.findOne({
    $or: [
      { blockerId: new Types.ObjectId(userId), blockedId: participant._id, active: true },
      { blockerId: participant._id, blockedId: new Types.ObjectId(userId), active: true },
    ],
  });
  if (isBlocked) throw new ForbiddenError("Cannot create conversation with this user");

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
  const query: Record<string, unknown> = {
    participants: new Types.ObjectId(userId),
    // Exclude pending/ignored requests from the main inbox
    requestStatus: { $in: [null, "accepted"] },
  };

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

    return {
      id: conversation._id.toString(),
      type: conversation.type,
      group: {
        id: group?._id.toString(),
        name: group?.name,
        image: group?.image,
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
      unsent: m.unsent,
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
  fileSize?: number
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

    const isBlocked = await Block.findOne({
      $or: [
        { blockerId: senderId, blockedId: recipientId, active: true },
        { blockerId: recipientId, blockedId: senderId, active: true },
      ],
    });

    if (isBlocked) {
      throw new ForbiddenError("Cannot send message to this user");
    }

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

  return {
    message: {
      id: message._id.toString(),
      conversationId: message.conversationId.toString(),
      senderId: message.senderId?.toString(),
      type: message.type,
      content: message.content,
      mediaUrl: message.mediaUrl,
      createdAt: message.createdAt,
    },
    sender: {
      username: sender?.username,
      profileImage: sender?.profileImage,
    },
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
  });

  return { message: "Message unsent." };
};

export const markMessagesAsRead = async (
  conversationId: string,
  messageIds: string[],
  userId: string
) => {
  await Message.updateMany(
    {
      _id: { $in: messageIds.map((id) => new Types.ObjectId(id)) },
      conversationId: new Types.ObjectId(conversationId),
    },
    { $addToSet: { readBy: new Types.ObjectId(userId) } }
  );
};
