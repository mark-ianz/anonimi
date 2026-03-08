import { Server } from "socket.io";

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
