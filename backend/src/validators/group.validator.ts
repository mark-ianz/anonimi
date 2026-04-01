import { z } from "zod";

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().max(100).optional(),
    description: z.string().max(500).optional(),
    image: z.string().nullable().optional(),
    settings: z
      .object({
        joinRequestEnabled: z.boolean().optional(),
        nicknameEditPolicy: z.enum(["admins_only", "all_members"]).optional(),
        groupProfileEditPolicy: z.enum(["admins_only", "all_members"]).optional(),
      })
      .optional(),
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
    description: z.string().max(500).optional(),
    image: z.string().nullable().optional(),
    settings: z
      .object({
        joinRequestEnabled: z.boolean().optional(),
        nicknameEditPolicy: z.enum(["admins_only", "all_members"]).optional(),
        groupProfileEditPolicy: z.enum(["admins_only", "all_members"]).optional(),
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

export const joinRequestDecisionSchema = z.object({
  body: z.object({
    action: z.enum(["approve", "reject"]),
  }),
});

export const groupJoinRequestParamsSchema = z.object({
  params: z.object({
    groupId: z.string(),
    requestId: z.string(),
  }),
});

export const createInviteLinkSchema = z.object({
  body: z.object({
    expiryMinutes: z.union([
      z.literal(30),
      z.literal(60),
      z.literal(360),
      z.literal(1440),
      z.literal(10080),
    ]),
    maxUses: z.number().int().positive().optional(),
    description: z.string().max(200).optional(),
  }),
});

export const inviteLinkParamsSchema = z.object({
  params: z.object({
    groupId: z.string(),
    inviteLinkId: z.string(),
  }),
});

export const inviteTokenParamsSchema = z.object({
  params: z.object({
    token: z.string().min(10),
  }),
});

export const transferOwnerSchema = z.object({
  body: z.object({
    userId: z.string(),
  }),
});

export const muteMemberSchema = z.object({
  body: z.object({
    durationMinutes: z.number().int().positive().max(43200).default(60),
  }),
});
