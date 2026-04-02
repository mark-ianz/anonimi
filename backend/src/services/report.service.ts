import { Types } from "mongoose";
import { Report } from "../models/report.model";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { Group } from "../models/group.model";
import { NotFoundError } from "../utils/apiError";
import { emitToAdmins, emitToUser } from "./notification.service";

export const createReport = async (
  reporterId: string,
  targetType: "user" | "message" | "group",
  targetId: string,
  reason: string,
  description?: string
) => {
  let messageSnapshot = undefined;

  if (targetType === "message") {
    const message = await Message.findById(targetId)
      .populate("senderId", "username")
      .populate("conversationId");

    if (message) {
      messageSnapshot = {
        content: message.content || "",
        type: message.type,
        senderId: message.senderId?._id as Types.ObjectId,
        senderUsername: (message.senderId as any)?.username || "Unknown",
        conversationId: message.conversationId as Types.ObjectId,
        mediaUrl: message.mediaUrl,
        originalCreatedAt: message.createdAt,
      };
    }
  }

  const report = await Report.create({
    reporterId: new Types.ObjectId(reporterId),
    targetType,
    targetId: new Types.ObjectId(targetId),
    reason,
    description,
    messageSnapshot,
    status: "pending",
  });

  emitToUser(reporterId, "support:report:new", {
    reportId: report._id.toString(),
    status: report.status,
    updatedAt: report.updatedAt?.toISOString?.() ?? new Date().toISOString(),
  });
  emitToAdmins("admin:report:new", {
    reportId: report._id.toString(),
    reporterId,
    targetType,
    reason,
    createdAt: report.createdAt,
  });

  return {
    reportId: report._id.toString(),
    message: "Report submitted. Our team will review it.",
  };
};

export const getReportsByUser = async (userId: string) => {
  const reports = await Report.find({ reporterId: new Types.ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .lean();

  return reports.map((r: any) => ({
    id: r._id.toString(),
    targetType: r.targetType,
    targetId: r.targetId.toString(),
    reason: r.reason,
    description: r.description ?? null,
    status: r.status,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
};
