import { z } from "zod";

export const searchUsersSchema = z.object({
  query: z.object({
    q: z.string().min(2, "Search query must be at least 2 characters"),
    limit: z.coerce.number().min(1).max(50).default(10),
    cursor: z.string().optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_.]+$/,
        "Username can only contain letters, numbers, underscores and periods"
      )
      .optional(),
    phone: z.string().nullable().optional(),
    appearanceStatus: z.enum(["online", "away", "dnd", "invisible"]).optional(),
    fontStyle: z.enum(["modern", "system", "editorial", "rounded", "humanist", "mono"]).optional(),
  }),
});

export const userParamsSchema = z.object({
  params: z.object({
    anonimiId: z.string(),
  }),
});
