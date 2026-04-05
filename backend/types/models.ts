import { Document, Types } from "mongoose";
import { UserRole, UserStatus, OnlineStatus, AppearanceStatus } from "./enums";

export interface IUser extends Document {
  _id: Types.ObjectId;
  anonimiId: string;
  username: string;
  email?: string | null;
  phone?: string;
  passwordHash?: string;
  profileImage?: string;
  isTemporary?: boolean;
  tempCreatedAt?: Date;
  tempExpiresAt?: Date;
  tempMediaCount?: number;
  role: UserRole;
  status: UserStatus;
  appearanceStatus: AppearanceStatus;
  onlineStatus: OnlineStatus;
  lastSeen?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiresAt?: Date;
  emailVerificationTokenHash?: string;
  emailVerificationTokenExpiresAt?: Date;
  passwordResetToken?: string;
  passwordResetExpiresAt?: Date;
  usernameChangedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversation extends Document {
  _id: Types.ObjectId;
  type: "private" | "group";
  participants: Types.ObjectId[];
  mutedUsers?: Array<{
    userId: Types.ObjectId;
    mutedUntil?: Date | null;
  }>;
  lastMessage?: {
    content?: string;
    senderId: Types.ObjectId;
    type: string;
    timestamp: Date;
    isE2ee?: boolean;
    e2eeCipher?: string;
    e2eeIv?: string;
    e2eeTag?: string;
  };
  requestStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationArchive extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  archivedAt: Date;
  deletedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: "text" | "image" | "video" | "audio" | "file" | "system";
  content?: string;
  isStealth?: boolean;
  stealthExpiresAt?: Date;
  stealthExpiredAt?: Date | null;
  stealthContentCipher?: string;
  stealthContentIv?: string;
  stealthContentTag?: string;
  stealthContentLength?: number;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyTo?: Types.ObjectId | null;
  replyPreview?: {
    messageId: Types.ObjectId;
    senderId: Types.ObjectId;
    senderUsername?: string | null;
    type: string;
    content?: string | null;
    mediaUrl?: string | null;
    fileName?: string | null;
    createdAt?: Date;
  };
  readBy: Types.ObjectId[];
  readByAt?: Map<string, Date>;
  reactions: Array<{
    _id: Types.ObjectId;
    userId: Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  editHistory?: Array<{
    content: string;
    editedAt: Date;
    editedBy: Types.ObjectId;
  }>;
  editedAt?: Date;
  editedBy?: Types.ObjectId;
  deletedFor: Types.ObjectId[];
  unsent: boolean;
  isE2ee?: boolean;
  e2eeCipher?: string;
  e2eeIv?: string;
  e2eeTag?: string;
  e2eeKeyId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IContact extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
  nickname?: string;
  status: "pending" | "accepted" | "declined";
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroup extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  name: string;
  description?: string;
  image?: string;
  ownerId: Types.ObjectId;
  settings: {
    joinRequestEnabled: boolean;
    nicknameEditPolicy: "admins_only" | "all_members";
    groupProfileEditPolicy: "admins_only" | "all_members";
  };
  disbandedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupMember extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  role: "owner" | "admin" | "member";
  nickname?: string;
  mutedUntil?: Date;
  muteReason?: string;
  joinedVia?: "group_create" | "manual_add" | "invite_link" | "direct_request";
  addedByUserId?: Types.ObjectId;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupJoinRequest extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  userId: Types.ObjectId;
  inviterUserId?: Types.ObjectId;
  source: "manual_add" | "invite_link" | "direct";
  status: "pending" | "approved" | "rejected" | "cancelled";
  inviteLinkId?: Types.ObjectId;
  decisionBy?: Types.ObjectId;
  decisionAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IGroupInviteLink extends Document {
  _id: Types.ObjectId;
  groupId: Types.ObjectId;
  createdBy: Types.ObjectId;
  token: string;
  description?: string;
  expiresAt: Date;
  revokedAt?: Date;
  revokedBy?: Types.ObjectId;
  maxUses?: number;
  usedCount: number;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBlock extends Document {
  _id: Types.ObjectId;
  blockerId: Types.ObjectId;
  blockedId: Types.ObjectId;
  active: boolean;
  lastUnblockedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessageRequest extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  fromUserId: Types.ObjectId;
  toUserId: Types.ObjectId;
  status: "pending" | "accepted" | "ignored";
  createdAt: Date;
  updatedAt: Date;
}

export interface IReport extends Document {
  _id: Types.ObjectId;
  reporterId: Types.ObjectId;
  targetType: "user" | "message" | "group";
  targetId: Types.ObjectId;
  reason: string;
  description?: string;
  messageSnapshot?: {
    content: string;
    type: string;
    senderId: Types.ObjectId;
    senderUsername: string;
    conversationId: Types.ObjectId;
    mediaUrl?: string;
    originalCreatedAt: Date;
  };
  status: string;
  reviewedBy?: Types.ObjectId;
  resolution?: string;
  resolutionNotes?: string;
  reporterNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportTicket extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  subject: string;
  reason: string;
  status: string;
  assignedTo?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISupportMessage extends Document {
  _id: Types.ObjectId;
  ticketId: Types.ObjectId;
  senderId: Types.ObjectId;
  senderRole: "user" | "staff";
  type: "text" | "image";
  content?: string | null;
  mediaUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAdminLog extends Document {
  _id: Types.ObjectId;
  adminId: Types.ObjectId;
  action: string;
  targetType: string;
  targetId: Types.ObjectId;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export interface IUserDeletionRequest extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  requestedBy: Types.ObjectId;
  status: "pending" | "approved" | "rejected";
  reason?: string | null;
  decidedBy?: Types.ObjectId | null;
  decidedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBan extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  reason: string;
  bannedBy: Types.ObjectId;
  type: "temporary" | "permanent";
  expiresAt?: Date;
  active: boolean;
  unbannedBy?: Types.ObjectId;
  unbannedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IRefreshToken extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface INotification extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IPushSubscription extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  expirationTime?: number;
  userAgent?: string;
  revokedAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IE2EEKey extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  publicKey: string;
  encryptedPrivateKey: string;
  iv: string;
  tag: string;
  algorithm: string;
  keyVersion: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IConversationKey extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  keyVersion: number;
  encryptedKeys: Array<{
    userId: Types.ObjectId;
    encryptedKey: string;
  }>;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
