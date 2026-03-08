import { io, type Socket } from "socket.io-client";
import { SOCKET_URL, ACCESS_TOKEN_KEY } from "./constants";

let chatSocket: Socket | null = null;
let adminSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!chatSocket || !chatSocket.connected) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    chatSocket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: false,
    });
  }
  return chatSocket;
}

export function getAdminSocket(): Socket {
  if (!adminSocket || !adminSocket.connected) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    adminSocket = io(`${SOCKET_URL}/admin`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: false,
    });
  }
  return adminSocket;
}

export function disconnectSockets() {
  chatSocket?.disconnect();
  chatSocket = null;
  adminSocket?.disconnect();
  adminSocket = null;
}

export function updateSocketToken(token: string) {
  if (chatSocket) {
    chatSocket.auth = { token };
  }
  if (adminSocket) {
    adminSocket.auth = { token };
  }
}
