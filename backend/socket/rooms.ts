import { Socket } from "socket.io";

export const joinUserRoom = (socket: Socket, userId: string): void => {
  socket.join(`user:${userId}`);
};

export const leaveUserRoom = (socket: Socket, userId: string): void => {
  socket.leave(`user:${userId}`);
};

export const joinConversationRoom = (socket: Socket, conversationId: string): void => {
  socket.join(`conversation:${conversationId}`);
};

export const leaveConversationRoom = (socket: Socket, conversationId: string): void => {
  socket.leave(`conversation:${conversationId}`);
};

export const joinGroupRoom = (socket: Socket, groupId: string): void => {
  socket.join(`group:${groupId}`);
};

export const leaveGroupRoom = (socket: Socket, groupId: string): void => {
  socket.leave(`group:${groupId}`);
};

export const joinAdminRoom = (socket: Socket): void => {
  socket.join("admin:dashboard");
};
