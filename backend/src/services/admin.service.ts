import { Types } from "mongoose";
import { User } from "../models/user.model";
import { Ban } from "../models/ban.model";
import { Report } from "../models/report.model";
import { SupportTicket } from "../models/supportTicket.model";
import { SupportMessage } from "../models/supportMessage.model";
import { Group } from "../models/group.model";
import { GroupMember } from "../models/groupMember.model";
import { Conversation } from "../models/conversation.model";
import { Message } from "../models/message.model";
import { AdminLog } from "../models/adminLog.model";
import { UserDeletionRequest } from "../models/userDeletionRequest.model";
import { RefreshToken } from "../models/refreshToken.model";
import { Contact } from "../models/contact.model";
import { Block } from "../models/block.model";
import { Notification } from "../models/notification.model";
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/apiError";
import { UserRole, UserStatus } from "../types/enums";
import { createAndEmitNotification, emitToAdmins, emitToUser } from "./notification.service";

export const createAdminLog = async (
  adminId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, unknown>,
  ipAddress?: string
) => {
  await AdminLog.create({
    adminId: new Types.ObjectId(adminId),
    action,
    targetType,
    targetId: new Types.ObjectId(targetId),
    details,
    ipAddress,
  });
};

const removeUserData = async (userId: string) => {
  const id = new Types.ObjectId(userId);

  await RefreshToken.deleteMany({ userId: id });
  await Contact.deleteMany({
    $or: [{ userId: id }, { contactId: id }],
  });
  await Block.deleteMany({
    $or: [{ blockerId: id }, { blockedId: id }],
  });
  await GroupMember.deleteMany({ userId: id });
  await SupportMessage.deleteMany({ senderId: id });
  await SupportTicket.deleteMany({ userId: id });
  await Notification.deleteMany({ userId: id });
  await Ban.deleteMany({ userId: id });

  await User.deleteOne({ _id: id });
};

