import { z } from "zod";

export const adminUserParamsSchema = z.object({
  params: z.object({
    userId: z.string(),
  }),
});

export const banUserSchema = z.object({
  body: z.object({
    reason: z.string().min(1, "Reason is required"),
    type: z.enum(["temporary", "permanent"]),
    expiresInDays: z.number().optional(),
  }),
});

export const warnUserSchema = z.object({
  body: z.object({
    message: z.string().min(1, "Warning message is required"),
  }),
});

export const changeRoleSchema = z.object({
  body: z.object({
    role: z.enum(["user", "super_admin", "moderator", "support_staff"]),
  }),
});

export const resolveReportSchema = z.object({
  body: z.object({
    resolution: z.enum([
      "warning_issued",
      "user_banned",
      "content_removed",
      "no_action",
    ]),
    resolutionNotes: z.string().optional(),
  }),
});

export const updateTicketSchema = z.object({
  body: z.object({
    status: z
      .enum(["open", "assigned", "in_progress", "waiting_on_user", "resolved", "closed"])
      .optional(),
    assignedTo: z.string().optional(),
  }),
});

export const adminConversationParamsSchema = z.object({
  params: z.object({
    convId: z.string(),
  }),
});

export const reportParamsSchema = z.object({
  params: z.object({
    reportId: z.string(),
  }),
});

export const adminGroupParamsSchema = z.object({
  params: z.object({
    groupId: z.string(),
  }),
});
