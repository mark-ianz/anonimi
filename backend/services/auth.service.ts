import crypto from "crypto";
import fs from "fs";
import path from "path";
import { Types } from "mongoose";
import { User } from "../models/user.model";
import { RefreshToken } from "../models/refreshToken.model";
import { Ban } from "../models/ban.model";
import { generateAnonimiId } from "../utils/generateId";
import { hashPassword, comparePassword } from "../utils/hashPassword";
import {
  generateAccessToken,
  generateRefreshToken as generateRefreshTokenUtil,
  verifyRefreshToken,
} from "../utils/jwt";
import { ConflictError, UnauthorizedError, NotFoundError, ForbiddenError } from "../utils/apiError";
import { AppearanceStatus, OnlineStatus, UserRole, UserStatus } from "../types/enums";
import { createAdminLog } from "./admin.service";
import { env } from "../config/env";
import { sendPasswordResetEmail, sendVerificationEmail } from "./email.service";
import { removeTemporaryAccount } from "./temporaryAccount.service";

interface RegisterResult {
  message: string;
  verificationTarget: string;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    anonimiId: string;
    username: string;
    profileImage: string | null;
    role: string;
    status: string;
    usernameCanEdit: boolean;
    appearanceStatus: string;
    onlineStatus: string;
    lastSeen: Date | null;
    isTemporary: boolean;
    tempExpiresAt: Date | null;
  };
}

interface VerificationStatusResult {
  canVerify: boolean;
  reason: "pending" | "not_found" | "already_verified" | "not_pending" | "no_code" | "code_expired";
  type: "email" | "phone";
  target: string;
}

interface ResendVerificationResult {
  message: string;
  verificationTarget: "email" | "phone";
}

const USERNAME_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
const EMAIL_VERIFICATION_TTL_MS = 15 * 60 * 1000;
const TEMP_ACCOUNT_TTL_MS = 24 * 60 * 60 * 1000;

const generateCryptoUsername = (): string => {
  const bytes = crypto.randomBytes(6);
  let suffix = "";

  for (const byte of bytes) {
    suffix += USERNAME_ALPHABET[byte % USERNAME_ALPHABET.length];
  }

  return `anon_${suffix}`;
};

const generateTempUsername = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const bytes = crypto.randomBytes(6);
    let suffix = "";

    for (const byte of bytes) {
      suffix += USERNAME_ALPHABET[byte % USERNAME_ALPHABET.length];
    }

    const candidate = `temp_${suffix}`;
    const existing = await User.findOne({ username: candidate }).select("_id");
    if (!existing) {
      return candidate;
    }
  }

  throw new ConflictError("Unable to generate temporary username. Please try again.");
};

const resolveUniqueUsername = async (preferredUsername?: string): Promise<string> => {
  if (preferredUsername) {
    const existing = await User.findOne({ username: preferredUsername }).select("_id");
    if (existing) {
      throw new ConflictError("Username already taken");
    }

    return preferredUsername;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateCryptoUsername();
    const existing = await User.findOne({ username: candidate }).select("_id");
    if (!existing) {
      return candidate;
    }
  }

  throw new ConflictError("Unable to generate unique username. Please try again.");
};

const hashEmailToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

const createEmailVerificationPayload = () => {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
  const token = crypto.randomBytes(32).toString("hex");

  return {
    code,
    expiresAt,
    token,
    tokenHash: hashEmailToken(token),
  };
};

const buildEmailVerificationLink = (token: string, email: string): string => {
  const baseUrl = env.EMAIL_VERIFY_URL || `${env.FRONTEND_URL}/verify-link`;
  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("email", email);
  return url.toString();
};

const buildPasswordResetLink = (token: string): string => {
  const baseUrl = env.RESET_PASSWORD_URL || `${env.FRONTEND_URL}/reset-password`;
  const url = new URL(baseUrl);
  url.searchParams.set("token", token);
  return url.toString();
};

