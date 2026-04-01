import type { OnlineStatus } from "./user";
import type { MessageType } from "./message";

export type ConversationType = "private" | "group";

export interface ConversationParticipant {
  id: string;
  anonimiId: string;
  username: string;
  nickname: string | null;
  contactId: string | null;
  blockId?: string | null;
  blockedByMe?: boolean;
  profileImage: string | null;
  onlineStatus: OnlineStatus;
}

export interface ConversationGroup {
  id: string;
  name: string;
  image: string | null;
  memberCount: number;
  fallbackProfileImages?: Array<string | null>;
  disbandedAt?: string | null;
}

export interface LastMessage {
  content: string | null;
  senderId: string;
  senderUsername?: string;
  type: MessageType;
  timestamp: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  isArchived?: boolean;
  participant?: ConversationParticipant;
  group?: ConversationGroup;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
  createdAt?: string;
  requestStatus?: string | null;
  /** ID of the MessageRequest document (present on pending/accepted/ignored private convs) */
  requestId?: string | null;
  /** ID of the user who initiated the message request */
  requestFromUserId?: string | null;
}
