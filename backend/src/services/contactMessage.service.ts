import { Types } from "mongoose";
import { ContactMessage } from "../models/contactMessage.model";
import { AdminLog } from "../models/adminLog.model";
import { NotFoundError } from "../utils/apiError";

export interface CreateContactMessageData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ContactMessageFilter {
  status?: string;
  limit?: number;
  cursor?: string;
}

export const createContactMessage = async (data: CreateContactMessageData) => {
  const message = await ContactMessage.create(data);
  return {
    id: message._id.toString(),
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    status: message.status,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

export const getContactMessages = async (
  filter: ContactMessageFilter,
  requesterRole: string
) => {
  const { status, limit = 20, cursor } = filter;
  const query: Record<string, unknown> = {};

  if (status && status !== "all") {
    query.status = status;
  }

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const messages = await ContactMessage.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;

  return {
    messages: data.map((m: any) => ({
      id: m._id.toString(),
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      status: m.status,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getContactMessageById = async (messageId: string) => {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new NotFoundError("Message not found");
  }

  const message = await ContactMessage.findById(messageId).lean();

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  return {
    id: message._id.toString(),
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    status: message.status,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

export const updateContactMessageStatus = async (
  messageId: string,
  status: string,
  adminId: string,
  ipAddress?: string
) => {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new NotFoundError("Message not found");
  }

  const message = await ContactMessage.findById(messageId);

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  const previousStatus = message.status;
  message.status = status as "unread" | "read" | "in_progress" | "resolved" | "spam";
  await message.save();

  await AdminLog.create({
    adminId: new Types.ObjectId(adminId),
    action: "update_contact_message_status",
    targetType: "contact_message",
    targetId: message._id,
    details: {
      previousStatus,
      newStatus: status,
    },
    ipAddress,
  });

  return {
    id: message._id.toString(),
    name: message.name,
    email: message.email,
    subject: message.subject,
    message: message.message,
    status: message.status,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
};

export const deleteContactMessage = async (
  messageId: string,
  adminId: string,
  ipAddress?: string
) => {
  if (!Types.ObjectId.isValid(messageId)) {
    throw new NotFoundError("Message not found");
  }

  const message = await ContactMessage.findById(messageId);

  if (!message) {
    throw new NotFoundError("Message not found");
  }

  await AdminLog.create({
    adminId: new Types.ObjectId(adminId),
    action: "delete_contact_message",
    targetType: "contact_message",
    targetId: message._id,
    details: {
      subject: message.subject,
      email: message.email,
    },
    ipAddress,
  });

  await ContactMessage.deleteOne({ _id: messageId });

  return { message: "Message deleted" };
};

export const getContactMessageStats = async () => {
  const total = await ContactMessage.countDocuments();
  const unread = await ContactMessage.countDocuments({ status: "unread" });
  const read = await ContactMessage.countDocuments({ status: "read" });
  const inProgress = await ContactMessage.countDocuments({ status: "in_progress" });
  const resolved = await ContactMessage.countDocuments({ status: "resolved" });
  const spam = await ContactMessage.countDocuments({ status: "spam" });

  return {
    total,
    unread,
    read,
    inProgress,
    resolved,
    spam,
  };
};