const isTemporaryExpired = (user: { isTemporary?: boolean; tempExpiresAt?: Date | null }) => {
  if (!user.isTemporary || !user.tempExpiresAt) return false;
  return user.tempExpiresAt.getTime() <= Date.now();
};

export const createTemporaryAccount = async (): Promise<LoginResult> => {
  const tempUsername = await generateTempUsername();
  const now = new Date();
  const tempExpiresAt = new Date(now.getTime() + TEMP_ACCOUNT_TTL_MS);

  const user = await User.create({
    anonimiId: generateAnonimiId(),
    username: tempUsername,
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    isTemporary: true,
    tempCreatedAt: now,
    tempExpiresAt,
  });

  const tokens = await generateTokens(user._id.toString(), user.anonimiId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      anonimiId: user.anonimiId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt && !user.isTemporary,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      isTemporary: true,
      tempExpiresAt,
    },
  };
};

export const register = async (
  email: string,
  username: string | undefined,
  password: string
): Promise<RegisterResult> => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ConflictError("Email already in use");
  }

  const resolvedUsername = await resolveUniqueUsername(username);

  const emailVerification = createEmailVerificationPayload();

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    anonimiId: generateAnonimiId(),
    email: normalizedEmail,
    username: resolvedUsername,
    passwordHash,
    verificationCode: emailVerification.code,
    verificationCodeExpiresAt: emailVerification.expiresAt,
    emailVerificationTokenHash: emailVerification.tokenHash,
    emailVerificationTokenExpiresAt: emailVerification.expiresAt,
    role: UserRole.USER,
    status: UserStatus.PENDING,
  });

  const verificationLink = buildEmailVerificationLink(
    emailVerification.token,
    normalizedEmail
  );

  await sendVerificationEmail({
    to: normalizedEmail,
    code: emailVerification.code,
    link: verificationLink,
  });

  return {
    message: "Verification code sent. Please verify your account.",
    verificationTarget: "email",
  };
};

export const verifyEmail = async (
  email: string,
  code: string
): Promise<LoginResult> => {
  const user = await User.findOne({ email, verificationCode: code });

  if (!user) {
    throw new UnauthorizedError("Invalid verification code");
  }

  if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
    throw new UnauthorizedError("Verification code expired");
  }

  user.emailVerified = true;
  if (user.isTemporary) {
    user.isTemporary = false;
    user.tempCreatedAt = undefined;
    user.tempExpiresAt = undefined;
    user.tempMediaCount = 0;
  }
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationTokenExpiresAt = undefined;
  user.status = UserStatus.ACTIVE;
  await user.save();

  const tokens = await generateTokens(user._id.toString(), user.anonimiId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      anonimiId: user.anonimiId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt && !user.isTemporary,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      isTemporary: !!user.isTemporary,
      tempExpiresAt: user.tempExpiresAt ?? null,
    },
  };
};

export const verifyEmailLink = async (token: string): Promise<LoginResult> => {
  const tokenHash = hashEmailToken(token);
  const user = await User.findOne({ emailVerificationTokenHash: tokenHash });

  if (!user) {
    throw new UnauthorizedError("Invalid verification link");
  }

  if (user.emailVerified) {
    throw new ConflictError("Account already verified");
  }

  if (user.status !== UserStatus.PENDING) {
    throw new ConflictError("Account is not pending verification");
  }

  if (
    user.emailVerificationTokenExpiresAt &&
    user.emailVerificationTokenExpiresAt < new Date()
  ) {
    throw new UnauthorizedError("Verification link expired");
  }

  user.emailVerified = true;
  if (user.isTemporary) {
    user.isTemporary = false;
    user.tempCreatedAt = undefined;
    user.tempExpiresAt = undefined;
    user.tempMediaCount = 0;
  }
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationTokenExpiresAt = undefined;
  user.status = UserStatus.ACTIVE;
  await user.save();

  const tokens = await generateTokens(user._id.toString(), user.anonimiId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      anonimiId: user.anonimiId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt && !user.isTemporary,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      isTemporary: !!user.isTemporary,
      tempExpiresAt: user.tempExpiresAt ?? null,
    },
  };
};

