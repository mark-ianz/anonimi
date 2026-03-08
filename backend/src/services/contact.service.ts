import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Contact } from "../models/contact.model";
import { Block } from "../models/block.model";
import { Conversation } from "../models/conversation.model";
import { NotFoundError, ConflictError, ForbiddenError } from "../utils/apiError";

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
  const contact = await Contact.findOneAndUpdate(
    {
      userId: new Types.ObjectId(userId),
      contactId: new Types.ObjectId(contactId),
      status: "accepted",
    },
    { nickname },
    { new: true }
  );

  if (!contact) {
    throw new NotFoundError("Contact not found");
  }

  return {
    contactId: contact.contactId.toString(),
    nickname: contact.nickname,
  };
};
