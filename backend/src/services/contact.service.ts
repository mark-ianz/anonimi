import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Contact } from "../models/contact.model";
import { Block } from "../models/block.model";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { NotFoundError, ConflictError, ForbiddenError } from "../utils/apiError";
import { emitToUser } from "./notification.service";
import { MessageType } from "../types/enums";

export const getContacts = async (
  userId: string,
  status: "accepted" | "pending" = "accepted",
  limit: number = 50,
  cursor?: string
) => {
  const query: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
    status,
  };

  if (cursor) {
    query._id = { $gt: new Types.ObjectId(cursor) };
  }

  const contacts = await Contact.find(query)
    .populate("contactId", "echoId username profileImage onlineStatus lastSeen")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = contacts.length > limit;
  const data = hasMore ? contacts.slice(0, limit) : contacts;

  return {
    contacts: data.map((c: any) => ({
      contactId: c.contactId._id.toString(),
      echoId: c.contactId.echoId,
      username: c.contactId.username,
      nickname: c.nickname,
      profileImage: c.contactId.profileImage,
      onlineStatus: c.contactId.onlineStatus,
      lastSeen: c.contactId.lastSeen,
      status: c.status,
      createdAt: c.createdAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getIncomingRequests = async (userId: string) => {
  const contacts = await Contact.find({
    contactId: new Types.ObjectId(userId),
    status: "pending",
  })
    .populate("userId", "echoId username profileImage")
    .sort({ createdAt: -1 })
    .lean();

  return contacts.map((c: any) => ({
    requestId: c._id.toString(),
    from: {
      id: c.userId._id.toString(),
      echoId: c.userId.echoId,
      username: c.userId.username,
      profileImage: c.userId.profileImage,
    },
    createdAt: c.createdAt,
  }));
};

export const sendContactRequest = async (
  fromUserId: string,
  targetEchoId: string
) => {
  const targetUser = await User.findOne({ echoId: targetEchoId });

  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  if (targetUser._id.toString() === fromUserId) {
    throw new ConflictError("Cannot send request to yourself");
  }

  const existingBlock = await Block.findOne({
    $or: [
      { blockerId: fromUserId, blockedId: targetUser._id, active: true },
      { blockerId: targetUser._id, blockedId: fromUserId, active: true },
    ],
  });

  if (existingBlock) {
    throw new ForbiddenError("Cannot send contact request");
  }

  const existingContact = await Contact.findOne({
    $or: [
      { userId: fromUserId, contactId: targetUser._id },
      { userId: targetUser._id, contactId: fromUserId },
    ],
  });

  if (existingContact) {
    if (existingContact.status === "accepted") {
      throw new ConflictError("Already contacts");
    }
    if (existingContact.status === "pending") {
      throw new ConflictError("Request already pending");
    }
  }

  await Contact.create({
    userId: new Types.ObjectId(fromUserId),
    contactId: targetUser._id,
    status: "pending",
  });

  return {
    status: "pending",
    message: "Contact request sent.",
  };
};

export const acceptContactRequest = async (
  userId: string,
  contactId: string
) => {
  const contact = await Contact.findOne({
    _id: new Types.ObjectId(contactId),
    contactId: new Types.ObjectId(userId),
    status: "pending",
  });

  if (!contact) {
    throw new NotFoundError("Contact request not found");
  }

  contact.status = "accepted";
  await contact.save();

  await Contact.create({
    userId: new Types.ObjectId(userId),
    contactId: contact.userId,
    status: "accepted",
  });

  return {
    status: "accepted",
    message: "Contact added.",
  };
};

export const getContactRequestOwner = async (userId: string, contactId: string) => {
  const contact = await Contact.findOne({
    _id: new Types.ObjectId(contactId),
    contactId: new Types.ObjectId(userId),
    status: "pending",
  }).select("userId");

  if (!contact) {
    return null;
  }

  return {
    userId: contact.userId.toString(),
  };
};

export const declineContactRequest = async (
  userId: string,
  contactId: string
) => {
  const contact = await Contact.findOneAndUpdate(
    {
      _id: new Types.ObjectId(contactId),
      contactId: new Types.ObjectId(userId),
      status: "pending",
    },
    { status: "declined" },
    { new: true }
  );

  if (!contact) {
    throw new NotFoundError("Contact request not found");
  }

  return {
    status: "declined",
    message: "Contact request declined.",
  };
};

export const removeContact = async (
  userId: string,
  contactId: string
) => {
  await Contact.deleteMany({
    $or: [
      { userId: new Types.ObjectId(userId), contactId: new Types.ObjectId(contactId) },
      { userId: new Types.ObjectId(contactId), contactId: new Types.ObjectId(userId) },
    ],
  });

  return { message: "Contact removed" };
};

export const updateNickname = async (
  userId: string,
  contactId: string,
  nickname: string | null
) => {
  if (!Types.ObjectId.isValid(contactId)) {
    throw new NotFoundError("Contact not found");
  }

  const contactObjectId = new Types.ObjectId(contactId);

  const contact = await Contact.findOneAndUpdate(
    {
      userId: new Types.ObjectId(userId),
      status: "accepted",
      $or: [{ _id: contactObjectId }, { contactId: contactObjectId }],
    },
    { nickname },
    { new: true }
  );

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  const targetUserId = contact.contactId.toString();

  const [actorUser, targetUser, privateConversation] = await Promise.all([
    User.findById(userId).select("username profileImage"),
    User.findById(targetUserId).select("username"),
    Conversation.findOne({
      type: "private",
      participants: {
        $all: [new Types.ObjectId(userId), new Types.ObjectId(targetUserId)],
      },
    }),
  ]);

  const reciprocalContact = await Contact.findOne({
    userId: new Types.ObjectId(targetUserId),
    contactId: new Types.ObjectId(userId),
    status: "accepted",
  }).select("nickname");

  const actorName = actorUser?.username ?? "Someone";
  const actorNameForTarget = reciprocalContact?.nickname?.trim() || actorName;
  const targetName = targetUser?.username ?? "user";

  if (privateConversation) {
    const myContent = nickname
      ? `You set the nickname for ${targetName} to ${nickname}.`
      : `You cleared the nickname for ${targetName}.`;
    const theirContent = nickname
      ? `${actorNameForTarget} set your nickname to ${nickname}.`
      : `${actorNameForTarget} cleared your nickname.`;

    const [mySystemMessage, theirSystemMessage] = await Message.create([
      {
        conversationId: privateConversation._id,
        senderId: new Types.ObjectId(userId),
        type: MessageType.SYSTEM,
        content: myContent,
        readBy: [new Types.ObjectId(userId)],
        readByAt: { [userId]: new Date() },
        deletedFor: [new Types.ObjectId(targetUserId)],
        unsent: false,
      },
      {
        conversationId: privateConversation._id,
        senderId: new Types.ObjectId(userId),
        type: MessageType.SYSTEM,
        content: theirContent,
        readBy: [new Types.ObjectId(userId)],
        readByAt: { [userId]: new Date() },
        deletedFor: [new Types.ObjectId(userId)],
        unsent: false,
      },
    ]);

    privateConversation.lastMessage = {
      content: "Nickname updated",
      senderId: new Types.ObjectId(userId),
      type: MessageType.SYSTEM,
      timestamp: theirSystemMessage.createdAt,
    };
    privateConversation.updatedAt = new Date();
    await privateConversation.save();

    emitToUser(targetUserId, "message:receive", {
      messageId: theirSystemMessage._id.toString(),
      conversationId: privateConversation._id.toString(),
      senderId: userId,
      senderUsername: actorName,
      senderProfileImage: actorUser?.profileImage ?? null,
      type: MessageType.SYSTEM,
      content: theirSystemMessage.content,
      mediaUrl: null,
      fileName: null,
      fileSize: null,
      timestamp: theirSystemMessage.createdAt.toISOString(),
    });

    emitToUser(userId, "message:receive", {
      messageId: mySystemMessage._id.toString(),
      conversationId: privateConversation._id.toString(),
      senderId: userId,
      senderUsername: actorName,
      senderProfileImage: actorUser?.profileImage ?? null,
      type: MessageType.SYSTEM,
      content: mySystemMessage.content,
      mediaUrl: null,
      fileName: null,
      fileSize: null,
      timestamp: mySystemMessage.createdAt.toISOString(),
    });

    emitToUser(userId, "contact:nickname-updated", {
      conversationId: privateConversation._id.toString(),
    });
    emitToUser(targetUserId, "contact:nickname-updated", {
      conversationId: privateConversation._id.toString(),
    });
  }

  return {
    contactId: contact.contactId.toString(),
    nickname: contact.nickname,
  };
};

export const updateOwnNickname = async (
  userId: string,
  contactId: string,
  nickname: string | null
) => {
  if (!Types.ObjectId.isValid(contactId)) {
    throw new NotFoundError("Contact not found");
  }

  const contactObjectId = new Types.ObjectId(contactId);

  const myContact = await Contact.findOne({
    userId: new Types.ObjectId(userId),
    status: "accepted",
    $or: [{ _id: contactObjectId }, { contactId: contactObjectId }],
  });

  if (!myContact) {
    throw new NotFoundError("Contact not found");
  }

  const targetUserId = myContact.contactId.toString();

  const reciprocalContact = await Contact.findOneAndUpdate(
    {
      userId: new Types.ObjectId(targetUserId),
      contactId: new Types.ObjectId(userId),
      status: "accepted",
    },
    { nickname },
    { new: true }
  );

  if (!reciprocalContact) {
    throw new NotFoundError("Contact not found");
  }

  const [actorUser, privateConversation] = await Promise.all([
    User.findById(userId).select("username profileImage"),
    Conversation.findOne({
      type: "private",
      participants: {
        $all: [new Types.ObjectId(userId), new Types.ObjectId(targetUserId)],
      },
    }),
  ]);

  const actorName = actorUser?.username ?? "Someone";
  const actorNameForTarget = reciprocalContact.nickname?.trim() || actorName;

  if (privateConversation) {
    const myContent = nickname
      ? `You set your nickname to ${nickname}.`
      : "You cleared your nickname.";
    const theirContent = nickname
      ? `${actorNameForTarget} set their nickname to ${nickname}.`
      : `${actorNameForTarget} cleared their nickname.`;

    const [mySystemMessage, theirSystemMessage] = await Message.create([
      {
        conversationId: privateConversation._id,
        senderId: new Types.ObjectId(userId),
        type: MessageType.SYSTEM,
        content: myContent,
        readBy: [new Types.ObjectId(userId)],
        readByAt: { [userId]: new Date() },
        deletedFor: [new Types.ObjectId(targetUserId)],
        unsent: false,
      },
      {
        conversationId: privateConversation._id,
        senderId: new Types.ObjectId(userId),
        type: MessageType.SYSTEM,
        content: theirContent,
        readBy: [new Types.ObjectId(userId)],
        readByAt: { [userId]: new Date() },
        deletedFor: [new Types.ObjectId(userId)],
        unsent: false,
      },
    ]);

    privateConversation.lastMessage = {
      content: "Nickname updated",
      senderId: new Types.ObjectId(userId),
      type: MessageType.SYSTEM,
      timestamp: theirSystemMessage.createdAt,
    };
    privateConversation.updatedAt = new Date();
    await privateConversation.save();

    emitToUser(targetUserId, "message:receive", {
      messageId: theirSystemMessage._id.toString(),
      conversationId: privateConversation._id.toString(),
      senderId: userId,
      senderUsername: actorName,
      senderProfileImage: actorUser?.profileImage ?? null,
      type: MessageType.SYSTEM,
      content: theirSystemMessage.content,
      mediaUrl: null,
      fileName: null,
      fileSize: null,
      timestamp: theirSystemMessage.createdAt.toISOString(),
    });

    emitToUser(userId, "message:receive", {
      messageId: mySystemMessage._id.toString(),
      conversationId: privateConversation._id.toString(),
      senderId: userId,
      senderUsername: actorName,
      senderProfileImage: actorUser?.profileImage ?? null,
      type: MessageType.SYSTEM,
      content: mySystemMessage.content,
      mediaUrl: null,
      fileName: null,
      fileSize: null,
      timestamp: mySystemMessage.createdAt.toISOString(),
    });

    emitToUser(userId, "contact:nickname-updated", {
      conversationId: privateConversation._id.toString(),
    });
    emitToUser(targetUserId, "contact:nickname-updated", {
      conversationId: privateConversation._id.toString(),
    });
  }

  return {
    contactId: targetUserId,
    nickname: reciprocalContact.nickname,
  };
};
