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
    q: z.string().min(2).max(80),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(20),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    conversationId: z.string(),
    type: z.enum(["text", "image", "file"]),
    content: z.string().trim().max(256).optional(),
    mediaUrl: z.string().optional(),
    stealthDuration: z
      .enum(["1m", "5m", "15m", "30m", "1h", "3h", "6h", "12h", "24h"])
      .optional(),
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
    content: z.string().trim().min(1).max(256),
  }),
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
