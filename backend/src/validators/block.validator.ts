import { z } from "zod";

export const blockUserSchema = z.object({
  body: z.object({
    targetAnonimiId: z.string().min(1, "Target AID is required"),
  }),
});

export const blockParamsSchema = z.object({
  params: z.object({
    blockId: z.string(),
  }),
});
