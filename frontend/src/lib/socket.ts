import { io, type Socket } from "socket.io-client";
import { SOCKET_URL, ACCESS_TOKEN_KEY } from "./constants";

let chatSocket: Socket | null = null;
let adminSocket: Socket | null = null;

export function getChatSocket(): Socket {
  if (!chatSocket) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    chatSocket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: false,
    });
  } else {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;
    if (token) {
      chatSocket.auth = { token };
    }
  }
  return chatSocket;
}

export function getAdminSocket(): Socket {
  if (!adminSocket) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;

    adminSocket = io(`${SOCKET_URL}/admin`, {
      auth: { token },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      autoConnect: false,
    });
  } else {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem(ACCESS_TOKEN_KEY)
        : null;
    if (token) {
      adminSocket.auth = { token };
    }
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
