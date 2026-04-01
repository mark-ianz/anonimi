export type MessageType = "text" | "image" | "video" | "audio" | "file" | "system";

export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"] as const;

export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export interface MessageReaction {
  id: string;
  userId: string;
  emoji: ReactionEmoji;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  type: MessageType;
  content: string | null;
  mediaUrl: string | null;
  fileName: string | null;
  fileSize: number | null;
  readBy: string[];
  readByAt?: Record<string, string>;
  reactions: MessageReaction[];
  unsent: boolean;
  unsentAt?: string | null;
  createdAt: string;
  // Optimistic UI fields
  tempId?: string;
  pending?: boolean;
  failed?: boolean;
}

export interface SendMessagePayload {
  conversationId: string;
  type: MessageType;
  content: string | null;
  mediaUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  tempId: string;
}
