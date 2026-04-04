import mongoose, { Schema } from "mongoose";
import { IConversationKey } from "../types/models";

const conversationKeySchema = new Schema<IConversationKey>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    keyVersion: { type: Number, required: true, default: 1 },
    encryptedKeys: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        encryptedKey: { type: String, required: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

conversationKeySchema.index({ conversationId: 1, keyVersion: -1 }, { unique: true });
conversationKeySchema.index({ conversationId: 1 });

export const ConversationKey = mongoose.model<IConversationKey>("ConversationKey", conversationKeySchema);
