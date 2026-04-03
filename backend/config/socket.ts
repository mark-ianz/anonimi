import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { env } from "./env";

export const createSocketServer = (server: http.Server): SocketIOServer => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true,
      methods: ["GET", "POST"],
    },
    pingInterval: 25000,
    pingTimeout: 20000,
    transports: ["websocket", "polling"],
  });

  return io;
};
