import mongoose, { Schema, Document, Types } from "mongoose";
import { IMessageRequest } from "../types/models";
import { RequestStatus } from "../types/enums";

const messageRequestSchema = new Schema<IMessageRequest>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    fromUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    toUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: RequestStatus, default: RequestStatus.PENDING },
  },
  { timestamps: true }
);

messageRequestSchema.index({ toUserId: 1, status: 1 });
messageRequestSchema.index({ conversationId: 1 }, { unique: true });
messageRequestSchema.index({ fromUserId: 1, toUserId: 1 });

export const MessageRequest = mongoose.model<IMessageRequest>(
  "MessageRequest",
  messageRequestSchema
);
