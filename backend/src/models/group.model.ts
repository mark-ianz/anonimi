import mongoose, { Schema, Document, Types } from "mongoose";
import { IGroup } from "../types/models";

const groupSchema = new Schema<IGroup>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    name: { type: String, required: true, minlength: 1, maxlength: 100 },
    description: { type: String, maxlength: 500 },
    image: { type: String },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    settings: {
      joinRequestEnabled: { type: Boolean, default: false },
      nicknameEditPolicy: {
        type: String,
        enum: ["admins_only", "all_members"],
        default: "all_members",
      },
    },
    disbandedAt: { type: Date },
  },
  { timestamps: true }
);

groupSchema.index({ conversationId: 1 }, { unique: true });
groupSchema.index({ ownerId: 1 });
groupSchema.index({ disbandedAt: 1 });

export const Group = mongoose.model<IGroup>("Group", groupSchema);