export const verifyPhone = async (
  phone: string,
  code: string
): Promise<LoginResult> => {
  const user = await User.findOne({ phone, verificationCode: code });

  if (!user) {
    throw new UnauthorizedError("Invalid verification code");
  }

  if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
    throw new UnauthorizedError("Verification code expired");
  }

  user.phoneVerified = true;
  if (user.isTemporary) {
    user.isTemporary = false;
    user.tempCreatedAt = undefined;
    user.tempExpiresAt = undefined;
    user.tempMediaCount = 0;
  }
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  user.status = UserStatus.ACTIVE;
  await user.save();

  const tokens = await generateTokens(user._id.toString(), user.anonimiId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      anonimiId: user.anonimiId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt && !user.isTemporary,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      isTemporary: !!user.isTemporary,
      tempExpiresAt: user.tempExpiresAt ?? null,
    },
  };
};

export const getVerificationStatus = async (
  type: "email" | "phone",
  target: string
): Promise<VerificationStatusResult> => {
  const normalizedTarget = type === "email" ? target.trim().toLowerCase() : target.trim();
  const user =
    type === "email"
      ? await User.findOne({ email: normalizedTarget })
      : await User.findOne({ phone: normalizedTarget });

  if (!user) {
    return {
      canVerify: false,
      reason: "not_found",
      type,
      target: normalizedTarget,
    };
  }

  const isVerified = type === "email" ? user.emailVerified : user.phoneVerified;
  if (isVerified) {
    return {
      canVerify: false,
      reason: "already_verified",
      type,
      target: normalizedTarget,
    };
  }

  if (user.status !== UserStatus.PENDING) {
    return {
      canVerify: false,
      reason: "not_pending",
      type,
      target: normalizedTarget,
    };
  }

  if (!user.verificationCode) {
    return {
      canVerify: false,
      reason: "no_code",
      type,
      target: normalizedTarget,
    };
  }

  if (user.verificationCodeExpiresAt && user.verificationCodeExpiresAt < new Date()) {
    return {
      canVerify: false,
      reason: "code_expired",
      type,
      target: normalizedTarget,
    };
  }

  return {
    canVerify: true,
    reason: "pending",
    type,
    target: normalizedTarget,
  };
};

export const resendVerificationCode = async (
  type: "email" | "phone",
  target: string
): Promise<ResendVerificationResult> => {
  const normalizedTarget = type === "email" ? target.trim().toLowerCase() : target.trim();
  const user =
    type === "email"
      ? await User.findOne({ email: normalizedTarget })
      : await User.findOne({ phone: normalizedTarget });

  if (!user) {
    throw new NotFoundError("Verification target not found");
  }

  const isVerified = type === "email" ? user.emailVerified : user.phoneVerified;
  if (isVerified) {
    throw new ConflictError("This account is already verified");
  }

  if (user.status !== UserStatus.PENDING) {
    throw new ConflictError("This account is not pending verification");
  }

  const emailVerification = createEmailVerificationPayload();
  const verificationCode =
    type === "email" ? emailVerification.code : crypto.randomInt(100000, 999999).toString();
  const verificationCodeExpiresAt =
    type === "email" ? emailVerification.expiresAt : new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  user.verificationCode = verificationCode;
  user.verificationCodeExpiresAt = verificationCodeExpiresAt;
  if (type === "email") {
    user.emailVerificationTokenHash = emailVerification.tokenHash;
    user.emailVerificationTokenExpiresAt = emailVerification.expiresAt;
  }
  await user.save();

  if (type === "email") {
    const verificationLink = buildEmailVerificationLink(
      emailVerification.token,
      normalizedTarget
    );

    await sendVerificationEmail({
      to: normalizedTarget,
      code: verificationCode,
      link: verificationLink,
    });
  } else {
    console.log(`Phone verification code for ${normalizedTarget}: ${verificationCode}`);
  }

  return {
    message: "A new verification code has been sent.",
    verificationTarget: type,
  };
};

