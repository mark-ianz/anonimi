import mongoose, { Schema } from "mongoose";
import { IGroupInviteLink } from "../types/models";

const groupInviteLinkSchema = new Schema<IGroupInviteLink>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    token: { type: String, required: true, unique: true, index: true },
    description: { type: String, maxlength: 200 },
    expiresAt: { type: Date, required: true, index: true },
    revokedAt: { type: Date },
    revokedBy: { type: Schema.Types.ObjectId, ref: "User" },
    maxUses: { type: Number },
    usedCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
  },
  { timestamps: true }
);

groupInviteLinkSchema.index({ groupId: 1, createdAt: -1 });
groupInviteLinkSchema.index({ groupId: 1, revokedAt: 1, expiresAt: 1 });

export const GroupInviteLink = mongoose.model<IGroupInviteLink>(
  "GroupInviteLink",
  groupInviteLinkSchema
);
