import { Types } from "mongoose";
import { Report } from "../models/report.model";
import { Message } from "../models/message.model";
import { User } from "../models/user.model";
import { Group } from "../models/group.model";
import { NotFoundError } from "../utils/apiError";

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

  return {
    reportId: report._id.toString(),
    message: "Report submitted. Our team will review it.",
  };
};
