import mongoose, { Schema, Document, Types } from "mongoose";
import { IUser } from "../types/models";
import { UserRole, UserStatus, OnlineStatus } from "../types/enums";

const userSchema = new Schema<IUser>(
  {
    echoId: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true, minlength: 3, maxlength: 30 },
    email: { type: String, required: true, unique: true },
    phone: { type: String, sparse: true },
    passwordHash: { type: String, required: true, select: false },
    profileImage: { type: String },
    role: { type: String, enum: UserRole, default: UserRole.USER },
    status: { type: String, enum: UserStatus, default: UserStatus.PENDING },
    onlineStatus: { type: String, enum: OnlineStatus, default: OnlineStatus.OFFLINE },
    lastSeen: { type: Date },
    emailVerified: { type: Boolean, default: false },
    phoneVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpiresAt: { type: Date },
    passwordResetToken: { type: String },
    passwordResetExpiresAt: { type: Date },
    usernameChangedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.index({ username: "text", echoId: "text" });
userSchema.index({ status: 1 });
userSchema.index({ role: 1 });

export const User = mongoose.model<IUser>("User", userSchema);
