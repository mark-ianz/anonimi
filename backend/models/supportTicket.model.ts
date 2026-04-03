import mongoose, { Schema, Document, Types } from "mongoose";
import { ISupportTicket } from "../types/models";
import { TicketStatus } from "../types/enums";

const supportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    reason: { type: String, required: true },
    status: { type: String, enum: TicketStatus, default: TicketStatus.OPEN },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ userId: 1 });
supportTicketSchema.index({ assignedTo: 1, status: 1 });

export const SupportTicket = mongoose.model<ISupportTicket>(
  "SupportTicket",
  supportTicketSchema
);
