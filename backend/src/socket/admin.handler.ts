import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import { User } from "../models/user.model";
import { UserRole } from "../types/enums";

export const setupAdminNamespace = (io: Server) => {
  const adminNamespace = io.of("/admin");

  adminNamespace.use(async (socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("No token provided"));
    }

    try {
      const decoded = verifyAccessToken(token);

      if (decoded.role !== UserRole.SUPER_ADMIN && 
          decoded.role !== UserRole.MODERATOR && 
          decoded.role !== UserRole.SUPPORT_STAFF) {
        return next(new Error("Insufficient permissions"));
      }

      socket.data.user = decoded;
      next();
    } catch (error) {
      next(new Error("Invalid token"));
    }
  });

  adminNamespace.on("connection", (socket) => {
    socket.join("admin:dashboard");

    console.log(`Admin connected: ${socket.data.user.userId}`);
  });
};

export const notifyAdmins = (io: Server, event: string, data: unknown) => {
  const adminNamespace = io.of("/admin");
  adminNamespace.to("admin:dashboard").emit(event, data);
};

export const notifyNewReport = async (
  io: Server,
  report: { reportId: string; targetType: string; reason: string; reporterUsername: string; createdAt: Date }
) => {
  notifyAdmins(io, "admin:report-new", report);
};

export const notifyNewTicket = async (
  io: Server,
  ticket: { ticketId: string; subject: string; reason: string; username: string; createdAt: Date }
) => {
  notifyAdmins(io, "admin:ticket-new", ticket);
};

export const notifyNewUser = async (
  io: Server,
  user: { userId: string; echoId: string; username: string; createdAt: Date }
) => {
  notifyAdmins(io, "admin:user-registered", user);
};

export const notifyMetricsUpdate = async (
  io: Server,
  metrics: { totalUsers: number; activeUsers: number; messagesLast24h: number; pendingReports: number; openTickets: number }
) => {
  notifyAdmins(io, "admin:metrics-update", metrics);
};
