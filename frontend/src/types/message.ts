export type MessageType = "text" | "image" | "video" | "audio" | "file" | "system";

export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

export interface MessageEditHistoryEntry {
  content: string;
  editedAt: string;
  editedBy: string;
}

export interface ReplyPreview {
  messageId: string;
  senderId: string | null;
  senderUsername?: string | null;
  type: MessageType;
  content: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  createdAt?: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  isStealth?: boolean;
  stealthExpiresAt?: string | null;
  stealthExpiredAt?: string | null;
  mediaUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  contentLength?: number | null;
  readBy: string[];
  readByAt?: Record<string, string>;
  reactions: MessageReaction[];
  editHistory?: MessageEditHistoryEntry[];
  editedAt?: string | null;
  editedBy?: string | null;
  unsent: boolean;
  unsentAt?: string | null;
  isE2ee?: boolean;
  contentCipher?: string | null;
  contentIv?: string | null;
  contentTag?: string | null;
  contentKeyVersion?: number | null;
  createdAt: string;
  // Optimistic UI fields
  tempId?: string;
  pending?: boolean;
  failed?: boolean;
  replyToId?: string | null;
  replyPreview?: ReplyPreview | null;
}

export interface SendMessagePayload {
  conversationId: string;
  type: MessageType;
  content: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  replyToId?: string | null;
  stealthDuration?: "1m" | "5m" | "15m" | "30m" | "1h" | "3h" | "6h" | "12h" | "24h";
  tempId: string;
  contentCipher?: string;
  contentIv?: string;
  contentTag?: string;
  contentKeyVersion?: number;
}

export interface MessageSearchHit {
  id: string;
  conversationId: string;
  senderId: string | null;
  senderUsername: string | null;
  senderAnonimiId: string | null;
  senderProfileImage: string | null;
  type: MessageType;
  content: string | null;
  createdAt: string;
  conversationType: "private" | "group";
  conversationName: string;
  conversationImage: string | null;
  conversationFallbackImages?: Array<string | null>;
}
