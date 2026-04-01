export type GroupRole = "owner" | "admin" | "member";
export type GroupMemberStatus = "joined" | "invited" | "requested" | "left";

export interface Group {
  id: string;
  conversationId: string;
  name: string;
  description?: string;
  image: string | null;
  ownerId: string;
  settings: {
    joinRequestEnabled: boolean;
    nicknameEditPolicy?: "admins_only" | "all_members";
    groupProfileEditPolicy?: "admins_only" | "all_members";
  };
  memberCount: number;
  myRole: GroupRole;
  photoFallbackUserIds?: string[];
  createdAt: string;
}

export interface GroupMember {
  userId: string;
  anonimiId: string;
  username: string;
  profileImage: string | null;
  role: GroupRole;
  nickname: string | null;
  joinedVia?: "group_create" | "manual_add" | "invite_link" | "direct_request";
  addedBy?: {
    id: string;
    anonimiId: string;
    username: string;
  } | null;
  joinedAt: string;
  status?: GroupMemberStatus;
  mutedUntil?: string;
}

export interface GroupJoinRequest {
  requestId: string;
  status?: "pending" | "approved" | "rejected" | "cancelled";
  source?: "manual_add" | "invite_link" | "direct";
  user: {
    id: string;
    anonimiId: string;
    username: string;
    profileImage: string | null;
  };
  inviter?: {
    id: string;
    anonimiId: string;
    username: string;
  } | null;
  createdAt: string;
}

export interface GroupInviteLink {
  inviteLinkId: string;
  token: string;
  joinUrl: string;
  description?: string;
  expiresAt: string;
  revokedAt: string | null;
  maxUses: number | null;
  usedCount: number;
  qrCode?: string;
  createdBy?: {
    id: string;
    anonimiId: string;
    username: string;
  } | null;
  createdAt: string;
}

export interface GroupInfoByToken {
  groupId: string;
  groupName: string;
  groupImage?: string;
  memberCount: number;
  description?: string;
}

export interface JoinResult {
  status: "joined" | "already_member" | "pending_approval";
  groupId: string;
  conversationId?: string;
  requestId?: string;
}
