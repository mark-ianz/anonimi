import mongoose, { Schema, Document, Types } from "mongoose";
import { IReport } from "../types/models";
import { ReportStatus } from "../types/enums";

const reportSchema = new Schema<IReport>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    targetType: { type: String, enum: ["user", "message", "group"], required: true },
    targetId: { type: Schema.Types.ObjectId, required: true },
    reason: { type: String, required: true },
    description: { type: String },
    messageSnapshot: {
      content: { type: String },
      type: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      senderUsername: { type: String },
      conversationId: { type: Schema.Types.ObjectId, ref: "Conversation" },
      mediaUrl: { type: String },
      originalCreatedAt: { type: Date },
    },
    status: { type: String, enum: ReportStatus, default: ReportStatus.PENDING },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    resolution: { type: String },
    resolutionNotes: { type: String },
    reporterNote: { type: String },
  },
  { timestamps: true }
);

reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporterId: 1 });
reportSchema.index({ targetType: 1, targetId: 1 });
reportSchema.index({ reviewedBy: 1 });

export const Report = mongoose.model<IReport>("Report", reportSchema);