export const getUsers = async (
  search?: string,
  status?: string,
  role?: string,
  tempState?: string,
  verified?: string,
  sort?: string,
  limit: number = 20,
  cursor?: string
) => {
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { anonimiId: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (role) {
    query.role = role;
  }

  const now = new Date();
  if (tempState === "active") {
    query.isTemporary = true;
    query.$or = [
      ...(query.$or ? (query.$or as Array<Record<string, unknown>>) : []),
    ];
    query.tempExpiresAt = { $gt: now };
  }

  if (tempState === "expired") {
    query.isTemporary = true;
    query.tempExpiresAt = { $lte: now };
  }

  if (verified === "true") {
    query.emailVerified = true;
  }

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    last_seen: { lastSeen: -1, createdAt: -1 },
    username: { username: 1 },
  };

  const sortClause = sortMap[sort ?? "newest"] ?? sortMap.newest;

  const users = await User.find(query)
    .sort(sortClause)
    .limit(limit + 1)
    .lean();

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, limit) : users;

  return {
    users: data.map((u: any) => ({
      id: u._id.toString(),
      anonimiId: u.anonimiId,
      username: u.username,
      email: u.email ?? null,
      phone: u.phone,
      profileImage: u.profileImage ?? null,
      isTemporary: !!u.isTemporary,
      tempCreatedAt: u.tempCreatedAt ?? null,
      tempExpiresAt: u.tempExpiresAt ?? null,
      tempState:
        u.isTemporary && u.tempExpiresAt
          ? new Date(u.tempExpiresAt).getTime() <= now.getTime()
            ? "expired"
            : "active"
          : null,
      role: u.role,
      status: u.status,
      emailVerified: !!u.emailVerified,
      phoneVerified: !!u.phoneVerified,
      createdAt: u.createdAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getUserById = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return {
    id: user._id.toString(),
    anonimiId: user.anonimiId,
    username: user.username,
    email: user.email,
    phone: user.phone,
    profileImage: user.profileImage,
    role: user.role,
    status: user.status,
    onlineStatus: user.onlineStatus,
    lastSeen: user.lastSeen,
    emailVerified: user.emailVerified,
    phoneVerified: user.phoneVerified,
    createdAt: user.createdAt,
  };
};

export const warnUser = async (
  adminId: string,
  userId: string,
  message: string,
  ipAddress?: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  await createAdminLog(adminId, "warn_user", "user", userId, { message }, ipAddress);

  await createAndEmitNotification({
    userId,
    type: "warning",
    title: "Account warning",
    body: message,
    data: {
      href: "/support",
    },
  });

  return { message: "Warning issued" };
};

export const banUser = async (
  adminId: string,
  userId: string,
  reason: string,
  type: "temporary" | "permanent",
  expiresInDays?: number,
  ipAddress?: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    throw new ForbiddenError("Cannot ban a super admin");
  }

  let expiresAt: Date | undefined;
  if (type === "temporary" && expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  }

  await Ban.create({
    userId: user._id,
    reason,
    bannedBy: new Types.ObjectId(adminId),
    type,
    expiresAt,
    active: true,
  });

  user.status = UserStatus.BANNED;
  await user.save();

  await createAdminLog(
    adminId,
    "ban_user",
    "user",
    userId,
    { reason, type, expiresAt },
    ipAddress
  );

  return { message: "User banned" };
};

export const unbanUser = async (
  adminId: string,
  userId: string,
  ipAddress?: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  await Ban.updateMany(
    { userId: user._id, active: true },
    { active: false, unbannedBy: new Types.ObjectId(adminId), unbannedAt: new Date() }
  );

  user.status = UserStatus.ACTIVE;
  await user.save();

  await createAdminLog(adminId, "unban_user", "user", userId, {}, ipAddress);

  return { message: "User unbanned" };
};

export const requestUserDeletion = async (
  adminId: string,
  userId: string,
  reason?: string
) => {
  const user = await User.findById(userId).select("role");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    throw new ForbiddenError("Cannot delete a super admin");
  }

  const existing = await UserDeletionRequest.findOne({
    userId: user._id,
    status: "pending",
  }).lean();

  if (existing) {
    throw new ConflictError("Delete request already pending");
  }

  const request = await UserDeletionRequest.create({
    userId: user._id,
    requestedBy: new Types.ObjectId(adminId),
    status: "pending",
    reason: reason?.trim() || undefined,
  });

  await createAdminLog(adminId, "request_delete_user", "user", userId, {
    requestId: request._id.toString(),
    reason: reason?.trim() || null,
  });

  return {
    id: request._id.toString(),
    status: request.status,
  };
};

export const deleteUser = async (
  adminId: string,
  userId: string,
  ipAddress?: string
) => {
  const user = await User.findById(userId).select("role");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    throw new ForbiddenError("Cannot delete a super admin");
  }

  await removeUserData(userId);

  await createAdminLog(adminId, "delete_user", "user", userId, {}, ipAddress);

  return { message: "User deleted" };
};

export const changeUserRole = async (
  adminId: string,
  userId: string,
  role: UserRole
) => {
  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new NotFoundError("User not found");
  }

  if (targetUser.role === UserRole.SUPER_ADMIN) {
    throw new ForbiddenError("Cannot change super admin role");
  }

  targetUser.role = role;
  await targetUser.save();

  await createAdminLog(adminId, "promote_admin", "user", userId, { role });

  return { message: "Role updated" };
};