export const login = async (
  identifier: string,
  password: string
): Promise<LoginResult> => {
  const normalizedIdentifier = identifier.trim().toLowerCase();
  const user = await User.findOne({
    $or: [{ email: normalizedIdentifier }, { phone: normalizedIdentifier }],
  }).select("+passwordHash");

  if (!user) {
    throw new UnauthorizedError("Invalid credentials");
  }

  const isValidPassword = await comparePassword(password, user.passwordHash);
  if (!isValidPassword) {
    throw new UnauthorizedError("Invalid credentials");
  }

  if (user.status === UserStatus.PENDING) {
    throw new UnauthorizedError("Account not verified");
  }

  if (user.isTemporary) {
    throw new UnauthorizedError("Temporary accounts cannot be accessed after logout. Claim your account to keep it.");
  }

  if (user.status === UserStatus.BANNED) {
    const ban = await Ban.findOne({ userId: user._id, active: true })
      .sort({ createdAt: -1 })
      .lean();
    const reason = ban?.reason ? `: ${ban.reason}` : "";
    throw new UnauthorizedError(`Account is banned${reason}`);
  }

  const tokens = await generateTokens(user._id.toString(), user.anonimiId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      anonimiId: user.anonimiId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt && !user.isTemporary,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      isTemporary: !!user.isTemporary,
      tempExpiresAt: user.tempExpiresAt ?? null,
    },
  };
};

export const refreshToken = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken);

  const storedToken = await RefreshToken.findOne({
    token: refreshToken,
    userId: decoded.userId,
  });

  if (!storedToken) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (storedToken.expiresAt < new Date()) {
    await RefreshToken.deleteOne({ _id: storedToken._id });
    throw new UnauthorizedError("Refresh token expired");
  }

  const user = await User.findById(decoded.userId);

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  if (isTemporaryExpired(user)) {
    await removeTemporaryAccount(user._id.toString());
    throw new UnauthorizedError("Temporary session expired");
  }

  if (user.status === UserStatus.BANNED) {
    throw new UnauthorizedError("Account is banned");
  }

  await RefreshToken.deleteOne({ _id: storedToken._id });

  const tokens = await generateTokens(user._id.toString(), user.anonimiId, user.role);

  return tokens;
};

export const forgotPassword = async (email: string): Promise<string> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    const resetLink = buildPasswordResetLink(resetToken);
    await sendPasswordResetEmail({ to: normalizedEmail, link: resetLink });
  }

  return "If an account with this email exists, a reset link has been sent.";
};

export const claimTemporaryAccount = async (
  userId: string,
  email: string,
  password: string
): Promise<RegisterResult> => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (!user.isTemporary) {
    throw new ConflictError("Account is already claimed");
  }

  if (user.email) {
    throw new ConflictError("Account is already claimed");
  }

  if (isTemporaryExpired(user)) {
    await removeTemporaryAccount(user._id.toString());
    throw new UnauthorizedError("Temporary session expired");
  }

  const existingUser = await User.findOne({ email: normalizedEmail }).select("_id");
  if (existingUser) {
    throw new ConflictError("Email already in use");
  }

  const emailVerification = createEmailVerificationPayload();

  user.email = normalizedEmail;
  user.passwordHash = await hashPassword(password);
  user.verificationCode = emailVerification.code;
  user.verificationCodeExpiresAt = emailVerification.expiresAt;
  user.emailVerificationTokenHash = emailVerification.tokenHash;
  user.emailVerificationTokenExpiresAt = emailVerification.expiresAt;
  user.emailVerified = false;
  user.status = UserStatus.PENDING;
  await user.save();

  const verificationLink = buildEmailVerificationLink(
    emailVerification.token,
    normalizedEmail
  );

  await sendVerificationEmail({
    to: normalizedEmail,
    code: emailVerification.code,
    link: verificationLink,
  });

  return {
    message: "Verification code sent. Please verify your account.",
    verificationTarget: "email",
  };
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<LoginResult> => {
  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpiresAt: { $gt: new Date() },
  });

  if (!user) {
    throw new UnauthorizedError("Invalid or expired reset token");
  }

  user.passwordHash = await hashPassword(newPassword);
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  await RefreshToken.deleteMany({ userId: user._id });

  const tokens = await generateTokens(user._id.toString(), user.anonimiId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      anonimiId: user.anonimiId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
      isTemporary: !!user.isTemporary,
      tempExpiresAt: user.tempExpiresAt ?? null,
    },
  };
};

