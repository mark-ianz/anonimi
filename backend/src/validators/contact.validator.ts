import { z } from "zod";

export const sendContactRequestSchema = z.object({
  body: z.object({
    targetAnonimiId: z.string().min(1, "Target AID is required"),
  }),
});

export const contactParamsSchema = z.object({
  params: z.object({
    contactId: z.string(),
  }),
});

export const cancelContactRequestSchema = z.object({
  body: z.object({
    targetAnonimiId: z.string().min(1, "Target AID is required"),
  }),
});

export const updateNicknameSchema = z.object({
  body: z.object({
    nickname: z.string().max(50, "Nickname must be at most 50 characters").nullable(),
  }),
});
