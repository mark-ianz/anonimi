import { Document, Types } from "mongoose";
import { UserRole, UserStatus, OnlineStatus, AppearanceStatus } from "./enums";

export interface IUser extends Document {
  _id: Types.ObjectId;
  echoId: string;
  username: string;
  email: string;
  phone?: string;
  passwordHash: string;
  profileImage?: string;
  role: UserRole;
  status: UserStatus;
  appearanceStatus: AppearanceStatus;
  onlineStatus: OnlineStatus;
  lastSeen?: Date;
  emailVerified: boolean;
  phoneVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiresAt?: Date;
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
  lastMessage?: {
    content?: string;
    senderId: Types.ObjectId;
    type: string;
    timestamp: Date;
  };
  requestStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  type: "text" | "image" | "file" | "system";
  content?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  readBy: Types.ObjectId[];
  deletedFor: Types.ObjectId[];
  unsent: boolean;
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
  image?: string;
  ownerId: Types.ObjectId;
  settings: {
    joinRequestEnabled: boolean;
  };
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
  joinedAt: Date;
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
  content: string;
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
