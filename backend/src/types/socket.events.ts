export interface MessageSendPayload {
  conversationId: string;
  type: "text" | "image" | "file";
  content?: string;
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
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
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  timestamp: string;
}

export interface MessageUnsentPayload {
  messageId: string;
  conversationId: string;
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
