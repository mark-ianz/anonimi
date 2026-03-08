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
}

export interface MessageReceivePayload {
  messageId: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  senderProfileImage: string | null;
  type: MessageType;
  content: string | null;
  mediaUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  timestamp: string;
}

export interface MessageUnsentPayload {
  messageId: string;
  conversationId: string;
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
  lastSeen: string;
}

export interface ContactRequestPayload {
  requestId: string;
  from: {
    id: string;
    echoId: string;
    username: string;
    profileImage: string | null;
  };
  createdAt: string;
}

export interface ContactAcceptedPayload {
  contactId: string;
  echoId: string;
  username: string;
  profileImage: string | null;
}

export interface MessageRequestNewPayload {
  requestId: string;
  conversationId: string;
  from: {
    id: string;
    echoId: string;
    username: string;
    profileImage: string | null;
  };
  preview: {
    content: string | null;
    type: MessageType;
    timestamp: string;
  };
}

export interface GroupMemberJoinedPayload {
  groupId: string;
  member: {
    userId: string;
    echoId: string;
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
    settings?: { joinRequestEnabled?: boolean };
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
  type:
    | "contact_request"
    | "message_request"
    | "group_invite"
    | "ticket_reply"
    | "warning"
    | "system";
  title: string;
  body: string;
  data: Record<string, unknown>;
  createdAt: string;
}

export interface SocketError {
  code: string;
  message: string;
  event: string;
}
