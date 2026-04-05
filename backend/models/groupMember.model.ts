import mongoose, { Schema, Document, Types } from "mongoose";
import { IGroupMember } from "../types/models";
import { GroupRole } from "../types/enums";

const groupMemberSchema = new Schema<IGroupMember>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: GroupRole, default: GroupRole.MEMBER },
    nickname: { type: String },
    mutedUntil: { type: Date },
    muteReason: { type: String },
    joinedVia: {
      type: String,
      enum: ["group_create", "manual_add", "invite_link", "direct_request"],
    },
    addedByUserId: { type: Schema.Types.ObjectId, ref: "User" },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

groupMemberSchema.index({ groupId: 1, userId: 1 }, { unique: true });
groupMemberSchema.index({ groupId: 1, role: 1 });
groupMemberSchema.index({ userId: 1 });

export const GroupMember = mongoose.model<IGroupMember>(
  "GroupMember",
  groupMemberSchema
);
