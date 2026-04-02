import mongoose, { Schema } from "mongoose";
import { IUserDeletionRequest } from "../types/models";

const userDeletionRequestSchema = new Schema<IUserDeletionRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      required: true,
    },
    reason: { type: String },
    decidedBy: { type: Schema.Types.ObjectId, ref: "User" },
    decidedAt: { type: Date },
  },
  { timestamps: true }
);

userDeletionRequestSchema.index({ status: 1, createdAt: -1 });
userDeletionRequestSchema.index({ userId: 1, status: 1 });
userDeletionRequestSchema.index(
  { userId: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
  }
);

export const UserDeletionRequest = mongoose.model<IUserDeletionRequest>(
  "UserDeletionRequest",
  userDeletionRequestSchema
);
