import mongoose, { Schema } from "mongoose";
import { IConversationArchive } from "../types/models";

const conversationArchiveSchema = new Schema<IConversationArchive>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    archivedAt: { type: Date, default: Date.now },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

conversationArchiveSchema.index({ conversationId: 1, userId: 1 }, { unique: true });
conversationArchiveSchema.index({ userId: 1, archivedAt: -1 });

export const ConversationArchive = mongoose.model<IConversationArchive>(
  "ConversationArchive",
  conversationArchiveSchema
);
