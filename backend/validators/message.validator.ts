import { z } from "zod";
import { REACTION_EMOJIS } from "../constants/reactions";

export const getMessagesSchema = z.object({
  query: z.object({
    conversationId: z.string(),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(30),
  }),
});

export const searchMessagesSchema = z.object({
  query: z.object({
    tokens: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]).optional(),
    conversationId: z.string().optional(),
    senderId: z.string().optional(),
    before: z.string().optional(),
    after: z.string().optional(),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    conversationId: z.string(),
    type: z.enum(["text", "image", "video", "audio", "file"]),
    content: z.string().trim().max(256).nullable().optional(),
    mediaUrl: z.string().optional(),
    fileName: z.string().optional(),
    fileSize: z.number().int().positive().optional(),
    replyToId: z.string().optional(),
    stealthDuration: z
      .enum(["1m", "5m", "15m", "30m", "1h", "3h", "6h", "12h", "24h"])
      .optional(),
    contentCipher: z.string().optional(),
    contentIv: z.string().optional(),
    contentTag: z.string().optional(),
    contentKeyVersion: z.number().int().nonnegative().optional(),
    searchTokens: z.array(z.string()).optional(),
  }),
});

export const messageParamsSchema = z.object({
  params: z.object({
    messageId: z.string(),
  }),
});

export const editMessageSchema = z.object({
  params: z.object({
    messageId: z.string(),
  }),
  body: z.object({
    content: z.string().trim().max(256).nullable().optional(),
    contentCipher: z.string().optional(),
    contentIv: z.string().optional(),
    contentTag: z.string().optional(),
    contentKeyVersion: z.number().int().nonnegative().optional(),
  }),
});

export const muteConversationSchema = z.object({
  params: z.object({
    conversationId: z.string(),
  }),
  body: z
    .object({
      durationMinutes: z.number().int().positive().max(43200).optional(),
    })
    .optional(),
});

export const addReactionSchema = z.object({
  params: z.object({
    messageId: z.string(),
  }),
  body: z.object({
    emoji: z.enum(REACTION_EMOJIS),
  }),
});

export const removeReactionSchema = z.object({
  params: z.object({
    messageId: z.string(),
    reactionId: z.string(),
  }),
});
