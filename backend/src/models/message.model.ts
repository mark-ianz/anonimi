import mongoose, { Schema, Document, Types } from "mongoose";
import { IMessage } from "../types/models";
import { MessageType } from "../types/enums";

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: MessageType, required: true },
    content: { type: String },
    mediaUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    unsent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, _id: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ conversationId: 1, deletedFor: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
