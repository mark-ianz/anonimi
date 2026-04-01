import { Server, Socket } from "socket.io";

export const setupNotificationHandler = (io: Server, socket: Socket): void => {
  socket.on("notification:subscribe", async (payload: { userId: string }) => {
    try {
      const { userId } = payload;
      const socketUserId = socket.data.user?.userId;

      if (socketUserId !== userId) {
        socket.emit("error", { code: "PERMISSION_DENIED", message: "Cannot subscribe to another user's notifications" });
        return;
      }

      socket.join(`user:${userId}`);
    } catch (error) {
      console.error("Error in notification:subscribe:", error);
    }
  });
};

export const notifyNewContactRequest = async (
  io: Server,
  recipientId: string,
  request: {
    requestId: string;
    from: { id: string; anonimiId: string; username: string; profileImage?: string };
    createdAt: Date;
  }
) => {
  io.to(`user:${recipientId}`).emit("contact:request", request);
};

export const notifyContactAccepted = async (
  io: Server,
  recipientId: string,
  contact: { contactId: string; anonimiId: string; username: string; profileImage?: string }
) => {
  io.to(`user:${recipientId}`).emit("contact:accepted", contact);
};

export const notifyNewMessageRequest = async (
  io: Server,
  recipientId: string,
  request: {
    requestId: string;
    conversationId: string;
    from: { id: string; anonimiId: string; username: string; profileImage?: string };
    preview: { content: string; type: string; timestamp: Date };
  }
) => {
  io.to(`user:${recipientId}`).emit("message-request:new", request);
};
