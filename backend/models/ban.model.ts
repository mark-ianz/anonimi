import mongoose, { Schema, Document, Types } from "mongoose";
import { IBan } from "../types/models";
import { BanType } from "../types/enums";

const banSchema = new Schema<IBan>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    reason: { type: String, required: true },
    bannedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: BanType, required: true },
    expiresAt: { type: Date },
    active: { type: Boolean, default: true },
    unbannedBy: { type: Schema.Types.ObjectId, ref: "User" },
    unbannedAt: { type: Date },
  },
  { timestamps: true }
);

banSchema.index({ userId: 1, active: 1 });
banSchema.index({ expiresAt: 1 });
banSchema.index({ bannedBy: 1 });

export const Ban = mongoose.model<IBan>("Ban", banSchema);
