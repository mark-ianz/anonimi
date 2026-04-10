import mongoose, { Schema, Document, Types } from "mongoose";
import { IUser } from "../types/models";
import {
  UserRole,
  UserStatus,
  OnlineStatus,
  AppearanceStatus,
  FontStyle,
} from "../types/enums";

const userSchema = new Schema<IUser>(
  {
    anonimiId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
    email: { type: String, sparse: true },
    phone: { type: String, sparse: true },
    passwordHash: { type: String, select: false },
    profileImage: { type: String },
    isTemporary: { type: Boolean, default: false },
    tempCreatedAt: { type: Date },
    tempExpiresAt: { type: Date },
    tempMediaCount: { type: Number, default: 0 },
    role: { type: String, enum: UserRole, default: UserRole.USER },
    status: { type: String, enum: UserStatus, default: UserStatus.PENDING },
    appearanceStatus: { type: String, enum: AppearanceStatus, default: AppearanceStatus.ONLINE },
    fontStyle: { type: String, enum: FontStyle, default: FontStyle.MODERN },
    onlineStatus: { type: String, enum: OnlineStatus, default: OnlineStatus.OFFLINE },
    lastSeen: { type: Date },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpiresAt: { type: Date },
    emailVerificationTokenHash: { type: String },
    emailVerificationTokenExpiresAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiresAt: { type: Date },
    usernameChangedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ username: "text", anonimiId: "text" });
userSchema.index({ anonimiId: 1 }, { unique: true });
userSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { email: { $type: "string", $ne: null } } }
);
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isTemporary: 1, tempExpiresAt: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
