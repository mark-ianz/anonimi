import { z } from "zod";

export const listNotificationsSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    cursor: z.string().optional(),
  }),
});

export const notificationParamsSchema = z.object({
  params: z.object({
    notificationId: z.string().min(1, "Notification id is required"),
  }),
});

export const conversationNotificationParamsSchema = z.object({
  params: z.object({
    conversationId: z.string().min(1, "Conversation id is required"),
  }),
});
