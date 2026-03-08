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
import { NotFoundError, ForbiddenError, ConflictError } from "../utils/apiError";
import { UserRole, UserStatus } from "../types/enums";

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

export const getUsers = async (
  search?: string,
  status?: string,
  limit: number = 20,
  cursor?: string
) => {
  const query: Record<string, unknown> = {};

  if (search) {
    query.$or = [
      { username: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { echoId: { $regex: search, $options: "i" } },
    ];
  }

  if (status) {
    query.status = status;
  }

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const users = await User.find(query)
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = users.length > limit;
  const data = hasMore ? users.slice(0, limit) : users;

  return {
    users: data.map((u: any) => ({
      id: u._id.toString(),
      echoId: u.echoId,
      username: u.username,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
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
    echoId: user.echoId,
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
    .populate("reporterId", "username echoId")
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
      status: r.status,
      createdAt: r.createdAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getReportById = async (reportId: string) => {
  const report = await Report.findById(reportId)
    .populate("reporterId", "username echoId")
    .populate("reviewedBy", "username")
    .lean();

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  return report;
};

export const resolveReport = async (
  adminId: string,
  reportId: string,
  resolution: string,
  notes?: string,
  ipAddress?: string
) => {
  const report = await Report.findById(reportId);

  if (!report) {
    throw new NotFoundError("Report not found");
  }

  report.status = "resolved";
  report.resolution = resolution;
  report.resolutionNotes = notes;
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
    .populate("userId", "username echoId")
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
      assignedTo: t.assignedTo?._id?.toString(),
      createdAt: t.createdAt,
    })),
    nextCursor: hasMore ? data[data.length - 1]._id.toString() : undefined,
  };
};

export const getAdminTicketById = async (ticketId: string) => {
  const ticket = await SupportTicket.findById(ticketId)
    .populate("userId", "username echoId")
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
      assignedTo: ticket.assignedTo?._id?.toString(),
    },
    messages: messages.map((m: any) => ({
      id: m._id.toString(),
      senderId: m.senderId?._id?.toString(),
      senderUsername: m.senderId?.username,
      senderRole: m.senderRole,
      content: m.content,
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

  return { message: "Ticket status updated" };
};

export const replyToTicketAsStaff = async (
  adminId: string,
  ticketId: string,
  content: string
) => {
  const ticket = await SupportTicket.findById(ticketId);

  if (!ticket) {
    throw new NotFoundError("Ticket not found");
  }

  const message = await SupportMessage.create({
    ticketId: ticket._id,
    senderId: new Types.ObjectId(adminId),
    senderRole: "staff",
    content,
  });

  ticket.status = "in_progress";
  await ticket.save();

  return {
    messageId: message._id.toString(),
    content: message.content,
    senderRole: message.senderRole,
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
    .populate("ownerId", "username echoId")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = groups.length > limit;
  const data = hasMore ? groups.slice(0, limit) : groups;

  const enriched = await Promise.all(
    data.map(async (g: any) => {
      const memberCount = await GroupMember.countDocuments({ groupId: g._id });
      return {
        id: g._id.toString(),
        name: g.name,
        image: g.image,
        ownerId: g.ownerId?._id?.toString(),
        ownerUsername: g.ownerId?.username,
        memberCount,
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
    .populate("ownerId", "username echoId")
    .lean();

  if (!group) {
    throw new NotFoundError("Group not found");
  }

  const members = await GroupMember.find({ groupId: group._id })
    .populate("userId", "username echoId")
    .lean();

  return {
    id: group._id.toString(),
    name: group.name,
    image: group.image,
    ownerId: group.ownerId?._id?.toString(),
    ownerUsername: group.ownerId?.username,
    settings: group.settings,
    members: members.map((m: any) => ({
      userId: m.userId?._id?.toString(),
      username: m.userId?.username,
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
  conversationId: string,
  limit: number = 50,
  cursor?: string
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
  active: boolean = true,
  limit: number = 20,
  cursor?: string
) => {
  const query: Record<string, unknown> = { active };

  if (cursor) {
    query._id = { $lt: new Types.ObjectId(cursor) };
  }

  const bans = await Ban.find(query)
    .populate("userId", "username echoId")
    .populate("bannedBy", "username")
    .sort({ createdAt: -1 })
    .limit(limit + 1)
    .lean();

  const hasMore = bans.length > limit;
  const data = hasMore ? bans.slice(0, limit) : data;

  return {
    bans: data.map((b: any) => ({
      id: b._id.toString(),
      userId: b.userId?._id?.toString(),
      username: b.userId?.username,
      reason: b.reason,
      type: b.type,
      expiresAt: b.expiresAt,
      bannedBy: b.bannedBy?.username,
      createdAt: b.createdAt,
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
  adminId?: string,
  action?: string,
  limit: number = 50,
  cursor?: string
) => {
  const query: Record<string, unknown> = {};

  if (adminId) query.adminId = new Types.ObjectId(adminId);
  if (action) query.action = action;
  if (cursor) query._id = { $lt: new Types.ObjectId(cursor) };

  const logs = await AdminLog.find(query)
    .populate("adminId", "username")
    .sort({ createdAt: -1 })
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
