import { Server, Socket } from "socket.io";
import { User } from "../models/user.model";
import { Conversation } from "../models/conversation.model";
import { AppearanceStatus, OnlineStatus } from "../types/enums";
import { emitToConversation } from "../services/notification.service";

const toEffectiveOnlineStatus = (appearanceStatus: AppearanceStatus): OnlineStatus => {
  if (appearanceStatus === AppearanceStatus.INVISIBLE) {
    return OnlineStatus.OFFLINE;
  }

  return appearanceStatus as unknown as OnlineStatus;
};

export const setupPresenceHandler = (io: Server, socket: Socket): void => {
  const disconnectTimeout: NodeJS.Timeout | null = null;

  const joinConversationRooms = async (userId: string) => {
    const conversations = await Conversation.find({
      participants: userId,
    });

    for (const conv of conversations) {
      socket.join(`conversation:${conv._id.toString()}`);
    }
  };

  joinConversationRooms(socket.data.user?.userId).then(() => {
    socket.data.user?.userId &&
      emitUserOnline(socket, socket.data.user.userId);
  });

  socket.on("presence:set-status", async (payload: { status: "online" | "away" | "dnd" | "invisible" }) => {
    const userId = socket.data.user?.userId;

    if (!userId) return;

    const user = await User.findById(userId);
    if (!user) return;

    user.appearanceStatus = payload.status as AppearanceStatus;
    user.onlineStatus = toEffectiveOnlineStatus(user.appearanceStatus);
    user.lastSeen = new Date();
    await user.save();

    const conversations = await Conversation.find({
      participants: userId,
    });

    for (const conv of conversations) {
      io.of("/chat").to(`conversation:${conv._id.toString()}`).emit("presence:update", {
        userId,
        status: user.onlineStatus,
        lastSeen: user.onlineStatus === OnlineStatus.OFFLINE ? user.lastSeen?.toISOString() : undefined,
      });
    }
  });

  socket.on("disconnect", async () => {
    const userId = socket.data.user?.userId;

    if (!userId) return;

    setTimeout(async () => {
      const sockets = await io.of("/chat").in(`user:${userId}`).fetchSockets();

      if (sockets.length === 0) {
        await User.findByIdAndUpdate(userId, {
          onlineStatus: OnlineStatus.OFFLINE,
          lastSeen: new Date(),
        });

        const conversations = await Conversation.find({
          participants: userId,
        });

        for (const conv of conversations) {
          io.of("/chat").to(`conversation:${conv._id.toString()}`).emit("presence:update", {
            userId,
            status: "offline",
            lastSeen: new Date().toISOString(),
          });
        }
      }
    }, 10000);
  });
};

const emitUserOnline = async (socket: Socket, userId: string) => {
  const user = await User.findById(userId);

  if (!user) return;

  const conversations = await Conversation.find({
    participants: userId,
  });

  for (const conv of conversations) {
    socket.to(`conversation:${conv._id.toString()}`).emit("presence:update", {
      userId,
      status: user.onlineStatus,
      lastSeen: user.onlineStatus === OnlineStatus.OFFLINE ? user.lastSeen?.toISOString() : undefined,
    });
  }
};
