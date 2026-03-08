import { Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { User } from "../models/user.model";
import { Types } from "mongoose";
import { OnlineStatus } from "../types/enums";

export const socketAuth = async (socket: Socket): Promise<void> => {
  const token = socket.handshake.auth.token;

  if (!token) {
    socket.emit("connect_error", { message: "No token provided" });
    socket.disconnect();
    return;
  }

  try {
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);

    if (!user) {
      socket.emit("connect_error", { message: "User not found" });
      socket.disconnect();
      return;
    }

    if (user.status === "banned") {
      socket.emit("connect_error", { message: "Account is banned" });
      socket.disconnect();
      return;
    }

    user.onlineStatus = OnlineStatus.ONLINE;
    user.lastSeen = new Date();
    await user.save();

    socket.data.user = {
      userId: decoded.userId,
      echoId: decoded.echoId,
      role: decoded.role,
    };

    socket.join(`user:${decoded.userId}`);
  } catch (error) {
    socket.emit("connect_error", { message: "Invalid token" });
    socket.disconnect();
  }
};
