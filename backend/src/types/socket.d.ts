import { Server, Socket } from "socket.io";
import { IUser } from "../types/models";

declare global {
  namespace SocketIO {
    interface Socket {
      data: {
        user?: {
          userId: string;
          echoId: string;
          role: string;
        };
      };
    }
  }
}

export interface AuthSocket extends Socket {
  data: {
    user: {
      userId: string;
      echoId: string;
      role: string;
    };
  };
}
