import crypto from "crypto";
import { Types } from "mongoose";
import { User } from "../models/user.model";
import { RefreshToken } from "../models/refreshToken.model";
import { generateEchoId } from "../utils/generateId";
import { hashPassword, comparePassword } from "../utils/hashPassword";
import {
  generateAccessToken,
  generateRefreshToken as generateRefreshTokenUtil,
  verifyRefreshToken,
} from "../utils/jwt";
import { ConflictError, UnauthorizedError, NotFoundError } from "../utils/apiError";
import { AppearanceStatus, OnlineStatus, UserRole, UserStatus } from "../types/enums";
import { createAdminLog } from "./admin.service";

interface RegisterResult {
  message: string;
  verificationTarget: string;
}

interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    echoId: string;
    username: string;
    profileImage: string | null;
    role: string;
    status: string;
    usernameCanEdit: boolean;
    appearanceStatus: string;
    onlineStatus: string;
    lastSeen: Date | null;
  };
}

const USERNAME_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

const generateCryptoUsername = (): string => {
  const bytes = crypto.randomBytes(6);
  let suffix = "";

  for (const byte of bytes) {
    suffix += USERNAME_ALPHABET[byte % USERNAME_ALPHABET.length];
  }

  return `anon_${suffix}`;
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

  const verificationCode = crypto.randomInt(100000, 999999).toString();
  const verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

  const passwordHash = await hashPassword(password);

  const user = await User.create({
    echoId: generateEchoId(),
    email: normalizedEmail,
    username: resolvedUsername,
    passwordHash,
    verificationCode,
    verificationCodeExpiresAt,
    role: UserRole.USER,
    status: UserStatus.PENDING,
  });

  console.log(`Verification code for ${normalizedEmail}: ${verificationCode}`);

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
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  user.status = UserStatus.ACTIVE;
  await user.save();

  const tokens = await generateTokens(user._id.toString(), user.echoId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      echoId: user.echoId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
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
  user.verificationCode = undefined;
  user.verificationCodeExpiresAt = undefined;
  user.status = UserStatus.ACTIVE;
  await user.save();

  const tokens = await generateTokens(user._id.toString(), user.echoId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      echoId: user.echoId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
    },
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

  if (user.status === UserStatus.BANNED) {
    throw new UnauthorizedError("Account is banned");
  }

  const tokens = await generateTokens(user._id.toString(), user.echoId, user.role);

  return {
    ...tokens,
    user: {
      id: user._id.toString(),
      echoId: user.echoId,
      username: user.username,
      profileImage: user.profileImage,
      role: user.role,
      status: user.status,
      usernameCanEdit: !user.usernameChangedAt,
      appearanceStatus: user.appearanceStatus,
      onlineStatus: user.onlineStatus,
      lastSeen: user.lastSeen,
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

  if (user.status === UserStatus.BANNED) {
    throw new UnauthorizedError("Account is banned");
  }

  await RefreshToken.deleteOne({ _id: storedToken._id });

  const tokens = await generateTokens(user._id.toString(), user.echoId, user.role);

  return tokens;
};

export const forgotPassword = async (email: string): Promise<string> => {
  const user = await User.findOne({ email });

  if (user) {
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = resetToken;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  return "If an account with this email exists, a reset link has been sent.";
};

export const resetPassword = async (
  token: string,
  newPassword: string
): Promise<string> => {
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

  return "Password reset successful. Please log in.";
};

export const logout = async (
  userId: string,
  refreshToken: string
): Promise<void> => {
  await RefreshToken.deleteOne({
    userId: new Types.ObjectId(userId),
    token: refreshToken,
  });
};

const generateTokens = async (
  userId: string,
  echoId: string,
  role: string
): Promise<{ accessToken: string; refreshToken: string }> => {
  const accessToken = generateAccessToken({ userId, echoId, role });
  const refreshToken = generateRefreshTokenUtil({ userId, echoId, role });

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
