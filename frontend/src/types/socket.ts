import type { MessageType } from "./message";
import type { OnlineStatus } from "./user";
import type { GroupRole } from "./group";

// ---- Client → Server ----

export interface MessageSendPayload {
  conversationId: string;
  type: MessageType;
  content: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  replyToId?: string | null;
  stealthDuration?: "1m" | "5m" | "15m" | "30m" | "1h" | "3h" | "6h" | "12h" | "24h";
  tempId: string;
}

export interface MessageTypingPayload {
  conversationId: string;
  isTyping: boolean;
}

export interface MessageReadPayload {
  conversationId: string;
  messageIds: string[];
}

export interface ConversationJoinPayload {
  conversationId: string;
}

export interface PresenceHeartbeatPayload {
  timestamp: number;
}

// ---- Server → Client ----

export interface MessageAckPayload {
  tempId: string;
  messageId: string;
  conversationId: string;
  timestamp: string;
  replyToId?: string | null;
  replyPreview?: {
    messageId: string;
    senderId: string | null;
    senderUsername?: string | null;
    type: MessageType;
    content: string | null;
    mediaUrl?: string | null;
    fileName?: string | null;
    createdAt?: string;
  } | null;
}

export interface MessageReceivePayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderProfileImage: string | null;
  type: MessageType;
  content: string | null;
  replyToId?: string | null;
  replyPreview?: {
    messageId: string;
    senderId: string | null;
    senderUsername?: string | null;
    type: MessageType;
    content: string | null;
    mediaUrl?: string | null;
    fileName?: string | null;
    createdAt?: string;
  } | null;
  isStealth?: boolean;
  stealthExpiresAt?: string | null;
  stealthExpiredAt?: string | null;
  stealthContentLength?: number | null;
  mediaUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  timestamp: string;
  suppressUnread?: boolean;
  isE2ee?: boolean;
  e2eeCipher?: string | null;
  e2eeIv?: string | null;
  e2eeTag?: string | null;
}

export interface MessageStealthExpiredPayload {
  messageId: string;
  conversationId: string;
  stealthExpiredAt: string;
  stealthContentLength: number;
}

export interface MessageUnsentPayload {
  messageId: string;
  conversationId: string;
  unsentAt?: string;
}

export interface MessageEditedPayload {
  messageId: string;
  conversationId: string;
  content: string;
  editedAt: string;
  editedBy: string;
  createdAt: string;
  editHistory: Array<{
    content: string;
    editedAt: string;
    editedBy: string;
  }>;
}

export interface MessageReactionAddedPayload {
  conversationId: string;
  messageId: string;
  reaction: {
    id: string;
    userId: string;
    emoji: string;
    createdAt: string;
  };
}

export interface MessageReactionRemovedPayload {
  conversationId: string;
  messageId: string;
  reactionId: string;
}

export interface MessageReadReceiptPayload {
  conversationId: string;
  messageIds: string[];
  readBy: {
    userId: string;
    username: string;
    readAt: string;
  };
}

export interface TypingUpdatePayload {
  conversationId: string;
  userId: string;
  username: string;
  isTyping: boolean;
}

export interface PresenceUpdatePayload {
  userId: string;
  status: OnlineStatus;
  lastSeen?: string;
}

export interface ContactRequestPayload {
  requestId: string;
  from: {
    id: string;
    anonimiId: string;
    username: string;
    profileImage: string | null;
  };
  createdAt: string;
}

export interface ContactAcceptedPayload {
  contactId: string;
  anonimiId: string;
  username: string;
  profileImage: string | null;
}

export interface ContactRequestCancelledPayload {
  fromUserId: string;
  fromAnonimiId?: string;
}

export interface ContactNicknameUpdatedPayload {
  conversationId: string;
}

export interface MessageRequestNewPayload {
  requestId: string;
  conversationId: string;
  from: {
    id: string;
    anonimiId: string;
    username: string;
    profileImage: string | null;
  };
  preview: {
    content: string | null;
    type: MessageType;
    timestamp: string;
  };
}

export interface MessageRequestAcceptedPayload {
  requestId: string;
  conversationId: string;
  acceptedBy: {
    id: string;
    anonimiId?: string;
    username?: string;
    profileImage: string | null;
  };
  requestStatus: "accepted" | null;
}

export interface GroupMemberJoinedPayload {
  groupId: string;
  member: {
    userId: string;
    anonimiId: string;
    username: string;
    profileImage: string | null;
    role: GroupRole;
  };
  addedBy: { userId: string; username: string };
}

export interface GroupMemberLeftPayload {
  groupId: string;
  userId: string;
  username: string;
  reason: "left" | "removed";
  removedBy: { userId: string; username: string } | null;
}

export interface GroupUpdatedPayload {
  groupId: string;
  changes: {
    name?: string;
    image?: string | null;
    settings?: {
      joinRequestEnabled?: boolean;
      groupProfileEditPolicy?: "admins_only" | "all_members";
    };
  };
  updatedBy: { userId: string; username: string };
}

export interface GroupRoleChangedPayload {
  groupId: string;
  userId: string;
  username: string;
  oldRole: GroupRole;
  newRole: GroupRole;
  changedBy: { userId: string; username: string };
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read?: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface SocketError {
  code: string;
  message: string;
  event: string;
}

export interface E2EEReceivePayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderProfileImage: string | null;
  type: MessageType;
  cipherText: string;
  iv: string;
  tag: string;
  isStealth?: boolean;
  stealthExpiresAt?: string | null;
  stealthContentLength?: number | null;
  mediaUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  timestamp: string;
}

export interface E2EEGroupKeyDistributedPayload {
  groupId: string;
  conversationId: string;
  keyVersion: number;
  encryptedKey: string;
}

export interface E2EEGroupKeyRotatedPayload {
  groupId: string;
  conversationId: string;
  keyVersion: number;
  encryptedKey: string;
}
