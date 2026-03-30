import { Server } from "socket.io";
import { Types } from "mongoose";
import { Notification } from "../models/notification.model";
import { NotFoundError } from "../utils/apiError";

let io: Server;

export const setSocketIO = (socketIO: Server) => {
  io = socketIO;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.IO not initialized");
  }
  return io;
};

export const emitToUser = (userId: string, event: string, data: unknown) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToConversation = (
  conversationId: string,
  event: string,
  data: unknown,
  excludeUserId?: string
) => {
  if (io) {
    if (excludeUserId) {
      io.to(`conversation:${conversationId}`).emit(event, data);
    } else {
      io.to(`conversation:${conversationId}`).emit(event, data);
    }
  }
};

export const emitToAdmins = (event: string, data: unknown) => {
  if (io) {
    io.to("admin:dashboard").emit(event, data);
  }
};

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export const createAndEmitNotification = async (
  input: CreateNotificationInput
) => {
  const notification = await Notification.create({
    userId: new Types.ObjectId(input.userId),
    type: input.type,
    title: input.title,
    body: input.body,
    data: input.data ?? {},
    read: false,
  });

  const payload = {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    read: notification.read,
    readAt: notification.readAt,
    createdAt: notification.createdAt.toISOString(),
  };

  emitToUser(input.userId, "notification:new", payload);

  return payload;
};

export const listNotifications = async (
  userId: string,
  limit: number = 20,
  cursor?: string
) => {
  const query: Record<string, unknown> = {
    userId: new Types.ObjectId(userId),
  };

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const docs = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = docs.length > limit;
  const data = hasMore ? docs.slice(0, limit) : docs;

  const unreadCount = await Notification.countDocuments({
    userId: new Types.ObjectId(userId),
    read: false,
  });

  return {
    notifications: data.map((n: any) => ({
      id: n._id.toString(),
      type: n.type,
      title: n.title,
      body: n.body,
      data: n.data ?? {},
      read: !!n.read,
      readAt: n.readAt ?? null,
      createdAt: n.createdAt,
    })),
    unreadCount,
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
    hasMore,
    limit,
  };
};

export const markNotificationRead = async (
  userId: string,
  notificationId: string
) => {
  const updated = await Notification.findOneAndUpdate(
    {
      _id: new Types.ObjectId(notificationId),
      userId: new Types.ObjectId(userId),
    },
    {
      read: true,
      readAt: new Date(),
    },
    { new: true }
  );

  if (!updated) {
    throw new NotFoundError("Notification not found");
  }

  return {
    id: updated._id.toString(),
    read: updated.read,
    readAt: updated.readAt,
  };
};

export const markAllNotificationsRead = async (userId: string) => {
  await Notification.updateMany(
    {
      userId: new Types.ObjectId(userId),
      read: false,
    },
    {
      read: true,
      readAt: new Date(),
    }
  );

  return { message: "All notifications marked as read" };
};
