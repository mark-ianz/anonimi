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
    io.of("/chat").to(`user:${userId}`).emit(event, data);
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
      io.of("/chat").to(`conversation:${conversationId}`).emit(event, data);
    } else {
      io.of("/chat").to(`conversation:${conversationId}`).emit(event, data);
    }
  }
};

export const emitToAdmins = (event: string, data: unknown) => {
  if (io) {
    io.of("/admin").to("admin:dashboard").emit(event, data);
  }
};

interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

const MESSAGE_RECEIVED_TYPE = "message_received";

const toMessageUnreadCount = (data: Record<string, unknown> | undefined): number => {
  const value = Number(data?.unreadMessages);
  if (!Number.isFinite(value) || value < 1) return 0;
  return Math.floor(value);
};

const formatUnreadCap = (count: number): string => {
  return count > 9 ? "9+" : String(count);
};

const buildMessageNotificationCopy = (senderName: string, unreadCount: number) => {
  const safeName = senderName || "Someone";
  const noun = unreadCount === 1 ? "message" : "messages";

  return {
    title: `${safeName}`,
    body: `You have ${formatUnreadCap(unreadCount)} unread ${noun} from ${safeName}. Click to view.`,
  };
};

const toPayload = (notification: {
  _id: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt?: Date | null;
  createdAt: Date;
}) => ({
  id: notification._id.toString(),
  type: notification.type,
  title: notification.title,
  body: notification.body,
  data: notification.data,
  read: notification.read,
  readAt: notification.readAt,
  createdAt: notification.createdAt.toISOString(),
});

export const createAndEmitNotification = async (
  input: CreateNotificationInput
) => {
  const baseData = input.data ?? {};
  let notification;

  if (input.type === MESSAGE_RECEIVED_TYPE && typeof baseData.senderId === "string") {
    const existing = await Notification.findOne({
      userId: new Types.ObjectId(input.userId),
      type: MESSAGE_RECEIVED_TYPE,
      read: false,
      "data.senderId": baseData.senderId,
    });

    const senderName =
      (baseData.senderUsername as string | undefined) ??
      (existing?.data?.senderUsername as string | undefined) ??
      input.title;

    if (existing) {
      const nextCount = toMessageUnreadCount(existing.data ?? {}) + 1;
      const nextData = {
        ...(existing.data ?? {}),
        ...baseData,
        unreadMessages: nextCount,
      };
      const copy = buildMessageNotificationCopy(senderName, nextCount);

      existing.title = copy.title;
      existing.body = copy.body;
      existing.data = nextData;
      existing.read = false;
      existing.readAt = undefined;
      notification = await existing.save();
    } else {
      const nextCount = 1;
      const copy = buildMessageNotificationCopy(senderName, nextCount);
      notification = await Notification.create({
        userId: new Types.ObjectId(input.userId),
        type: input.type,
        title: copy.title,
        body: copy.body,
        data: {
          ...baseData,
          senderUsername: senderName,
          unreadMessages: nextCount,
        },
        read: false,
      });
    }
  } else {
    notification = await Notification.create({
      userId: new Types.ObjectId(input.userId),
      type: input.type,
      title: input.title,
      body: input.body,
      data: baseData,
      read: false,
    });
  }

  const payload = toPayload(notification);

  emitToUser(input.userId, "notification:new", payload);

  return payload;
};

export const decrementMessageNotificationOnUnsend = async (
  userId: string,
  senderId: string
) => {
  const notification = await Notification.findOne({
    userId: new Types.ObjectId(userId),
    type: MESSAGE_RECEIVED_TYPE,
    read: false,
    "data.senderId": senderId,
  });

  if (!notification) return;

  const currentCount = toMessageUnreadCount(notification.data ?? {});
  const senderName =
    (notification.data?.senderUsername as string | undefined) ??
    notification.title;
  const nextCount = Math.max(0, currentCount - 1);

  if (nextCount < 1) {
    notification.read = true;
    notification.readAt = new Date();
    notification.data = {
      ...(notification.data ?? {}),
      unreadMessages: 0,
    };
  } else {
    const copy = buildMessageNotificationCopy(senderName, nextCount);
    notification.title = copy.title;
    notification.body = copy.body;
    notification.data = {
      ...(notification.data ?? {}),
      unreadMessages: nextCount,
    };
  }

  const updated = await notification.save();
  emitToUser(userId, "notification:new", toPayload(updated));
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
    .sort({ updatedAt: -1, _id: -1 })
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

export const markMessageNotificationsReadByConversation = async (
  userId: string,
  conversationId: string
) => {
  const result = await Notification.updateMany(
    {
      userId: new Types.ObjectId(userId),
      type: MESSAGE_RECEIVED_TYPE,
      read: false,
      "data.conversationId": conversationId,
    },
    {
      read: true,
      readAt: new Date(),
    }
  );

  return {
    message: "Conversation message notifications marked as read",
    modifiedCount: result.modifiedCount,
  };
};
