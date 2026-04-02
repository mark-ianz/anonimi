import { z } from "zod";

export const createTicketSchema = z.object({
  body: z.object({
    subject: z.string().min(1, "Subject is required").max(200),
    reason: z.string().min(1, "Reason is required"),
    message: z.string().min(1, "Message is required"),
  }),
});

export const ticketParamsSchema = z.object({
  params: z.object({
    ticketId: z.string(),
  }),
});

export const replyToTicketSchema = z.object({
  body: z.object({
    content: z.string().trim().optional(),
    mediaUrl: z.string().trim().optional(),
    type: z.enum(["text", "image"]).optional(),
  }).refine(
    (data) => (data.content && data.content.length > 0) || !!data.mediaUrl,
    "Message content or media is required"
  ),
});
