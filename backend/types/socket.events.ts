export interface MessageSendPayload {
  conversationId: string;
  type: "text" | "image" | "file";
  content?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  stealthDuration?: "1m" | "5m" | "15m" | "30m" | "1h" | "3h" | "6h" | "12h" | "24h";
  tempId: string;
  contentCipher?: string;
  contentIv?: string;
  contentTag?: string;
  contentKeyVersion?: number;
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

export interface MessageAckPayload {
  tempId: string;
  messageId: string;
  conversationId: string;
  timestamp: string;
}

export interface MessageReceivePayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderProfileImage?: string;
  type: string;
  content?: string;
  isStealth?: boolean;
  stealthExpiresAt?: string;
  stealthExpiredAt?: string | null;
  stealthContentLength?: number;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: string;
  isE2ee?: boolean;
  contentCipher?: string | null;
  contentIv?: string | null;
  contentTag?: string | null;
  contentKeyVersion?: number | null;
  replyToId?: string | null;
  replyPreview?: {
    messageId: string;
    senderId: string | null;
    senderUsername?: string | null;
    type: string;
    content: string | null;
    mediaUrl?: string | null;
    fileName?: string | null;
    createdAt?: string;
  } | null;
  contentLength?: number | null;
  suppressUnread?: boolean;
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
}

export interface MessageEditedPayload {
  messageId: string;
  conversationId: string;
  content: string | null;
  editedAt: string;
  editedBy: string;
  createdAt: string;
  isE2ee?: boolean;
  contentCipher?: string | null;
  contentIv?: string | null;
  contentTag?: string | null;
  contentKeyVersion?: number | null;
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

export interface MessageReadEventPayload {
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
  status: "online" | "away" | "dnd" | "offline";
  lastSeen?: string;
}

export interface PresenceSetStatusPayload {
  status: "online" | "away" | "dnd" | "invisible";
}

export interface ContactRequestPayload {
  requestId: string;
  from: {
    id: string;
    anonimiId: string;
    username: string;
    profileImage?: string;
  };
  createdAt: string;
}

export interface ContactAcceptedPayload {
  contactId: string;
  anonimiId: string;
  username: string;
  profileImage?: string;
}

export interface ContactRequestCancelledPayload {
  fromUserId: string;
  fromAnonimiId?: string;
}

export interface MessageRequestNewPayload {
  requestId: string;
  conversationId: string;
  from: {
    id: string;
    anonimiId: string;
    username: string;
    profileImage?: string;
  };
  preview: {
    content: string;
    type: string;
    timestamp: string;
  };
}

export interface GroupMemberJoinedPayload {
  groupId: string;
  member: {
    userId: string;
    anonimiId: string;
    username: string;
    profileImage?: string;
    role: string;
  };
  addedBy: {
    userId: string;
    username: string;
  };
}

export interface GroupMemberLeftPayload {
  groupId: string;
  userId: string;
  username: string;
  reason: "left" | "removed";
  removedBy?: string;
}

export interface GroupUpdatedPayload {
  groupId: string;
  changes: {
    name?: string;
    image?: string;
    settings?: {
      joinRequestEnabled?: boolean;
      groupProfileEditPolicy?: "admins_only" | "all_members";
    };
  };
  updatedBy: {
    userId: string;
    username: string;
  };
}

export interface GroupRoleChangedPayload {
  groupId: string;
  userId: string;
  username: string;
  oldRole: string;
  newRole: string;
  changedBy: {
    userId: string;
    username: string;
  };
}

export interface ErrorPayload {
  code: string;
  message: string;
  event?: string;
}

export interface E2EEKeyRegisterPayload {
  publicKey: string;
  encryptedPrivateKey: string;
  iv: string;
  tag: string;
}

export interface E2EEKeyResponse {
  userId: string;
  publicKey: string;
  keyVersion: number;
}

export interface E2EESendPayload {
  conversationId: string;
  type: "text" | "image" | "video" | "audio" | "file";
  cipherText: string;
  iv: string;
  tag: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  replyToId?: string;
  stealthDuration?: "1m" | "5m" | "15m" | "30m" | "1h" | "3h" | "6h" | "12h" | "24h";
  tempId: string;
}

export interface E2EEReceivePayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderProfileImage?: string;
  type: string;
  cipherText: string;
  iv: string;
  tag: string;
  contentKeyVersion?: number | null;
  isStealth?: boolean;
  stealthExpiresAt?: string;
  stealthContentLength?: number;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: string;
}

export interface GroupKeyRotatedPayload {
  groupId: string;
  conversationId: string;
  keyVersion: number;
  encryptedKey: string;
}

export interface GroupKeyDistributedPayload {
  groupId: string;
  conversationId: string;
  keyVersion: number;
  encryptedKey: string;
}