export const getReports = async (
  status?: string,
  targetType?: string,
  limit: number = 20,
  cursor?: string
) => {
  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (targetType) query.targetType = targetType;
  if (cursor) query._id = { $lt: new Types.ObjectId(cursor) };

  const reports = await Report.find(query)
    .populate("reporterId", "username anonimiId")
    .populate("reviewedBy", "username")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = reports.length > limit;
  const data = hasMore ? reports.slice(0, limit) : reports;

  return {
    reports: data.map((r: any) => ({
      id: r._id.toString(),
      reporterId: r.reporterId?._id?.toString(),
      reporterUsername: r.reporterId?.username,
      targetType: r.targetType,
      targetId: r.targetId.toString(),
      reason: r.reason,
      description: r.description ?? null,
      status: r.status,
      reviewedBy: r.reviewedBy
        ? {
            id: r.reviewedBy?._id?.toString(),
            username: r.reviewedBy?.username,
          }
        : null,
      createdAt: r.createdAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getReportById = async (reportId: string) => {
  const report = await Report.findById(reportId)
    .populate("reporterId", "username anonimiId profileImage")
    .populate("reviewedBy", "username")
    .lean();

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  const reporter = report.reporterId as any;
  const reporterId = reporter?._id?.toString?.();

  let targetUserId: string | null = null;
  if (report.targetType === "user") {
    targetUserId = report.targetId?.toString?.() ?? null;
  } else if (report.targetType === "message" && report.messageSnapshot?.senderId) {
    targetUserId = report.messageSnapshot.senderId.toString();
  }

  const targetUser = targetUserId
    ? await User.findById(targetUserId).select("username anonimiId profileImage").lean()
    : null;

  return {
    id: report._id.toString(),
    reporterId,
    reporterUsername: reporter?.username ?? null,
    reporter: reporterId
      ? {
          id: reporterId,
          username: reporter?.username ?? null,
          anonimiId: reporter?.anonimiId ?? null,
          profileImage: reporter?.profileImage ?? null,
        }
      : null,
    targetType: report.targetType,
    targetId: report.targetId?.toString?.() ?? null,
    reason: report.reason,
    description: report.description ?? null,
    status: report.status,
    reviewedBy: report.reviewedBy
      ? {
          id: (report.reviewedBy as any)?._id?.toString(),
          username: (report.reviewedBy as any)?.username,
        }
      : null,
    createdAt: report.createdAt,
    messageSnapshot: report.messageSnapshot
      ? {
          content: report.messageSnapshot.content ?? null,
          senderId: report.messageSnapshot.senderId?.toString?.() ?? null,
          senderUsername: report.messageSnapshot.senderUsername ?? null,
          type: report.messageSnapshot.type ?? "text",
          createdAt: report.messageSnapshot.originalCreatedAt ?? report.createdAt,
          mediaUrl: report.messageSnapshot.mediaUrl ?? null,
        }
      : null,
    targetUser: targetUser
      ? {
          id: targetUser._id.toString(),
          username: (targetUser as any).username ?? null,
          anonimiId: (targetUser as any).anonimiId ?? null,
          profileImage: (targetUser as any).profileImage ?? null,
        }
      : null,
  };
};

export const claimReport = async (adminId: string, reportId: string) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  if (report.status === "resolved" || report.status === "dismissed") {
    throw new ConflictError("Report already closed");
  }

  report.status = "under_review";
  report.reviewedBy = new Types.ObjectId(adminId);
  await report.save();

  await createAdminLog(adminId, "claim_report", "report", reportId, {});

  emitToUser(report.reporterId.toString(), "support:report:updated", {
    reportId: report._id.toString(),
    status: report.status,
    updatedAt: report.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
  emitToAdmins("admin:report:updated", {
    reportId: report._id.toString(),
    status: report.status,
    updatedAt: report.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });

  return { message: "Report claimed" };
};

const buildDailySeries = async (
  collection: typeof User | typeof Message,
  dateField: string,
  days: number = 30,
  match: Record<string, unknown> = {}
) => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  start.setHours(0, 0, 0, 0);

  const rows = await collection.aggregate([
    {
      $match: {
        ...match,
        [dateField]: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const lookup = new Map(rows.map((r: any) => [r._id, r.count]));
  const series: Array<{ date: string; value: number }> = [];

  for (let i = 0; i < days; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    series.push({ date: d.toISOString(), value: lookup.get(key) ?? 0 });
  }

  return series;
};

export const getAnalyticsUsers = async () => {
  const registrations = await buildDailySeries(User, "createdAt");
  const dau = await buildDailySeries(
    User,
    "lastSeen",
    30,
    { lastSeen: { $ne: null } }
  );

  return { registrations, dau };
};

export const getAnalyticsMessages = async () => {
  const daily = await buildDailySeries(Message, "createdAt");
  return { daily };
};

export const resolveReport = async (
  adminId: string,
  reportId: string,
  resolution: string,
  notes?: string,
  reporterNote?: string,
  ipAddress?: string
) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  report.status = "resolved";
  report.resolution = resolution;
  report.resolutionNotes = notes;
  report.reporterNote = reporterNote;
  report.reviewedBy = new Types.ObjectId(adminId);
  await report.save();

  if (resolution === "user_banned") {
    await Ban.create({
      userId: report.targetId,
      reason: `Reported: ${report.reason}`,
      bannedBy: new Types.ObjectId(adminId),
      type: "permanent",
      active: true,
    });

    await User.updateOne({ _id: report.targetId }, { status: "banned" });
  }

  if (resolution === "content_removed" && report.targetType === "message") {
    await Message.findByIdAndUpdate(report.targetId, { unsent: true, content: null });
  }

  await createAdminLog(
    adminId,
    "resolve_report",
    "report",
    reportId,
    { resolution, notes },
    ipAddress
  );

  await createAndEmitNotification({
    userId: report.reporterId.toString(),
    type: "report_update",
    title: "Report reviewed",
    body: (() => {
      const labelMap: Record<string, string> = {
        warning_issued: "Warning issued",
        user_banned: "User banned",
        content_removed: "Content removed",
        no_action: "No action",
      };
      const summary = labelMap[resolution] ?? "Resolved";
      if (reporterNote && reporterNote.trim()) {
        return `Outcome: ${summary}. Note: ${reporterNote.trim()}`;
      }
      return `Outcome: ${summary}.`;
    })(),
    data: {
      reportId: report._id.toString(),
      resolution,
      href: "/support",
    },
  });

  emitToUser(report.reporterId.toString(), "support:report:updated", {
    reportId: report._id.toString(),
    status: report.status,
    updatedAt: report.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
  emitToAdmins("admin:report:updated", {
    reportId: report._id.toString(),
    status: report.status,
    updatedAt: report.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });

  return { message: "Report resolved" };
};

export const dismissReport = async (
  adminId: string,
  reportId: string,
  ipAddress?: string
) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  report.status = "dismissed";
  report.reviewedBy = new Types.ObjectId(adminId);
  await report.save();

  await createAdminLog(adminId, "dismiss_report", "report", reportId, {}, ipAddress);

  await createAndEmitNotification({
    userId: report.reporterId.toString(),
    type: "report_update",
    title: "Report reviewed",
    body: notes && notes.trim()
      ? `Outcome: Dismissed. Notes: ${notes.trim()}`
      : "Outcome: Dismissed.",
    data: {
      reportId: report._id.toString(),
      resolution: "dismissed",
      href: "/support",
    },
  });

  emitToUser(report.reporterId.toString(), "support:report:updated", {
    reportId: report._id.toString(),
    status: report.status,
    updatedAt: report.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
  emitToAdmins("admin:report:updated", {
    reportId: report._id.toString(),
    status: report.status,
    updatedAt: report.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });

  return { message: "Report dismissed" };
};

export const getAdminTickets = async (
  status?: string,
  limit: number = 20,
  cursor?: string
) => {
  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (cursor) query._id = { $lt: new Types.ObjectId(cursor) };

  const tickets = await SupportTicket.find(query)
    .populate("userId", "username anonimiId")
    .populate("assignedTo", "username")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = tickets.length > limit;
  const data = hasMore ? tickets.slice(0, limit) : tickets;

  return {
    tickets: data.map((t: any) => ({
      id: t._id.toString(),
      userId: t.userId?._id?.toString(),
      username: t.userId?.username,
      subject: t.subject,
      reason: t.reason,
      status: t.status,
      assignedTo: t.assignedTo
        ? {
            id: t.assignedTo?._id?.toString(),
            username: t.assignedTo?.username,
          }
        : null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getAdminTicketById = async (ticketId: string) => {
  const ticket = await SupportTicket.findById(ticketId)
    .populate("userId", "username anonimiId")
    .populate("assignedTo", "username")
    .lean();

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  const messages = await SupportMessage.find({ ticketId: ticket._id })
    .populate("senderId", "username")
    .lean();

  return {
    ticket: {
      id: ticket._id.toString(),
      userId: ticket.userId?._id?.toString(),
      username: ticket.userId?.username,
      subject: ticket.subject,
      reason: ticket.reason,
      status: ticket.status,
      assignedTo: ticket.assignedTo
        ? {
            id: ticket.assignedTo?._id?.toString(),
            username: ticket.assignedTo?.username,
          }
        : null,
    },
    messages: messages.map((m: any) => ({
      id: m._id.toString(),
      senderId: m.senderId?._id?.toString(),
      senderUsername: m.senderId?.username,
      senderRole: m.senderRole,
      content: m.content,
      type: m.type ?? "text",
      mediaUrl: m.mediaUrl ?? null,
      createdAt: m.createdAt,
    })),
  };
};

export const assignTicket = async (
  adminId: string,
  ticketId: string,
  assignedTo: string
) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  ticket.assignedTo = new Types.ObjectId(assignedTo);
  ticket.status = "assigned";
  await ticket.save();

  await createAndEmitNotification({
    userId: ticket.userId.toString(),
    type: "ticket_update",
    title: "Support ticket assigned",
    body: `Your ticket "${ticket.subject}" has been assigned to a support staff member.`,
    data: {
      ticketId: ticket._id.toString(),
      href: `/support/${ticket._id.toString()}`,
    },
  });

  emitToUser(ticket.userId.toString(), "support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: ticket.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
  emitToAdmins("admin:support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: ticket.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });

  return { message: "Ticket assigned" };
};

export const updateTicketStatus = async (
  adminId: string,
  ticketId: string,
  status: string
) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  ticket.status = status;
  await ticket.save();

  await createAndEmitNotification({
    userId: ticket.userId.toString(),
    type: "ticket_update",
    title: "Support ticket updated",
    body: `Your ticket \"${ticket.subject}\" status is now ${status.replace(/_/g, " ")}.`,
    data: {
      ticketId: ticket._id.toString(),
      status,
      href: `/support/${ticket._id.toString()}`,
    },
  });

  emitToUser(ticket.userId.toString(), "support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: ticket.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
  emitToAdmins("admin:support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: ticket.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });

  return { message: "Ticket status updated" };
};

export const replyToTicketAsStaff = async (
  adminId: string,
  ticketId: string,
  content?: string,
  mediaUrl?: string,
  type: "text" | "image" = "text"
) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  if (!ticket.assignedTo) {
    ticket.assignedTo = new Types.ObjectId(adminId);
  }

  const message = await SupportMessage.create({
    ticketId: ticket._id,
    senderId: new Types.ObjectId(adminId),
    senderRole: "staff",
    type,
    content: content?.trim() || null,
    mediaUrl: mediaUrl ?? null,
  });

  ticket.status = "waiting_on_user";
  await ticket.save();

  await createAndEmitNotification({
    userId: ticket.userId.toString(),
    type: "ticket_reply",
    title: "New support reply",
    body: "Support staff replied to your ticket.",
    data: {
      ticketId: ticket._id.toString(),
      href: `/support/${ticket._id.toString()}`,
    },
  });

  emitToUser(ticket.userId.toString(), "support:message:new", {
    ticketId: ticket._id.toString(),
    messageId: message._id.toString(),
    createdAt: message.createdAt,
  });
  emitToAdmins("admin:support:message:new", {
    ticketId: ticket._id.toString(),
    messageId: message._id.toString(),
    userId: ticket.userId.toString(),
    createdAt: message.createdAt,
  });
  emitToUser(ticket.userId.toString(), "support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: ticket.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
  emitToAdmins("admin:support:ticket:updated", {
    ticketId: ticket._id.toString(),
    status: ticket.status,
    updatedAt: ticket.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });

  return {
    messageId: message._id.toString(),
    content: message.content,
    senderRole: message.senderRole,
    type: message.type,
    mediaUrl: message.mediaUrl ?? null,
    createdAt: message.createdAt,
  };
};

export const getGroups = async (search?: string, limit: number = 20, cursor?: string) => {
  const query: Record<string, unknown> = {};

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const groups = await Group.find(query)
    .populate("ownerId", "username anonimiId")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = groups.length > limit;
  const data = hasMore ? groups.slice(0, limit) : groups;

  const enriched = await Promise.all(
    data.map(async (g: any) => {
      const memberCount = await GroupMember.countDocuments({ groupId: g._id });
      const previewMembers = await GroupMember.find({ groupId: g._id })
        .populate("userId", "username profileImage")
        .limit(3)
        .lean();

      const memberPreview = previewMembers.map((m: any) => ({
        username: m.userId?.username ?? null,
        profileImage: m.userId?.profileImage ?? null,
      }));

      return {
        id: g._id.toString(),
        name: g.name,
        image: g.image,
        ownerId: g.ownerId?._id?.toString(),
        ownerUsername: g.ownerId?.username,
        memberCount,
        memberPreview,
        createdAt: g.createdAt,
      };
    })
  );

  return {
    groups: enriched,
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getGroupById = async (groupId: string) => {
  const group = await Group.findById(groupId)
    .populate("ownerId", "username anonimiId")
    .lean();

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const members = await GroupMember.find({ groupId: group._id })
    .populate("userId", "username anonimiId profileImage")
    .lean();

  return {
    id: group._id.toString(),
    name: group.name,
    image: group.image,
    ownerId: group.ownerId?._id?.toString(),
    ownerUsername: group.ownerId?.username,
    conversationId: group.conversationId?.toString(),
    settings: group.settings,
    members: members.map((m: any) => ({
      userId: m.userId?._id?.toString(),
      username: m.userId?.username,
      anonimiId: m.userId?.anonimiId,
      profileImage: m.userId?.profileImage ?? null,
      role: m.role,
    })),
    createdAt: group.createdAt,
  };
};

export const deleteGroup = async (adminId: string, groupId: string, ipAddress?: string) => {
  const group = await Group.findById(groupId);

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  await Conversation.deleteOne({ _id: group.conversationId });
  await GroupMember.deleteMany({ groupId: group._id });
  await Group.deleteOne({ _id: group._id });

  await createAdminLog(adminId, "delete_group", "group", groupId, {}, ipAddress);

  return { message: "Group deleted" };
};

export const getConversationMessages = async (
  adminId: string,
  conversationId: string,
  limit: number = 50,
  cursor?: string,
  ipAddress?: string
) => {
  const conversation = await Conversation.findById(conversationId);

  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  const query: Record<string, unknown> = {
    conversationId: conversation._id,
  };

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = messages.length > limit;
  const data = hasMore ? messages.slice(0, limit) : messages;

  await createAdminLog(
    adminId,
    "view_conversation",
    "conversation",
    conversationId,
    { limit, cursor: cursor ?? null },
    ipAddress
  );

  return {
    messages: data.map((m: any) => ({
      id: m._id.toString(),
      senderId: m.senderId?.toString(),
      type: m.type,
      content: m.content,
      mediaUrl: m.mediaUrl,
      unsent: m.unsent,
      createdAt: m.createdAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getBans = async (
  active?: boolean,
  limit: number = 20,
  cursor?: string
) => {
  const query: Record<string, unknown> = {};

  if (typeof active === "boolean") {
    query.active = active;
  }

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const bans = await Ban.find(query)
    .populate("userId", "username anonimiId profileImage")
    .populate("bannedBy", "username")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = bans.length > limit;
  const data = hasMore ? bans.slice(0, limit) : bans;

  return {
    bans: data.map((b: any) => ({
      id: b._id.toString(),
      userId: b.userId?._id?.toString(),
      username: b.userId?.username,
      anonimiId: b.userId?.anonimiId,
      profileImage: b.userId?.profileImage ?? null,
      reason: b.reason,
      type: b.type,
      expiresAt: b.expiresAt,
      bannedBy: b.bannedBy?.username,
      createdAt: b.createdAt,
      active: b.active,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getAnalytics = async () => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ status: "active" });
  const groupsCreated = await Group.countDocuments();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const messagesLast24h = await Message.countDocuments({ createdAt: { $gte: yesterday } });

  const pendingReports = await Report.countDocuments({ status: "pending" });
  const openTickets = await SupportTicket.countDocuments({
    status: { $in: ["open", "assigned", "in_progress"] },
  });
  const activeBans = await Ban.countDocuments({ active: true });

  return {
    totalUsers,
    activeUsers,
    messagesLast24h,
    groupsCreated,
    pendingReports,
    openTickets,
    activeBans,
  };
};

export const getAdminLogs = async (
  requesterRole: UserRole,
  adminId?: string,
  action?: string,
  limit: number = 50,
  cursor?: string,
  sort: "newest" | "oldest" = "newest",
  search?: string
) => {
  const query: Record<string, unknown> = {};
  const andClauses: Record<string, unknown>[] = [];

  if (action) andClauses.push({ action });
  if (cursor) {
    andClauses.push({
      _id: {
      [sort === "oldest" ? "$gt" : "$lt"]: new Types.ObjectId(cursor),
      },
    });
  }

  const normalizedSearch = search?.trim();
  let adminSearchIds: string[] = [];
  let targetUserIds: string[] = [];
  let searchRegex: RegExp | undefined;
  if (normalizedSearch) {
    const escaped = normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    searchRegex = new RegExp(escaped, "i");

    const users = await User.find({
      $or: [
        { username: searchRegex },
        { anonimiId: searchRegex },
        { email: searchRegex },
      ],
    })
      .select("_id")
      .lean();

    adminSearchIds = users.map((u: any) => u._id.toString());
    targetUserIds = adminSearchIds;
  }

  let adminIdFilter: string[] | undefined;
  if (requesterRole === UserRole.MODERATOR) {
    const supportStaff = await User.find({ role: UserRole.SUPPORT_STAFF })
      .select("_id")
      .lean();
    const supportIds = supportStaff.map((u: any) => u._id.toString());

    if (adminId && !supportIds.includes(adminId)) {
      return { logs: [], nextCursor: undefined };
    }

    adminIdFilter = supportIds;
  } else if (adminId) {
    adminIdFilter = [adminId];
  }

  if (adminIdFilter) {
    if (adminSearchIds.length > 0) {
      const intersection = adminIdFilter.filter((id) => adminSearchIds.includes(id));
      if (!intersection.length) {
        return { logs: [], nextCursor: undefined };
      }
      adminIdFilter = intersection;
    }

    andClauses.push({
      adminId: { $in: adminIdFilter.map((id) => new Types.ObjectId(id)) },
    });
  }

  if (searchRegex) {
    const orClauses: Record<string, unknown>[] = [
      { action: searchRegex },
      { targetType: searchRegex },
      { "details.message": searchRegex },
      { "details.reason": searchRegex },
      { "details.notes": searchRegex },
      { "details.resolution": searchRegex },
      { "details.requestId": searchRegex },
    ];

    if (adminSearchIds.length && !adminIdFilter) {
      orClauses.push({
        adminId: { $in: adminSearchIds.map((id) => new Types.ObjectId(id)) },
      });
    }

    if (targetUserIds.length) {
      orClauses.push({
        targetId: { $in: targetUserIds.map((id) => new Types.ObjectId(id)) },
      });
    }

    andClauses.push({ $or: orClauses });
  }

  if (andClauses.length) {
    query.$and = andClauses;
  }

  const sortClause = sort === "oldest" ? { createdAt: 1 } : { createdAt: -1 };

  const logs = await AdminLog.find(query)
    .populate("adminId", "username role")
    .sort(sortClause)
    .limit(limit + 1)
    .lean();

  const hasMore = logs.length > limit;
  const data = hasMore ? logs.slice(0, limit) : logs;

  return {
    logs: data.map((l: any) => ({
      id: l._id.toString(),
      adminId: l.adminId?._id?.toString(),
      adminUsername: l.adminId?.username,
      action: l.action,
      targetType: l.targetType,
      targetId: l.targetId?.toString(),
      details: l.details,
      createdAt: l.createdAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getDeletionRequests = async (
  status: "pending" | "approved" | "rejected" | undefined,
  limit: number = 50,
  cursor?: string
) => {
  const query: Record<string, unknown> = {};

  if (status) query.status = status;
  if (cursor) query._id = { $lt: new Types.ObjectId(cursor) };

  const requests = await UserDeletionRequest.find(query)
    .populate("userId", "username anonimiId profileImage role")
    .populate("requestedBy", "username")
    .populate("decidedBy", "username")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = requests.length > limit;
  const data = hasMore ? requests.slice(0, limit) : requests;

  return {
    requests: data.map((r: any) => ({
      id: r._id.toString(),
      status: r.status,
      reason: r.reason ?? null,
      createdAt: r.createdAt,
      decidedAt: r.decidedAt ?? null,
      user: r.userId
        ? {
            id: r.userId?._id?.toString(),
            username: r.userId?.username,
            anonimiId: r.userId?.anonimiId,
            profileImage: r.userId?.profileImage ?? null,
            role: r.userId?.role ?? null,
          }
        : null,
      requestedBy: r.requestedBy
        ? {
            id: r.requestedBy?._id?.toString(),
            username: r.requestedBy?.username,
          }
        : null,
      decidedBy: r.decidedBy
        ? {
            id: r.decidedBy?._id?.toString(),
            username: r.decidedBy?.username,
          }
        : null,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const approveDeletionRequest = async (
  adminId: string,
  requestId: string,
  ipAddress?: string
) => {
  const request = await UserDeletionRequest.findOne({
    _id: new Types.ObjectId(requestId),
    status: "pending",
  });

  if (!request) {
    throw new NotFoundError("Delete request not found");
  }

  const user = await User.findById(request.userId).select("role");
  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (user.role === UserRole.SUPER_ADMIN) {
    throw new ForbiddenError("Cannot delete a super admin");
  }

  await removeUserData(user._id.toString());

  request.status = "approved";
  request.decidedBy = new Types.ObjectId(adminId);
  request.decidedAt = new Date();
  await request.save();

  await createAdminLog(adminId, "approve_delete_user", "user", user._id.toString(), {
    requestId,
  }, ipAddress);
  await createAdminLog(adminId, "delete_user", "user", user._id.toString(), {}, ipAddress);

  return { message: "User deleted" };
};

export const rejectDeletionRequest = async (
  adminId: string,
  requestId: string,
  ipAddress?: string
) => {
  const request = await UserDeletionRequest.findOne({
    _id: new Types.ObjectId(requestId),
    status: "pending",
  });

  if (!request) {
    throw new NotFoundError("Delete request not found");
  }

  request.status = "rejected";
  request.decidedBy = new Types.ObjectId(adminId);
  request.decidedAt = new Date();
  await request.save();

  await createAdminLog(adminId, "reject_delete_user", "user", request.userId.toString(), {
    requestId,
  }, ipAddress);

  return { message: "Delete request rejected" };
};

export const getWarnings = async (limit: number = 50, cursor?: string) => {
  const query: Record<string, unknown> = { action: "warn_user" };

  if (cursor) query._id = { $lt: new Types.ObjectId(cursor) };

  const logs = await AdminLog.find(query)
    .populate("adminId", "username")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = logs.length > limit;
  const data = hasMore ? logs.slice(0, limit) : logs;

  const userIds = data
    .map((log: any) => log.targetId?.toString())
    .filter((id: string | undefined) => !!id);

  const users = await User.find({ _id: { $in: userIds } })
    .select("username anonimiId profileImage")
    .lean();

  const userLookup = new Map(
    users.map((u: any) => [u._id.toString(), u])
  );

  return {
    warnings: data.map((log: any) => {
      const targetId = log.targetId?.toString();
      const targetUser = targetId ? userLookup.get(targetId) : null;

      return {
        id: log._id.toString(),
        userId: targetId ?? null,
        username: targetUser?.username ?? null,
        anonimiId: targetUser?.anonimiId ?? null,
        profileImage: targetUser?.profileImage ?? null,
        adminId: log.adminId?._id?.toString(),
        adminUsername: log.adminId?.username,
        message: log.details?.message ?? null,
        createdAt: log.createdAt,
      };
    }),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};
