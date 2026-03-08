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
    content: z.string().min(1, "Message content is required"),
  }),
});
