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

export const pushSubscribeSchema = z.object({
  body: z.object({
    endpoint: z.string().min(1),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
    expirationTime: z.number().nullable().optional(),
    userAgent: z.string().optional(),
  }),
});

export const pushUnsubscribeSchema = z.object({
  body: z
    .object({
      endpoint: z.string().min(1).optional(),
    })
    .optional(),
});
