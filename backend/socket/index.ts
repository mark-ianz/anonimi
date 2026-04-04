import { Server } from "socket.io";
import { socketAuth } from "./auth.socket";
import { setupChatHandler } from "./chat.handler";
import { setupPresenceHandler } from "./presence.handler";
import { setupGroupHandler } from "./group.handler";
import { setupNotificationHandler } from "./notification.handler";
import { setupAdminNamespace } from "./admin.handler";
import { setupE2EEHandler } from "./e2ee.handler";
import { setSocketIO } from "../services/notification.service";

export const setupSocket = (io: Server): void => {
  setSocketIO(io);

  const chatNamespace = io.of("/chat");

  chatNamespace.use(socketAuth);

  chatNamespace.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}, User: ${socket.data.user?.userId}`);

    setupChatHandler(io, socket);
    setupPresenceHandler(io, socket);
    setupGroupHandler(io, socket);
    setupNotificationHandler(io, socket);
    setupE2EEHandler(io, socket);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  setupAdminNamespace(io);
};
