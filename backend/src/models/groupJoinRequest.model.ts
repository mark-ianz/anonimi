import mongoose, { Schema } from "mongoose";
import { IGroupJoinRequest } from "../types/models";

const groupJoinRequestSchema = new Schema<IGroupJoinRequest>(
  {
    groupId: { type: Schema.Types.ObjectId, ref: "Group", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    inviterUserId: { type: Schema.Types.ObjectId, ref: "User" },
    source: {
      type: String,
      enum: ["manual_add", "invite_link", "direct"],
      default: "direct",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "cancelled"],
      default: "pending",
      required: true,
    },
    inviteLinkId: { type: Schema.Types.ObjectId, ref: "GroupInviteLink" },
    decisionBy: { type: Schema.Types.ObjectId, ref: "User" },
    decisionAt: { type: Date },
  },
  { timestamps: true }
);

groupJoinRequestSchema.index({ groupId: 1, status: 1, createdAt: -1 });
groupJoinRequestSchema.index({ userId: 1, status: 1 });
groupJoinRequestSchema.index(
  { groupId: 1, userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

export const GroupJoinRequest = mongoose.model<IGroupJoinRequest>(
  "GroupJoinRequest",
  groupJoinRequestSchema
);
