import mongoose, { Schema, Document, Types } from "mongoose";
import { IMessage } from "../types/models";
import { MessageType } from "../types/enums";

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: MessageType, required: true },
    content: { type: String },
    isStealth: { type: Boolean, default: false },
    stealthExpiresAt: { type: Date },
    stealthExpiredAt: { type: Date },
    contentCipher: { type: String },
    contentIv: { type: String },
    contentTag: { type: String },
    contentLength: { type: Number },
    mediaUrl: { type: String },
    fileName: { type: String },
    fileSize: { type: Number },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message" },
    replyPreview: {
      messageId: { type: Schema.Types.ObjectId, ref: "Message" },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      senderUsername: { type: String },
      type: { type: String, enum: MessageType },
      content: { type: String },
      mediaUrl: { type: String },
      fileName: { type: String },
      createdAt: { type: Date },
    },
    readBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    readByAt: { type: Map, of: Date, default: {} },
    reactions: [
      {
        emoji: { type: String, required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    editHistory: [
      {
        content: { type: String },
        isE2ee: { type: Boolean, default: false },
        contentCipher: { type: String },
        contentIv: { type: String },
        contentTag: { type: String },
        contentKeyVersion: { type: Number },
        editedAt: { type: Date, default: Date.now },
        editedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
      },
    ],
    editedAt: { type: Date },
    editedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedFor: [{ type: Schema.Types.ObjectId, ref: "User" }],
    unsent: { type: Boolean, default: false },
    isE2ee: { type: Boolean, default: false },
    contentKeyVersion: { type: Number },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, _id: -1 });
messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1 });
messageSchema.index({ conversationId: 1, deletedFor: 1 });

export const Message = mongoose.model<IMessage>("Message", messageSchema);
