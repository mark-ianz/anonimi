import { z } from "zod";

export const blockUserSchema = z.object({
  body: z.object({
    targetEchoId: z.string().min(1, "Target EchoID is required"),
  }),
});

export const blockParamsSchema = z.object({
  params: z.object({
    blockId: z.string(),
  }),
});