export const logout = async (
  userId: string,
  refreshToken: string
): Promise<void> => {
  const user = await User.findById(userId).select("isTemporary");
  if (user?.isTemporary) {
    await removeTemporaryAccount(userId);
    return;
  }

  await RefreshToken.deleteOne({
    userId: new Types.ObjectId(userId),
    token: refreshToken,
  });
};

const generateTokens = async (
  userId: string,
  anonimiId: string,
  role: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = generateAccessToken({ userId, anonimiId, role });
  const refreshToken = generateRefreshTokenUtil({ userId, anonimiId, role });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await RefreshToken.create({
    userId: new Types.ObjectId(userId),
    token: refreshToken,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

export const getProfile = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return user;
};

export const updateProfile = async (
  userId: string,
  updates: { username?: string; phone?: string; appearanceStatus?: AppearanceStatus }
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new NotFoundError("User not found");
  }

  if (updates.username && updates.username !== user.username) {
    if (user.isTemporary) {
      throw new ForbiddenError("Temporary accounts cannot change username");
    }
    const existingUser = await User.findOne({
      username: updates.username,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ConflictError("Username already taken");
    }

    if (user.usernameChangedAt) {
      throw new ConflictError("Username can only be changed once");
    }

    user.username = updates.username;
    user.usernameChangedAt = new Date();
  }

  if (updates.phone) {
    user.phone = updates.phone;
  }

  if (updates.appearanceStatus) {
    user.appearanceStatus = updates.appearanceStatus;
    user.onlineStatus =
      updates.appearanceStatus === AppearanceStatus.INVISIBLE
        ? OnlineStatus.OFFLINE
        : (updates.appearanceStatus as unknown as OnlineStatus);
    user.lastSeen = new Date();
  }

  await user.save();

  return user;
};

export const updateAvatar = async (
  userId: string,
  profileImage: string
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { profileImage },
    { new: true }
  );

  if (!user) {
    throw new NotFoundError("User not found");
  }

  return { profileImage: user.profileImage };
};

export const removeAvatar = async (userId: string) => {
  const user = await User.findById(userId).select("profileImage");

  if (!user) {
    throw new NotFoundError("User not found");
  }

  const previousProfileImage = user.profileImage;

  user.profileImage = null;
  await user.save();

  if (env.DELETE_AVATAR_FILE_ON_REMOVE && previousProfileImage?.startsWith("/uploads/")) {
    const uploadRoot = path.resolve(env.UPLOAD_DIR);
    const relativeUploadPath = previousProfileImage.replace(/^\/uploads\//, "");
    const absoluteUploadPath = path.resolve(uploadRoot, relativeUploadPath);

    if (absoluteUploadPath === uploadRoot || !absoluteUploadPath.startsWith(uploadRoot + path.sep)) {
      return { profileImage: user.profileImage };
    }

    try {
      await fs.promises.unlink(absoluteUploadPath);
    } catch {
      // Ignore missing files and keep profile update successful.
    }
  }

  return { profileImage: user.profileImage };
};
