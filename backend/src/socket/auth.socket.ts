import { Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { User } from "../models/user.model";
import { AppearanceStatus, OnlineStatus } from "../types/enums";

export const socketAuth = async (
  socket: Socket,
  next: (err?: Error) => void
): Promise<void> => {
  const token = socket.handshake.auth.token;

  if (!token) {
    return next(new Error("No token provided"));
  }

  try {
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return next(new Error("User not found"));
    }

    if (user.status === "banned") {
      return next(new Error("Account is banned"));
    }

    const effectiveStatus =
      user.appearanceStatus === AppearanceStatus.INVISIBLE
        ? OnlineStatus.OFFLINE
        : (user.appearanceStatus as unknown as OnlineStatus);

    user.onlineStatus = effectiveStatus;
    user.lastSeen = new Date();
    await user.save();

    socket.data.user = {
      userId: decoded.userId,
      anonimiId: decoded.anonimiId,
      role: decoded.role,
    };

    socket.join(`user:${decoded.userId}`);
    next();
  } catch {
    return next(new Error("Invalid token"));
  }
};
