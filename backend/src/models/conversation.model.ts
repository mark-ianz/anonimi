import mongoose, { Schema, Document, Types } from "mongoose";
import { IConversation } from "../types/models";
import { ConversationType } from "../types/enums";

const conversationSchema = new Schema<IConversation>(
  {
    type: { type: String, enum: ConversationType, required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    lastMessage: {
      content: { type: String },
      senderId: { type: Schema.Types.ObjectId, ref: "User" },
      type: { type: String },
      timestamp: { type: Date },
    },
    requestStatus: { type: String },
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1 });
conversationSchema.index({ participants: 1, type: 1 });
conversationSchema.index({ updatedAt: -1 });
conversationSchema.index({ requestStatus: 1, participants: 1 });

export const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema
);
