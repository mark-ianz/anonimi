import { z } from "zod";

export const createReportSchema = z.object({
  body: z.object({
    targetType: z.enum(["user", "message", "group"]),
    targetId: z.string(),
    reason: z.string().min(1, "Reason is required"),
    description: z.string().max(500).optional(),
  }),
});
