import mongoose, { Schema, Document, Types } from "mongoose";
import { ISupportMessage } from "../types/models";

const supportMessageSchema = new Schema<ISupportMessage>(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: "SupportTicket", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderRole: { type: String, enum: ["user", "staff"], required: true },
    type: { type: String, enum: ["text", "image"], default: "text" },
    content: { type: String },
    mediaUrl: { type: String },
  },
  { timestamps: true }
);

supportMessageSchema.index({ ticketId: 1, createdAt: 1 });

export const SupportMessage = mongoose.model<ISupportMessage>(
  "SupportMessage",
  supportMessageSchema
);
