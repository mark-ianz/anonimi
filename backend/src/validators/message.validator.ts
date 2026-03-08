import { z } from "zod";

export const getMessagesSchema = z.object({
  query: z.object({
    conversationId: z.string(),
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(50).default(30),
  }),
});

export const sendMessageSchema = z.object({
  body: z.object({
    conversationId: z.string(),
    type: z.enum(["text", "image", "file"]),
    content: z.string().optional(),
    mediaUrl: z.string().optional(),
  }),
});

export const messageParamsSchema = z.object({
  params: z.object({
    messageId: z.string(),
  }),
});
