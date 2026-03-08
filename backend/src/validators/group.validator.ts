import { z } from "zod";

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1, "Group name is required").max(100),
    image: z.string().optional(),
    memberEchoIds: z.array(z.string()).min(1, "At least one member is required"),
  }),
});

export const groupParamsSchema = z.object({
  params: z.object({
    groupId: z.string(),
  }),
});

export const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    image: z.string().optional(),
    settings: z
      .object({
        joinRequestEnabled: z.boolean(),
      })
      .optional(),
  }),
});

export const addMembersSchema = z.object({
  body: z.object({
    memberEchoIds: z.array(z.string()).min(1),
  }),
});

export const groupMemberParamsSchema = z.object({
  params: z.object({
    groupId: z.string(),
    userId: z.string(),
  }),
});

export const changeRoleSchema = z.object({
  body: z.object({
    role: z.enum(["admin", "member"]),
  }),
});

export const setNicknameSchema = z.object({
  body: z.object({
    nickname: z.string().max(50).nullable(),
  }),
});
